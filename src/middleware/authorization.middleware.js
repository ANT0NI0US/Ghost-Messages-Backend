import { exceptions } from "../common/index.js";

export const authorization = (accessRole) => {
  return async (req, res, next) => {
    if (req.user.role < accessRole) {
      throw exceptions.ForbiddenException({ message: "error.forbidden" });
    }

    next();
  };
};
