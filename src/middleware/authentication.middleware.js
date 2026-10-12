import { exceptions, enums, security } from "../common/index.js";

export const authentication = (tokenType = enums.TokenTypeEnum.ACCESS) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw exceptions.UnauthorizedException({ message: "error.unauthorized" });
    }
    const { user, payload } = await security.decodeToken({
      authorization,
      tokenType,
    });
    req.user = user;
    req.payload = payload;
    next();
  };
};
