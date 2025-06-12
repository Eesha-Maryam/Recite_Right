const httpStatus = require('http-status');

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = httpStatus.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      error: null,
    });
  }

  static error(res, error, statusCode = httpStatus.INTERNAL_SERVER_ERROR) {
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, { message }, httpStatus.NOT_FOUND);
  }

  static badRequest(res, message = 'Bad request') {
    return this.error(res, { message }, httpStatus.BAD_REQUEST);
  }

  static unauthorized(res, message = 'Please authenticate') {
    return this.error(res, { message }, httpStatus.UNAUTHORIZED);
  }

  static forbidden(res, message = 'Insufficient permissions') {
    return this.error(res, { message }, httpStatus.FORBIDDEN);
  }
}

module.exports = ApiResponse;
