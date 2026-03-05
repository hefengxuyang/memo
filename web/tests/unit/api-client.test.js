/**
 * APIClient Unit Tests
 * 
 * Tests all API endpoints, error handling, timeout, and HTTP status codes
 * Requirements: 5.4, 5.5, 6.1, 6.2
 */

import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { APIClient } from '../../js/api-client.js';
import { NetworkError, TimeoutError, ClientError, ServerError } from '../../js/utils/errors.js';

describe('APIClient', () => {
  let apiClient;
  let originalFetch;

  // Helper to create mock response with proper headers
  const createMockResponse = (data, status = 200, contentType = 'application/json') => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => {
        if (name.toLowerCase() === 'content-type') {
          return contentType;
        }
        return null;
      },
    },
    json: () => Promise.resolve(data),
  });

  beforeEach(() => {
    apiClient = new APIClient('http://localhost:8080', 5000);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Constructor', () => {
    test('should initialize with provided baseURL and timeout', () => {
      expect(apiClient.baseURL).toBe('http://localhost:8080');
      expect(apiClient.timeout).toBe(5000);
    });

    test('should use default values from config when not provided', () => {
      const defaultClient = new APIClient();
      expect(defaultClient.baseURL).toBeDefined();
      expect(defaultClient.timeout).toBe(5000);
    });
  });

  describe('Successful requests - all endpoints', () => {
    test('getTasks should return array of tasks', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, created_at: '2024-01-15T10:00:00Z' },
        { id: 2, title: 'Task 2', description: 'Desc 2', completed: true, created_at: '2024-01-15T11:00:00Z' },
      ];

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: mockTasks })),
      );

      const result = await apiClient.getTasks();

      expect(result).toEqual(mockTasks);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    test('getTask should return a single task', async () => {
      const mockTask = { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, created_at: '2024-01-15T10:00:00Z' };

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: mockTask })),
      );

      const result = await apiClient.getTask(1);

      expect(result).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks/1',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    test('createTask should create and return new task', async () => {
      const taskData = { title: 'New Task', description: 'New Description' };
      const mockResponse = {
        id: 3,
        ...taskData,
        completed: false,
        created_at: '2024-01-15T12:00:00Z',
      };

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: mockResponse }, 201)),
      );

      const result = await apiClient.createTask(taskData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(taskData),
        }),
      );
    });

    test('updateTaskStatus should update and return task', async () => {
      const mockTask = { id: 1, title: 'Task 1', description: 'Desc 1', completed: true, created_at: '2024-01-15T10:00:00Z' };

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: mockTask })),
      );

      const result = await apiClient.updateTaskStatus(1, true);

      expect(result).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks/1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ completed: true }),
        }),
      );
    });

    test('deleteTask should complete successfully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse(null, 204, null)),
      );

      await expect(apiClient.deleteTask(1)).resolves.toBeUndefined();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    test('updateTask should update and return task', async () => {
      const updateData = { title: 'Updated Title', description: 'Updated Description' };
      const mockTask = {
        id: 1,
        title: 'Updated Title',
        description: 'Updated Description',
        completed: false,
        created_at: '2024-01-15T10:00:00Z',
      };

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: mockTask })),
      );

      const result = await apiClient.updateTask(1, updateData);

      expect(result).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        }),
      );
    });
  });

  describe('Network error handling', () => {
    test('should throw NetworkError for network failures', async () => {
      global.fetch = jest.fn(() => Promise.reject(new TypeError('Network request failed')));

      await expect(apiClient.getTasks()).rejects.toThrow(NetworkError);
      await expect(apiClient.getTasks()).rejects.toThrow('网络连接失败，请检查网络设置');
    });

    test('should throw NetworkError for DNS resolution failures', async () => {
      global.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')));

      await expect(apiClient.createTask({ title: 'Test', description: 'Test' })).rejects.toThrow(NetworkError);
    });

    test('should throw NetworkError for connection refused', async () => {
      global.fetch = jest.fn(() => Promise.reject(new TypeError('NetworkError when attempting to fetch resource')));

      await expect(apiClient.updateTaskStatus(1, true)).rejects.toThrow(NetworkError);
    });
  });

  describe('Timeout handling', () => {
    test('should throw TimeoutError when request exceeds timeout', async () => {
      // Create a client with very short timeout
      const shortTimeoutClient = new APIClient('http://localhost:8080', 10);

      // Mock fetch to simulate abort behavior
      global.fetch = jest.fn((url, options) => {
        return new Promise((resolve, reject) => {
          // Listen for abort signal
          if (options.signal) {
            options.signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }
          // Never resolve to simulate hanging request
        });
      });

      await expect(shortTimeoutClient.getTasks()).rejects.toThrow(TimeoutError);
      await expect(shortTimeoutClient.getTasks()).rejects.toThrow('请求超时，请稍后重试');
    }, 1000); // Set test timeout to 1 second

    test('should clear timeout after successful response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: [] })),
      );

      await apiClient.getTasks();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    test('should clear timeout after error response', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'Server error' }, 500)),
      );

      await expect(apiClient.getTasks()).rejects.toThrow(ServerError);
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('HTTP status code handling', () => {
    test('should handle 200 OK status', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: [] })),
      );

      const result = await apiClient.getTasks();
      expect(result).toEqual([]);
    });

    test('should handle 201 Created status', async () => {
      const mockTask = { id: 1, title: 'Test', description: 'Test', completed: false, created_at: '2024-01-15T10:00:00Z' };

      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: mockTask }, 201)),
      );

      const result = await apiClient.createTask({ title: 'Test', description: 'Test' });
      expect(result).toEqual(mockTask);
    });

    test('should throw ClientError for 400 Bad Request', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'title cannot be empty' }, 400)),
      );

      const error = await apiClient.createTask({ title: '', description: '' }).catch(e => e);

      expect(error).toBeInstanceOf(ClientError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('title cannot be empty');
    });

    test('should throw ClientError for 404 Not Found', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'Task not found' }, 404)),
      );

      const error = await apiClient.getTask(999).catch(e => e);

      expect(error).toBeInstanceOf(ClientError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Task not found');
    });

    test('should throw ServerError for 500 Internal Server Error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'Database connection failed' }, 500)),
      );

      const error = await apiClient.getTasks().catch(e => e);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Database connection failed');
    });

    test('should throw ServerError for 503 Service Unavailable', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'Service temporarily unavailable' }, 503)),
      );

      const error = await apiClient.getTasks().catch(e => e);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Service temporarily unavailable');
    });

    test('should handle error response without JSON body', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: { get: () => 'application/json' },
          json: () => Promise.reject(new Error('Invalid JSON')),
        }),
      );

      const error = await apiClient.getTasks().catch(e => e);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('Internal Server Error');
    });

    test('should handle error response with error field instead of message', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ error: 'validation_error' }, 400)),
      );

      const error = await apiClient.createTask({ title: '', description: '' }).catch(e => e);

      expect(error).toBeInstanceOf(ClientError);
      expect(error.message).toBe('validation_error');
    });
  });

  describe('Request configuration', () => {
    test('should set Content-Type header to application/json', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: [] })),
      );

      await apiClient.getTasks();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    test('should include AbortController signal in request', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: [] })),
      );

      await apiClient.getTasks();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    test('should construct correct URL with baseURL and endpoint', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ data: [] })),
      );

      await apiClient.getTasks();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks',
        expect.any(Object),
      );
    });
  });

  describe('Edge cases', () => {
    test('should handle empty response body for DELETE', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse(null, 204, null)),
      );

      await expect(apiClient.deleteTask(1)).resolves.toBeUndefined();
    });

    test('should re-throw non-AppError exceptions', async () => {
      const customError = new Error('Custom error');
      global.fetch = jest.fn(() => Promise.reject(customError));

      // Mock the error to not be a TypeError (so it doesn't get converted to NetworkError)
      Object.defineProperty(customError, 'name', { value: 'CustomError' });

      await expect(apiClient.getTasks()).rejects.toThrow('Custom error');
    });

    test('should handle JSON parsing errors in success response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.reject(new Error('Invalid JSON')),
        }),
      );

      await expect(apiClient.getTasks()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('updateTask error handling', () => {
    test('should throw ClientError for 400 validation error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'title cannot be empty' }, 400)),
      );

      const error = await apiClient.updateTask(1, { title: '', description: '' }).catch(e => e);

      expect(error).toBeInstanceOf(ClientError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('title cannot be empty');
    });

    test('should throw ClientError for 404 task not found', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'task not found' }, 404)),
      );

      const error = await apiClient.updateTask(999, { title: 'Test', description: 'Test' }).catch(e => e);

      expect(error).toBeInstanceOf(ClientError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('task not found');
    });

    test('should throw ServerError for 500 internal server error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(createMockResponse({ message: 'internal server error' }, 500)),
      );

      const error = await apiClient.updateTask(1, { title: 'Test', description: 'Test' }).catch(e => e);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe('internal server error');
    });

    test('should throw NetworkError for network failure', async () => {
      global.fetch = jest.fn(() => Promise.reject(new TypeError('Network request failed')));

      await expect(apiClient.updateTask(1, { title: 'Test', description: 'Test' })).rejects.toThrow(NetworkError);
      await expect(apiClient.updateTask(1, { title: 'Test', description: 'Test' })).rejects.toThrow('网络连接失败，请检查网络设置');
    });

    test('should throw TimeoutError when request exceeds timeout', async () => {
      const shortTimeoutClient = new APIClient('http://localhost:8080', 10);

      global.fetch = jest.fn((url, options) => {
        return new Promise((resolve, reject) => {
          if (options.signal) {
            options.signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }
        });
      });

      await expect(shortTimeoutClient.updateTask(1, { title: 'Test', description: 'Test' })).rejects.toThrow(TimeoutError);
      await expect(shortTimeoutClient.updateTask(1, { title: 'Test', description: 'Test' })).rejects.toThrow('请求超时，请稍后重试');
    }, 1000);
  });
});
