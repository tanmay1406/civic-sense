/**
 * Custom error classes for the application
 */

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequest extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

class Unauthorized extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class Forbidden extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

class NotFound extends AppError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

class Conflict extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

class UnprocessableEntity extends AppError {
  constructor(message = "Unprocessable Entity") {
    super(message, 422);
  }
}

class TooManyRequests extends AppError {
  constructor(message = "Too Many Requests") {
    super(message, 429);
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}

class ServiceUnavailable extends AppError {
  constructor(message = "Service Unavailable") {
    super(message, 503);
  }
}

module.exports = {
  AppError,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
  UnprocessableEntity,
  TooManyRequests,
  InternalServerError,
  ServiceUnavailable,
};
