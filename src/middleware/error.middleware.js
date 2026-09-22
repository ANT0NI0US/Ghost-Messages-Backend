import { NODE_ENV } from "../../config/config.service.js";

export const globalErrorHandling = (error, req, res, next) => {
  const status = error.cause?.status ?? 500;
  const issues = error.cause?.issues;
  const mood = NODE_ENV == "production";
  const defaultErrorMessage = "something went wrong Sever error";
  const displayErrorMessage = error.message || defaultErrorMessage;
  return res.status(status).json({
    status_code: status,
    message: mood
      ? status == 500
        ? defaultErrorMessage
        : displayErrorMessage
      : displayErrorMessage,
    issues,
    stack: mood ? undefined : error.stack,
  });
};
