export const ErrorResponse = ({
  message = "Error",
  status = 400,
  extra = undefined,
} = {}) => {
  throw new Error(message, { cause: { status, extra } });
};

export const BadRequestException = ({
  message = "BadRequestException",
  extra = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 400, extra });
};

export const ConflictException = ({
  message = "ConflictException",
  extra = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 409, extra });
};

export const UnauthorizedException = ({
  message = "UnauthorizedException",
  extra = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 401, extra });
};

export const NotFoundException = ({
  message = "NotFoundException",
  extra = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 404, extra });
};

export const ForbiddenException = ({
  message = "ForbiddenException",
  extra = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 403, extra });
};
