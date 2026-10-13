import { OAuth2Client } from "google-auth-library";
import configService from "../../../config/config.service.js";
import { models, queries } from "../../DB/index.js";
import {
  exceptions,
  enums,
  security,
  events,
  services,
  sendEmail,
} from "../../common/index.js";

const client = new OAuth2Client();

async function verifyGoogleAccount(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: configService.WEB_CLIENT_IDS,
  });
  const payload = ticket.getPayload();
  return payload;
}

export const signupLoginWithGmail = async ({ idToken }, issuer) => {
  const { name, email, picture, email_verified } =
    await verifyGoogleAccount(idToken);

  if (!email_verified) {
    throw exceptions.BadRequestException({ message: "error.emailNotVerified" });
  }

  const existingEmail = await queries.findOne({
    model: models.UserModel,
    filter: { email },
  });
  if (existingEmail) {
    // if the email already exist with any provider not equal google
    if (existingEmail.provider != enums.ProviderEnum.GOOGLE) {
      throw exceptions.ConflictException({ message: "error.invalidProvider" });
    }
    // login with gmail
    const { access_token, refresh_token } =
      await security.createLoginCredentials({
        user: existingEmail,
        options: { issuer },
      });

    return { status: 200, access_token, refresh_token };
  }
  // signup with gmail
  const account = await queries.create({
    model: models.UserModel,
    data: {
      username: name,
      email,
      confirmEmail: new Date(),
      image: picture,
      provider: enums.ProviderEnum.GOOGLE,
    },
  });

  const { access_token, refresh_token } = await security.createLoginCredentials(
    {
      user: account,
      options: { issuer },
    },
  );

  return { status: 201, access_token, refresh_token };
};

const sendEmailOtp = async ({
  email,
  subject = enums.EmailSubjectEnum.CONFIRM_EMAIL,
  title = "Confirm Email",
  maxTrials = configService.MAX_OTP_TRIALS,
  otpExpiresTime = configService.OTP_EXPIRES_TIME,
  blockOtpTime = configService.BLOCK_OTP_TIME,
}) => {
  const existOtpTTL = await services.ttl({
    key: sendEmail.UserEmailKey({ email, subject }),
  });

  if (existOtpTTL > 0) {
    throw exceptions.ConflictException({ message: "error.otpStillValid" });
  }

  const currentTrials =
    (await services.get({
      key: sendEmail.UserOtpTrialsKey({ email, subject }),
    })) ?? 0;

  if (currentTrials >= maxTrials) {
    throw exceptions.TooManyRequestException({
      message: "error.otpLimitReached",
    });
  }

  const otp = sendEmail.createOtp();

  await services.set({
    key: sendEmail.UserEmailKey({ email, subject }),
    value: await security.hash({ plainText: otp.toString() }),
    ttl: otpExpiresTime,
  });

  const finalTrials = await services.incrBy({
    key: sendEmail.UserOtpTrialsKey({ email, subject }),
  });

  if (finalTrials == maxTrials) {
    await services.expire({
      key: sendEmail.UserOtpTrialsKey({ email, subject }),
      ttl: blockOtpTime,
    });
  }

  events.emailEvent.emit(enums.EventsEnum.SEND_EMAIL, {
    recipient: { to: email },
    subject,
    data: { code: otp, title },
  });
};

export const signup = async (inputs) => {
  const { email, phone, password } = inputs;

  const existingEmail = await queries.findOne({
    model: models.UserModel,
    filter: { email },
  });

  if (existingEmail) {
    throw exceptions.ConflictException({ message: "error.emailExists" });
  }

  const account = await queries.create({
    model: models.UserModel,
    data: {
      ...inputs,
      password: await security.hash({ plainText: password }),
      phone: await security.encrypt(phone),
    },
  });

  await sendEmailOtp({
    email,
    title: "Confirm Email",
  });

  return;
};

