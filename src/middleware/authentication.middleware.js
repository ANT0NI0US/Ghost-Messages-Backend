import { exceptions, enums, security } from "../common/index.js";

export const bearerAuth = async ({
  req,
  tokenType = enums.TokenTypeEnum.ACCESS,
} = {}) => {
  const [key, credential] = req.headers["authorization"]?.split(" ") || [];
  const { user, payload } = await security.decodeToken({
    authorization: credential,
    tokenType,
  });
  req.user = user;
  req.payload = payload;
};

export const authentication = ({
  tokenType = enums.TokenTypeEnum.ACCESS,
  allowBasic = true,
} = {}) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw exceptions.UnauthorizedException({ message: "error.unauthorized" });
    }
    const [key, credential] = authorization?.split(" ") || [];

    switch (key) {
      case enums.AuthEnum.BEARER:
        await bearerAuth({ req, tokenType });
        break;

      case enums.AuthEnum.BASIC:
        if (!allowBasic) {
          throw exceptions.BadRequestException({
            message: "error.basicAuthNotAllowed",
          });
        }
        const [email, password] = Buffer.from(credential, "base64")
          .toString()
          ?.split(":");
        req.user = await security.basicAuth({ email, password });
        break;

      default:
        throw exceptions.BadRequestException({
          message: "error.invalidAuthKey",
        });
        break;
    }

    next();
  };
};
