import { OAuth2Client } from "google-auth-library";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  BLOCK_OTP_TIME,
  MAX_INCORRECT_PASSWORD_ATTEMPTS,
  MAX_OTP_TRIALS,
  OTP_EXPIRES_TIME,
  WEB_CLIENT_IDS,
} from "../../../config/config.service.js";
import { UserModel } from "../../DB/model/index.js";
import {
  EmailSubjectEnum,
  LogoutEnum,
  ProviderEnum,
} from "../../common/enum/index.js";
import { emailEvent } from "../../common/events/index.js";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  TooManyRequestException,
} from "../../common/exceptions/index.js";
import { create, findOne } from "../../common/repository/index.js";
import {
  compare,
  createLoginCredentials,
  createRevokeToken,
  decrypt,
  encrypt,
  hash,
  userBaseRevokeToken,
} from "../../common/security/index.js";
import {
  del,
  expire,
  get,
  incrBy,
  keys,
  set,
  ttl,
} from "../../common/services/index.js";
import {
  createOtp,
  UserEmailKey,
  UserOtpTrialsKey,
} from "../../common/utils/email/index.js";

const client = new OAuth2Client();

async function verifyGoogleAccount(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: WEB_CLIENT_IDS,
  });
  const payload = ticket.getPayload();
  return payload;
}

export const signupLoginWithGmail = async ({ idToken }, issuer) => {
  const { name, email, picture, email_verified } =
    await verifyGoogleAccount(idToken);

  if (!email_verified) {
    throw BadRequestException({ message: "error.emailNotVerified" });
  }

  const existingEmail = await findOne({ model: UserModel, filter: { email } });
  if (existingEmail) {
    // if the email already exist with any provider not equal google
    if (existingEmail.provider != ProviderEnum.GOOGLE) {
      throw ConflictException({ message: "error.invalidProvider" });
    }
    // login with gmail
    const { access_token, refresh_token } = await createLoginCredentials({
      user: existingEmail,
      options: { issuer },
    });

    return { status: 200, access_token, refresh_token };
  }
  // signup with gmail
  const account = await create({
    model: UserModel,
    data: {
      username: name,
      email,
      confirmEmail: new Date(),
      image: picture,
      provider: ProviderEnum.GOOGLE,
    },
  });

  const { access_token, refresh_token } = await createLoginCredentials({
    user: account,
    options: { issuer },
  });

  return { status: 201, access_token, refresh_token };
};

const sendEmailOtp = async ({
  email,
  subject = EmailSubjectEnum.CONFIRM_EMAIL,
  title = "Confirm Email",
  maxTrials = MAX_OTP_TRIALS,
  otpExpiresTime = OTP_EXPIRES_TIME,
  blockOtpTime = BLOCK_OTP_TIME,
}) => {
  const existOtpTTL = await ttl({ key: UserEmailKey({ email, subject }) });

  if (existOtpTTL > 0) {
    throw ConflictException({ message: "error.otpStillValid" });
  }

  const currentTrials =
    (await get({
      key: UserOtpTrialsKey({ email, subject }),
    })) ?? 0;

  if (currentTrials >= maxTrials) {
    throw TooManyRequestException({ message: "error.otpLimitReached" });
  }

  const otp = createOtp();

  await set({
    key: UserEmailKey({ email, subject }),
    value: await hash({ plainText: otp.toString() }),
    ttl: otpExpiresTime,
  });

  const finalTrials = await incrBy({
    key: UserOtpTrialsKey({ email, subject }),
  });

  if (finalTrials == maxTrials) {
    await expire({
      key: UserOtpTrialsKey({ email, subject }),
      ttl: blockOtpTime,
    });
  }

  emailEvent.emit("sendEmail", {
    recipient: { to: email },
    subject,
    data: { code: otp, title },
  });
};

export const signup = async (inputs) => {
  const { email, phone, password } = inputs;

  const existingEmail = await findOne({ model: UserModel, filter: { email } });

  if (existingEmail) {
    throw ConflictException({ message: "error.emailExists" });
  }

  const account = await create({
    model: UserModel,
    data: {
      ...inputs,
      password: await hash({ plainText: password }),
      phone: await encrypt(phone),
    },
  });

  await sendEmailOtp({
    email,
    title: "Confirm Email",
  });

  return;
};

export const confirmEmail = async ({ email, otp }, issuer) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
  });

  if (!account) {
    throw NotFoundException({ message: "error.invalidAccount" });
  }

  const hashOtp = await get({
    key: UserEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    throw BadRequestException({ message: "error.invalidOtp" });
  }
  account.confirmEmail = new Date();
  await account.save();
  await del({
    key: await keys({
      prefix: UserEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
    }),
  });

  const { access_token, refresh_token } = await createLoginCredentials({
    user: account,
    options: { issuer },
  });

  return { access_token, refresh_token };
};

export const reSendConfirmEmail = async ({ email }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
  });

  if (!account) {
    throw NotFoundException({ message: "error.invalidAccount" });
  }

  await sendEmailOtp({
    email,
    title: "Confirm Email",
  });
};

