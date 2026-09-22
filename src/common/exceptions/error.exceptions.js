export const ErrorResponse = ({
  message = "Error",
  status = 400,
  issues = undefined,
} = {}) => {
  throw new Error(message, { cause: { status, issues } });
};

export const BadRequestException = ({
  message = "BadRequestException",
  issues = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 400, issues });
};

export const ConflictException = ({
  message = "ConflictException",
  issues = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 409, issues });
};

export const UnauthorizedException = ({
  message = "UnauthorizedException",
  issues = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 401, issues });
};

export const NotFoundException = ({
  message = "NotFoundException",
  issues = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 404, issues });
};

export const ForbiddenException = ({
  message = "ForbiddenException",
  issues = undefined,
} = {}) => {
  return ErrorResponse({ message, status: 403, issues });
};
