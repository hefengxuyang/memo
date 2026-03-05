/**
 * Test Data Factories
 * 
 * Functions for creating consistent test data
 */

/**
 * Creates a mock task object with default values
 */
export function createMockTask(overrides = {}) {
  return {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    created_at: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

/**
 * Creates multiple mock tasks
 */
export function createMockTasks(count = 3) {
  return Array.from({ length: count }, (_, i) => createMockTask({
    id: i + 1,
    title: `Test Task ${i + 1}`,
    description: `Description for task ${i + 1}`,
    completed: i % 2 === 0,
  }));
}

/**
 * Creates a mock API response
 */
export function createMockApiResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ data }),
    text: async () => JSON.stringify({ data }),
  };
}

/**
 * Creates a mock API error response
 */
export function createMockApiError(message, status = 400) {
  return {
    ok: false,
    status,
    json: async () => ({ error: 'error', message }),
    text: async () => JSON.stringify({ error: 'error', message }),
  };
}
