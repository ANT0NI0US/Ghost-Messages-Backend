import { OAuth2Client } from "google-auth-library";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  WEB_CLIENT_IDS,
} from "../../../config/config.service.js";
import { UserModel } from "../../DB/model/index.js";
import { ProviderEnum } from "../../common/enum/index.js";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "../../common/exceptions/index.js";
import { create, findOne } from "../../common/repository/index.js";
import {
  compare,
  createLoginCredentials,
  decrypt,
  encrypt,
  hash,
} from "../../common/security/index.js";

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
    throw BadRequestException({ message: "email not verified" });
  }

  const existingEmail = await findOne({ model: UserModel, filter: { email } });
  if (existingEmail) {
    // if the email already exist with any provider not equal google
    if (existingEmail.provider != ProviderEnum.GOOGLE) {
      throw ConflictException({ message: "Invalid account provider" });
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

export const signup = async (inputs, issuer) => {
  const { email, phone, password } = inputs;

  const existingEmail = await findOne({ model: UserModel, filter: { email } });
  if (existingEmail) {
    throw ConflictException({ message: "Email already exist" });
  }

  const account = await create({
    model: UserModel,
    data: {
      ...inputs,
      password: await hash({ plainText: password }),
      phone: await encrypt(phone),
    },
  });

  const { access_token, refresh_token } = await createLoginCredentials({
    user: account,
    options: { issuer },
  });

  return { access_token, refresh_token };
};

export const login = async ({ email, password }, issuer) => {
  const account = await findOne({
    model: UserModel,
    filter: { email, provider: ProviderEnum.SYSTEM },
  });

  if (!account)
    throw ForbiddenException({ message: "Invalid email or password" });

  const match = await compare(password, account.password);

  if (!match)
    throw ForbiddenException({ message: "Invalid email or password" });

  account.phone = await decrypt(account.phone);

  const { access_token, refresh_token } = await createLoginCredentials({
    user: account,
    options: { issuer },
  });

  return { access_token, refresh_token };
};

export const rotateToken = async (payload, user, issuer) => {
  const accessExpiresIn = (payload.iat + ACCESS_TOKEN_EXPIRES_IN) * 1000;
  const currentTime = Date.now() + 5 * 60000;
  if (currentTime < accessExpiresIn) {
    throw ConflictException({
      message:
        "Sorry we cannot create new login credentials while current access token still within valid time range",
    });
  }
  const { access_token, refresh_token } = await createLoginCredentials({
    user,
    options: { issuer },
  });

  return { access_token, refresh_token };
};
