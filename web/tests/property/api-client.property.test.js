/**
 * API Client Property-Based Tests
 * 
 * Tests Properties 4, 8, 9, 11, 12, 13
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { APIClient } from '../../js/api-client.js';
import { createTaskDataGenerator, taskGenerator, httpStatusCodeGenerator } from '../helpers/generators.js';
import { ClientError, ServerError, NetworkError, TimeoutError } from '../../js/utils/errors.js';

describe('API Client Properties', () => {
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
    json: async () => data,
  });

  beforeEach(() => {
    apiClient = new APIClient('http://localhost:8080', 5000);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Feature: memo-frontend, Property 4: Valid Task Creation API Call
  test('Property 4: Valid Task Creation API Call - POST request format is correct for valid task data', () => {
    fc.assert(
      fc.asyncProperty(createTaskDataGenerator(), async (taskData) => {
        let capturedRequest = null;

        // Mock fetch to capture the request
        global.fetch = async (url, options) => {
          capturedRequest = { url, options };
          return createMockResponse({
            data: {
              id: 1,
              ...taskData,
              completed: false,
              created_at: new Date().toISOString(),
            },
          }, 201);
        };

        await apiClient.createTask(taskData);

        // Verify POST method
        expect(capturedRequest.options.method).toBe('POST');

        // Verify endpoint
        expect(capturedRequest.url).toBe('http://localhost:8080/api/tasks');

        // Verify payload format
        const body = JSON.parse(capturedRequest.options.body);
        expect(body).toHaveProperty('title', taskData.title);
        expect(body).toHaveProperty('description', taskData.description);

        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Feature: memo-frontend, Property 8: Delete API Call Correctness
  test('Property 8: Delete API Call Correctness - DELETE request uses correct endpoint and task ID', () => {
    fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 10000 }), async (taskId) => {
        let capturedRequest = null;

        // Mock fetch to capture the request
        global.fetch = async (url, options) => {
          capturedRequest = { url, options };
          return createMockResponse(null, 204, null);
        };

        await apiClient.deleteTask(taskId);

        // Verify DELETE method
        expect(capturedRequest.options.method).toBe('DELETE');

        // Verify endpoint includes correct task ID
        expect(capturedRequest.url).toBe(`http://localhost:8080/api/tasks/${taskId}`);

        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Feature: memo-frontend, Property 9: Status Toggle API Call Correctness
  test('Property 9: Status Toggle API Call Correctness - PATCH request format is correct for status updates', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.boolean(),
        async (taskId, completed) => {
          let capturedRequest = null;

          // Mock fetch to capture the request
          global.fetch = async (url, options) => {
            capturedRequest = { url, options };
            return createMockResponse({
              data: {
                id: taskId,
                title: 'Test Task',
                description: 'Test Description',
                completed,
                created_at: new Date().toISOString(),
              },
            });
          };

          await apiClient.updateTaskStatus(taskId, completed);

          // Verify PATCH method
          expect(capturedRequest.options.method).toBe('PATCH');

          // Verify endpoint includes correct task ID
          expect(capturedRequest.url).toBe(`http://localhost:8080/api/tasks/${taskId}/status`);

          // Verify payload format
          const body = JSON.parse(capturedRequest.options.body);
          expect(body).toHaveProperty('completed', completed);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: memo-frontend, Property 11: JSON Content-Type Header
  test('Property 11: JSON Content-Type Header - all requests include application/json Content-Type', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom('getTasks', 'createTask', 'updateTaskStatus', 'deleteTask'),
        async (methodName) => {
          // Create a fresh client for each test to avoid deduplication issues
          const freshClient = new APIClient('http://localhost:8080', 5000);
          let capturedRequest = null;

          // Mock fetch to capture the request
          global.fetch = async (url, options) => {
            capturedRequest = { url, options };
            const status = methodName === 'deleteTask' ? 204 : 200;
            const data = methodName === 'getTasks' ? [] : { id: 1, title: 'Test', description: '', completed: false, created_at: new Date().toISOString() };
            return createMockResponse(methodName === 'deleteTask' ? null : { data }, status, methodName === 'deleteTask' ? null : 'application/json');
          };

          // Call the appropriate method
          switch (methodName) {
          case 'getTasks':
            await freshClient.getTasks();
            break;
          case 'createTask':
            await freshClient.createTask({ title: 'Test', description: 'Test' });
            break;
          case 'updateTaskStatus':
            await freshClient.updateTaskStatus(1, true);
            break;
          case 'deleteTask':
            await freshClient.deleteTask(1);
            break;
          }

          // Verify Content-Type header is set to application/json
          expect(capturedRequest).not.toBeNull();
          expect(capturedRequest.options.headers).toHaveProperty('Content-Type', 'application/json');

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: memo-frontend, Property 12: JSON Response Parsing
  test('Property 12: JSON Response Parsing - API responses are correctly parsed into JavaScript objects', () => {
    fc.assert(
      fc.asyncProperty(taskGenerator(), async (task) => {
        // Create a fresh client for each test to avoid deduplication issues
        const freshClient = new APIClient('http://localhost:8080', 5000);

        // Mock fetch to return the task
        global.fetch = async () => createMockResponse({ data: task });

        const result = await freshClient.getTask(task.id);

        // Verify the response is correctly parsed
        expect(result).toEqual(task);
        expect(result.id).toBe(task.id);
        expect(result.title).toBe(task.title);
        expect(result.description).toBe(task.description);
        expect(result.completed).toBe(task.completed);
        expect(result.created_at).toBe(task.created_at);

        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Feature: memo-frontend, Property 13: HTTP Status Code Handling
  test('Property 13: HTTP Status Code Handling - different status codes are handled appropriately', () => {
    fc.assert(
      fc.asyncProperty(httpStatusCodeGenerator(), async (statusCode) => {
        // Create a fresh client for each test
        const freshClient = new APIClient('http://localhost:8080', 5000);
        const errorMessage = 'Test error message';

        // Mock fetch to return the specified status code immediately
        global.fetch = () => Promise.resolve(createMockResponse(
          statusCode >= 200 && statusCode < 300
            ? { data: [] }
            : { message: errorMessage, error: 'error_code' },
          statusCode,
        ));

        try {
          await freshClient.getTasks();

          // If we reach here, the request succeeded (2xx status)
          expect(statusCode).toBeGreaterThanOrEqual(200);
          expect(statusCode).toBeLessThan(300);

          return true;
        } catch (error) {
          // Verify error type based on status code
          if (statusCode >= 400 && statusCode < 500) {
            expect(error).toBeInstanceOf(ClientError);
            expect(error.statusCode).toBe(statusCode);
          } else if (statusCode >= 500) {
            expect(error).toBeInstanceOf(ServerError);
          } else {
            // For status codes outside 2xx, 4xx, 5xx ranges
            // The behavior might vary, but we should get some error
            expect(error).toBeDefined();
          }

          return true;
        }
      }),
      { numRuns: 100 },
    );
  });

  // Additional test: Verify timeout handling
  test('Property 13 (extended): Timeout errors are properly handled', () => {
    fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Mock fetch to simulate a timeout
        global.fetch = async (url, options) => {
          // Simulate abort signal being triggered
          return new Promise((resolve, reject) => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        };

        try {
          await apiClient.getTasks();
          // Should not reach here
          return false;
        } catch (error) {
          expect(error).toBeInstanceOf(TimeoutError);
          return true;
        }
      }),
      { numRuns: 10 },
    );
  });

  // Additional test: Verify network error handling
  test('Property 13 (extended): Network errors are properly handled', () => {
    fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Create a fresh client for this test
        const freshClient = new APIClient('http://localhost:8080', 5000);
        
        // Mock fetch to simulate a network error (reject immediately)
        global.fetch = () => Promise.reject(new TypeError('Failed to fetch'));

        try {
          await freshClient.getTasks();
          // Should not reach here
          return false;
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkError);
          return true;
        }
      }),
      { numRuns: 10 },
    );
  });
});
