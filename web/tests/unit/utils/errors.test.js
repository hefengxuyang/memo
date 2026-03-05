/**
 * Error Classes Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  AppError,
  NetworkError,
  TimeoutError,
  ClientError,
  ServerError,
  ValidationError,
} from '../../../js/utils/errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    test('should create error with message and code', () => {
      const error = new AppError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AppError');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('NetworkError', () => {
    test('should create network error with default message', () => {
      const error = new NetworkError();
      expect(error.message).toBe('网络连接失败，请检查网络设置');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.name).toBe('NetworkError');
      expect(error instanceof AppError).toBe(true);
    });

    test('should create network error with custom message', () => {
      const error = new NetworkError('Custom network error');
      expect(error.message).toBe('Custom network error');
      expect(error.code).toBe('NETWORK_ERROR');
    });
  });

  describe('TimeoutError', () => {
    test('should create timeout error with default message', () => {
      const error = new TimeoutError();
      expect(error.message).toBe('请求超时，请稍后重试');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.name).toBe('TimeoutError');
    });

    test('should create timeout error with custom message', () => {
      const error = new TimeoutError('Custom timeout');
      expect(error.message).toBe('Custom timeout');
    });
  });

  describe('ClientError', () => {
    test('should create client error with status code', () => {
      const error = new ClientError('Bad request', 400);
      expect(error.message).toBe('Bad request');
      expect(error.code).toBe('CLIENT_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ClientError');
    });

    test('should handle 404 status code', () => {
      const error = new ClientError('Not found', 404);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ServerError', () => {
    test('should create server error with default message', () => {
      const error = new ServerError();
      expect(error.message).toBe('服务器错误，请稍后重试');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.name).toBe('ServerError');
    });

    test('should create server error with custom message', () => {
      const error = new ServerError('Internal server error');
      expect(error.message).toBe('Internal server error');
    });
  });

  describe('ValidationError', () => {
    test('should create validation error with field and message', () => {
      const error = new ValidationError('title', 'Title is required');
      expect(error.message).toBe('Title is required');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('title');
      expect(error.name).toBe('ValidationError');
    });

    test('should handle description field validation', () => {
      const error = new ValidationError('description', 'Too long');
      expect(error.field).toBe('description');
      expect(error.message).toBe('Too long');
    });
  });
});
