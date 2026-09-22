import { TokenTypeEnum } from "../common/enum/index.js";
import { UnauthorizedException } from "../common/exceptions/index.js";
import { decodeToken } from "../common/security/index.js";

export const authentication = (tokenType = TokenTypeEnum.ACCESS) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw UnauthorizedException({ message: "unauthorized account" });
    }
    const { user, payload } = await decodeToken({
      authorization,
      tokenType,
    });
    req.user = user;
    req.payload = payload;
    next();
  };
};