export const confirmEmail = async ({ email, otp }, issuer) => {
  const account = await queries.findOne({
    model: models.UserModel,
    filter: {
      email,
      provider: enums.ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
  });

  if (!account) {
    throw exceptions.NotFoundException({ message: "error.invalidAccount" });
  }

  const hashOtp = await services.get({
    key: sendEmail.UserEmailKey({
      email,
      subject: enums.EmailSubjectEnum.CONFIRM_EMAIL,
    }),
  });

  if (!hashOtp || !(await security.compare(otp, hashOtp))) {
    throw exceptions.BadRequestException({ message: "error.invalidOtp" });
  }
  account.confirmEmail = new Date();
  await account.save();
  await services.del({
    key: await services.keys({
      prefix: sendEmail.UserEmailKey({
        email,
        subject: enums.EmailSubjectEnum.CONFIRM_EMAIL,
      }),
    }),
  });

  const { access_token, refresh_token } = await security.createLoginCredentials(
    {
      user: account,
      options: { issuer },
    },
  );

  return { access_token, refresh_token };
};

export const reSendConfirmEmail = async ({ email }) => {
  const account = await queries.findOne({
    model: models.UserModel,
    filter: {
      email,
      provider: enums.ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
  });

  if (!account) {
    throw exceptions.NotFoundException({ message: "error.invalidAccount" });
  }

  await sendEmailOtp({
    email,
    title: "Confirm Email",
  });
};

// FORGOT PASSWORD
export const requestForgetPasswordCode = async ({ email }) => {
  const account = await queries.findOne({
    model: models.UserModel,
    filter: {
      email,
      provider: enums.ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });

  if (!account) {
    throw exceptions.NotFoundException({ message: "error.invalidAccount" });
  }

  await sendEmailOtp({
    email,
    title: "Forgot password",
    subject: enums.EmailSubjectEnum.FORGOT_PASSWORD,
  });
};

export const verifyForgotPasswordCode = async ({ email, otp }) => {
  const account = await queries.findOne({
    model: models.UserModel,
    filter: {
      email,
      provider: enums.ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });

  if (!account) {
    throw exceptions.NotFoundException({ message: "error.invalidAccount" });
  }

  const hashOtp = await services.get({
    key: sendEmail.UserEmailKey({
      email,
      subject: enums.EmailSubjectEnum.FORGOT_PASSWORD,
    }),
  });

  if (!hashOtp || !(await security.compare(otp, hashOtp))) {
    throw exceptions.BadRequestException({ message: "error.invalidOtp" });
  }

  return account;
};

export const resetPassword = async ({ email, otp, password }) => {
  const account = await verifyForgotPasswordCode({ email, otp });

  account.password = await security.hash({ plainText: password });
  account.changeCredentialsTime = new Date();

  await account.save();

  const [userRevokeKeys, userEmailKeys] = await Promise.all([
    services.keys({
      prefix: security.userBaseRevokeToken({ userId: account._id }),
    }),
    services.keys({
      prefix: sendEmail.UserEmailKey({
        email,
        subject: enums.EmailSubjectEnum.FORGOT_PASSWORD,
      }),
    }),
  ]);

  await services.del({
    key: [
      ...userRevokeKeys,
      ...userEmailKeys,
      security.userBaseProfile({ userId: account._id }),
    ],
  });

  return;
};

export const login = async ({ email, password }, issuer) => {
  // Get the account that has the same email and signup with system and the confirmationEmail is true.
  const account = await queries.findOne({
    model: models.UserModel,
    filter: {
      email,
      provider: enums.ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });

  // If there is no account invalid credentials.
  if (!account)
    throw exceptions.ForbiddenException({
      message: "error.invalidCredentials",
    });

  // Compare between the password that user enter and the actual user password.
  const match = await security.compare(password, account.password);

  const LoginTrialsKey = `User::${email}::Login_Trials`;

  if (!match) {
    const currentTrials =
      (await services.get({
        key: LoginTrialsKey,
      })) ?? 0;

    if (currentTrials >= configService.MAX_INCORRECT_PASSWORD_ATTEMPTS) {
      throw exceptions.TooManyRequestException({
        message: "error.loginLimitReached",
      });
    }

    const finalTrials = await services.incrBy({
      key: LoginTrialsKey,
    });

    if (finalTrials == configService.MAX_INCORRECT_PASSWORD_ATTEMPTS) {
      await services.expire({
        key: LoginTrialsKey,
        ttl: configService.BLOCK_OTP_TIME,
      });
    }
    throw exceptions.ForbiddenException({
      message: "error.invalidCredentials",
    });
  }

  await services.del({
    key: LoginTrialsKey,
  });

  account.phone = await security.decrypt(account.phone);

  if (account.twoStepVerification) {
    await sendEmailOtp({
      email,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
      title: "Two Step Verification",
    });

    return;
  }

  const { access_token, refresh_token } = await security.createLoginCredentials(
    {
      user: account,
      options: { issuer },
    },
  );

  return { access_token, refresh_token };
};

export const loginConfirmation = async ({ email, otp }, issuer) => {
  const account = await queries.findOne({
    model: models.UserModel,
    filter: {
      email,
      provider: enums.ProviderEnum.SYSTEM,
    },
  });

  if (!account) {
    throw exceptions.NotFoundException({ message: "error.invalidAccount" });
  }

  const hashOtp = await services.get({
    key: sendEmail.UserEmailKey({
      email,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });

  if (!hashOtp || !(await security.compare(otp, hashOtp))) {
    throw exceptions.BadRequestException({ message: "error.invalidOtp" });
  }

  await services.del({
    key: sendEmail.UserEmailKey({
      email,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });

  const { access_token, refresh_token } = await security.createLoginCredentials(
    {
      user: account,
      options: { issuer },
    },
  );

  return { access_token, refresh_token };
};

export const enableTwoStepVerification = async ({ email }) => {
  await sendEmailOtp({
    email: email,
    subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    title: "Two Step Verification",
  });
};

export const confirmTwoStepVerification = async (user, { otp }) => {
  const hashOtp = await services.get({
    key: sendEmail.UserEmailKey({
      email: user.email,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });

  if (!hashOtp || !(await security.compare(otp, hashOtp))) {
    throw exceptions.BadRequestException({ message: "error.invalidOtp" });
  }

  user.twoStepVerification = true;
  // we use validateModifiedOnly: true cause we remove password from back in all cases and we don't want to validate it.
  await user.save({ validateModifiedOnly: true });

  await services.del({
    key: sendEmail.UserEmailKey({
      email: user.email,
      subject: enums.EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });
  await services.del({ key: security.userBaseProfile({ userId: user._id }) });
};

export const rotateToken = async (payload, user, issuer) => {
  const accessExpiresIn =
    (payload.iat + configService.ACCESS_TOKEN_EXPIRES_IN) * 1000;
  const currentTime = Date.now() + 5 * 60000;

  if (currentTime < accessExpiresIn) {
    throw exceptions.ConflictException({ message: "error.rotateTooEarly" });
  }

  // expires in refresh token REFRESH_TOKEN_EXPIRES_IN - (Math.ceil(Date.now() / 1000)) - payload.iat depend on the requirements.
  const { access_token, refresh_token } = await security.createLoginCredentials(
    {
      user,
      options: { issuer },
    },
  );

  return { access_token, refresh_token };
};

export const logout = async (
  payload,
  user,
  { action = enums.LogoutEnum.DEVICE } = {},
) => {
  switch (action) {
    case enums.LogoutEnum.ALL:
      user.changeCredentialsTime = new Date();
      // we use validateModifiedOnly: true cause we remove password from back in all cases and we don't want to validate it.
      await user.save({ validateModifiedOnly: true });

      const userRevokeKeys = await services.keys({
        prefix: security.userBaseRevokeToken({ userId: payload.sub }),
      });

      await services.del({
        key: [
          ...userRevokeKeys,
          security.userBaseProfile({ userId: payload.sub }),
        ],
      });

      break;

    default:
      await security.createRevokeToken({ payload });
      break;
  }
  return;
};