// FORGOT PASSWORD
export const requestForgetPasswordCode = async ({ email }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });

  if (!account) {
    throw NotFoundException({ message: "error.invalidAccount" });
  }

  await sendEmailOtp({
    email,
    title: "Forgot password",
    subject: EmailSubjectEnum.FORGOT_PASSWORD,
  });
};

export const verifyForgotPasswordCode = async ({ email, otp }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });

  if (!account) {
    throw NotFoundException({ message: "error.invalidAccount" });
  }

  const hashOtp = await get({
    key: UserEmailKey({ email, subject: EmailSubjectEnum.FORGOT_PASSWORD }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    throw BadRequestException({ message: "error.invalidOtp" });
  }

  return account;
};

export const resetPassword = async ({ email, otp, password }) => {
  const account = await verifyForgotPasswordCode({ email, otp });

  account.password = await hash({ plainText: password });
  account.changeCredentialsTime = new Date();

  await account.save();

  const [userRevokeKeys, userEmailKeys] = await Promise.all([
    keys({
      prefix: userBaseRevokeToken({ userId: account._id }),
    }),
    keys({
      prefix: UserEmailKey({
        email,
        subject: EmailSubjectEnum.FORGOT_PASSWORD,
      }),
    }),
  ]);

  await del({
    key: [...userRevokeKeys, ...userEmailKeys],
  });

  return;
};

export const login = async ({ email, password }, issuer) => {
  // Get the account that has the same email and signup with system and the confirmationEmail is true.
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });

  // If there is no account invalid credentials.
  if (!account)
    throw ForbiddenException({ message: "error.invalidCredentials" });

  // Compare between the password that user enter and the actual user password.
  const match = await compare(password, account.password);

  const LoginTrialsKey = `User::${email}::Login_Trials`;

  if (!match) {
    const currentTrials =
      (await get({
        key: LoginTrialsKey,
      })) ?? 0;

    if (currentTrials >= MAX_INCORRECT_PASSWORD_ATTEMPTS) {
      throw TooManyRequestException({ message: "error.loginLimitReached" });
    }

    const finalTrials = await incrBy({
      key: LoginTrialsKey,
    });

    if (finalTrials == MAX_INCORRECT_PASSWORD_ATTEMPTS) {
      await expire({
        key: LoginTrialsKey,
        ttl: BLOCK_OTP_TIME,
      });
    }
    throw ForbiddenException({ message: "error.invalidCredentials" });
  }

  await del({
    key: LoginTrialsKey,
  });

  account.phone = await decrypt(account.phone);

  if (account.twoStepVerification) {
    await sendEmailOtp({
      email,
      subject: EmailSubjectEnum.TWO_STEP_VERIFICATION,
      title: "Two Step Verification",
    });

    return;
  }

  const { access_token, refresh_token } = await createLoginCredentials({
    user: account,
    options: { issuer },
  });

  return { access_token, refresh_token };
};

export const loginConfirmation = async ({ email, otp }, issuer) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
    },
  });

  if (!account) {
    throw NotFoundException({ message: "error.invalidAccount" });
  }

  const hashOtp = await get({
    key: UserEmailKey({
      email,
      subject: EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    throw BadRequestException({ message: "error.invalidOtp" });
  }

  await del({
    key: UserEmailKey({
      email,
      subject: EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });

  const { access_token, refresh_token } = await createLoginCredentials({
    user: account,
    options: { issuer },
  });

  return { access_token, refresh_token };
};

export const enableTwoStepVerification = async ({ email }) => {
  await sendEmailOtp({
    email: email,
    subject: EmailSubjectEnum.TWO_STEP_VERIFICATION,
    title: "Two Step Verification",
  });
};

export const confirmTwoStepVerification = async (user, { otp }) => {
  const hashOtp = await get({
    key: UserEmailKey({
      email: user.email,
      subject: EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    throw BadRequestException({ message: "error.invalidOtp" });
  }

  user.twoStepVerification = true;
  await user.save();

  await del({
    key: UserEmailKey({
      email: user.email,
      subject: EmailSubjectEnum.TWO_STEP_VERIFICATION,
    }),
  });
};

export const rotateToken = async (payload, user, issuer) => {
  const accessExpiresIn = (payload.iat + ACCESS_TOKEN_EXPIRES_IN) * 1000;
  const currentTime = Date.now() + 5 * 60000;

  if (currentTime < accessExpiresIn) {
    throw ConflictException({ message: "error.rotateTooEarly" });
  }

  // expires in refresh token REFRESH_TOKEN_EXPIRES_IN - (Math.ceil(Date.now() / 1000)) - payload.iat depend on the requirements.
  const { access_token, refresh_token } = await createLoginCredentials({
    user,
    options: { issuer },
  });

  return { access_token, refresh_token };
};

export const logout = async (payload, user, { action = LogoutEnum.DEVICE }) => {
  switch (action) {
    case LogoutEnum.ALL:
      user.changeCredentialsTime = new Date();
      await user.save();
      await del({
        key: await keys({
          prefix: userBaseRevokeToken({ userId: payload.sub }),
        }),
      });
      break;

    default:
      await createRevokeToken({ payload });
      break;
  }
  return;
};
