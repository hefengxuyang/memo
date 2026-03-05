/**
 * Custom Error Classes
 * 
 * Defines application-specific error types for better error handling
 */

export class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class NetworkError extends AppError {
  constructor(message = '网络连接失败，请检查网络设置') {
    super(message, 'NETWORK_ERROR');
  }
}

export class TimeoutError extends AppError {
  constructor(message = '请求超时，请稍后重试') {
    super(message, 'TIMEOUT_ERROR');
  }
}

export class ClientError extends AppError {
  constructor(message, statusCode) {
    super(message, 'CLIENT_ERROR');
    this.statusCode = statusCode;
  }
}

export class ServerError extends AppError {
  constructor(message = '服务器错误，请稍后重试') {
    super(message, 'SERVER_ERROR');
  }
}

export class ValidationError extends AppError {
  constructor(field, message) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
  }
}
