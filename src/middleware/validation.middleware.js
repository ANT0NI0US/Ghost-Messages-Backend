import { BadRequestException } from "../common/exceptions/index.js";

export const validation = (schema) => {
  return (req, res, next) => {
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      throw BadRequestException({
        message: "validation Error",
        issues: validationResult.error.issues,
      });
    }
    req.validate = validationResult.data;
    next();
  };
};
