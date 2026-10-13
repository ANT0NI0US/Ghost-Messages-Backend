import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import configService from "../../../config/config.service.js";
import { enums, exceptions, security, services } from "../../common/index.js";
import { models, queries } from "../../DB/index.js";

// USER PROFILE THAT IS STORED IN REDIS
export const userBaseProfile = ({ userId }) => {
  return `User::${userId.toString()}::Profile`;
};

// BASE REVOKE TOKEN WE USE IT WHEN WE WANNA TO DELETE ALL LOGIN DEVICES + IN userRevokeToken
export const userBaseRevokeToken = ({ userId }) => {
  return `User::${userId.toString()}::Revoke_Token`;
};

// USER REVOKE TOKEN THAT IS STORED IN REDIS
export const userRevokeToken = ({ userId, jti }) => {
  return `${userBaseRevokeToken({ userId })}::${jti}`;
};

// CREATE NEW TOKEN EVEN IF IT'S AN ACCESS OR REFRESH TOKEN
export const createToken = async ({
  payload = {},
  secret = configService.ACCESS_USER_TOKEN_SIGNATURE,
  options = {},
} = {}) => {
  return jwt.sign(payload, secret, options);
};

// VERIFY THE TOKEN EVEN IF IT'S AN ACCESS OR REFRESH TOKEN
export const verifyToken = async ({
  token = "",
  secret = configService.ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return jwt.verify(token, secret);
};

// GET THE ACCESS AND REFRESH TOKEN SIGNATURE DEPENDS ON THE USER ROLE (USER - ADMIN)
export const getTokenSignatures = async ({
  role = enums.RoleEnum.USER,
} = {}) => {
  let signatures;
  switch (role) {
    case enums.RoleEnum.ADMIN:
      signatures = {
        accessSignature: configService.ACCESS_ADMIN_TOKEN_SIGNATURE,
        refreshSignature: configService.REFRESH_ADMIN_TOKEN_SIGNATURE,
      };
      break;

    default:
      signatures = {
        accessSignature: configService.ACCESS_USER_TOKEN_SIGNATURE,
        refreshSignature: configService.REFRESH_USER_TOKEN_SIGNATURE,
      };
      break;
  }
  return signatures;
};

// GET THE ACCESS OR REFRESH TOKEN DEPENDS ON Role AND tokenType
export const getSignature = async ({
  tokenType = enums.TokenTypeEnum.ACCESS,
  role = enums.RoleEnum.USER,
} = {}) => {
  const { accessSignature, refreshSignature } = await getTokenSignatures({
    role,
  });
  return tokenType == enums.TokenTypeEnum.ACCESS
    ? accessSignature
    : refreshSignature;
};

export const decodeToken = async ({
  authorization = "",
  tokenType = enums.TokenTypeEnum.ACCESS,
} = {}) => {
  // decode is using to get the data from the token without knowing the signature
  const decoded = jwt.decode(authorization);

  if (!decoded?.aud?.length) {
    throw exceptions.BadRequestException({
      message: "error.missingTokenPayload",
    });
  }

  const secret = await getSignature({ tokenType, role: decoded.aud[0] });
  const payload = await verifyToken({ token: authorization, secret });

  if (!payload?.sub) {
    throw exceptions.BadRequestException({
      message: "error.missingTokenPayload",
    });
  }

  // get an unauthorized exception when the revoked token is already services.exist
  if (
    await services.exist({
      key: userRevokeToken({ userId: payload.sub, jti: payload.jti }),
    })
  ) {
    throw exceptions.UnauthorizedException({ message: "error.tokenRevoked" });
  }

  // check if the user profile is already cached in redis
  let user = await services.get({
    key: userBaseProfile({ userId: payload.sub }),
  });

  if (user) {
    // the cached value from Redis is a plain object (JSON-parsed), not a real
    // Mongoose document, so .save() and similar methods would be missing.
    // hydrate() rebuilds a real document from it without hitting the database.
    user = models.UserModel.hydrate(user);
  } else {
    user = await queries.findById({
      model: models.UserModel,
      id: payload.sub,
      select: "-password",
    });
    if (!user) {
      throw exceptions.NotFoundException({ message: "error.invalidUser" });
    }
    // cache the user profile in redis for 1 day.
    await services.set({
      key: userBaseProfile({ userId: payload.sub }),
      value: user,
      ttl: 60 * 60 * 24, // 1 day
    });
  }

  /*
  - change credentials time contains the time that user is used to logout from all devices so we throw new unauthorized exception
  - use new Date(...) instead of .getTime() directly: when "user" comes from the Redis cache (services.get),
  - changeCredentialsTime is a plain ISO string (JSON-parsed), not a Date instance, so it has no .getTime() method.
  - new Date(...) correctly handles both a Date object (fresh from DB) and a string (from the cache).
  */
  const changeCredentialsTime = user.changeCredentialsTime
    ? new Date(user.changeCredentialsTime).getTime()
    : 0;

  if (changeCredentialsTime > payload.iat * 1000) {
    throw exceptions.UnauthorizedException({ message: "error.tokenRevoked" });
  }

  return { user, payload };
};

// CREATE ACCESS AND REFRESH TOKEN
export const createLoginCredentials = async ({ user, options = {} }) => {
  const { accessSignature, refreshSignature } = await getTokenSignatures({
    role: user.role,
  });
  // this id we will use it in revoked token
  const jwtid = randomUUID();

  const access_token = await createToken({
    payload: { sub: user.id },
    secret: accessSignature,
    options: {
      ...options,
      audience: [user.role],
      expiresIn: configService.ACCESS_TOKEN_EXPIRES_IN,
      jwtid,
    },
  });

  const refresh_token = await createToken({
    payload: { sub: user.id },
    secret: refreshSignature,
    options: {
      ...options,
      audience: [user.role],
      expiresIn: configService.REFRESH_TOKEN_EXPIRES_IN,
      jwtid,
    },
  });

  return { access_token, refresh_token };
};

/*
CREATE REVOKED TOKEN USING payload
1- consumedTime: THE TIME THAT FINISHED FROM THE TOKEN IS ALREADY CREATED
2- refreshExpiresIn: WE GET THE REFRESH EXPIRES IN CAUSE WE PREVENT HIM TO USE IT IN A ROTATE TOKEN
3- ttl: THE TIME THAT IS REMAINING.
*/
export const createRevokeToken = async ({ payload }) => {
  const consumedTime = Math.ceil(Date.now() / 1000 - payload.iat);
  const refreshExpiresIn = payload.iat + configService.REFRESH_TOKEN_EXPIRES_IN;
  const ttl = refreshExpiresIn - consumedTime;
  await services.set({
    key: userRevokeToken({ userId: payload.sub, jti: payload.jti }),
    value: payload.jti,
    ttl,
  });
  await services.del({ key: userBaseProfile({ userId: payload.sub }) }); // delete the user profile from redis cache
};

export const basicAuth = async ({ email, password }) => {
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

  if (!match)
    throw exceptions.ForbiddenException({
      message: "error.invalidCredentials",
    });

  return account;
};
