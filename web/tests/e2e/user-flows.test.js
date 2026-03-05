/**
 * End-to-End User Flow Tests
 * 
 * Tests complete user workflows from start to finish, simulating real user interactions
 * and verifying that all components work together correctly.
 * 
 * Validates Requirements: 1.1, 2.1, 2.2, 2.3, 3.2, 3.3, 4.2, 4.3
 * 
 * Note: These tests focus on business logic and state management integration
 * to work around JSDOM DOM manipulation limitations while still testing
 * complete user workflows.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createMockTask, createMockTasks } from '../helpers/factories.js';

describe('End-to-End User Flows', () => {
  let apiClient;
  let stateManager;
  let taskService;
  let mockFetch;

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

  beforeEach(async () => {
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Import modules
    const { APIClient } = await import('../../js/api-client.js');
    const { StateManager } = await import('../../js/state-manager.js');
    const { TaskService } = await import('../../js/task-service.js');

    // Create instances
    apiClient = new APIClient('http://localhost:8080');
    stateManager = new StateManager();
    taskService = new TaskService(apiClient, stateManager);
  });

  afterEach(() => {
    delete global.fetch;
  });

  /**
   * Helper function to wait for async operations
   */
  function waitFor(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  describe('Complete Task Creation Flow', () => {
    test('should load tasks, create a new task, and update state', async () => {
      // Validates: Requirements 1.1, 2.1, 2.2, 2.3
      
      // Step 1: Load initial empty task list
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: [] }));

      await taskService.loadTasks();
      
      // Verify initial state is empty
      expect(stateManager.getTasks()).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks',
        expect.any(Object),
      );

      // Step 2: Create a new task
      const newTask = createMockTask({
        id: 1,
        title: '完成项目文档',
        description: '编写技术设计文档',
        completed: false,
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({ data: newTask }, 201));

      await taskService.createTask('完成项目文档', '编写技术设计文档');

      // Verify POST request was made with correct data
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            title: '完成项目文档',
            description: '编写技术设计文档',
          }),
        }),
      );

      // Verify task was added to state
      const tasks = stateManager.getTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('完成项目文档');
      expect(tasks[0].description).toBe('编写技术设计文档');
    });

    test('should reject task creation with empty title', async () => {
      // Validates: Requirement 2.5 (empty title validation)
      
      // Try to create task with empty title
      await expect(
        taskService.createTask('   ', 'Some description'),
      ).rejects.toThrow();

      // Verify no API call was made
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Task Status Toggle Flow', () => {
    test('should toggle task completion status with optimistic update', async () => {
      // Validates: Requirements 4.2, 4.3
      
      // Step 1: Set up initial state with one uncompleted task
      const initialTask = createMockTask({
        id: 1,
        title: '学习 JavaScript',
        completed: false,
      });

      stateManager.setTasks([initialTask]);

      // Step 2: Toggle status
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { ...initialTask, completed: true } }));

      await taskService.toggleTaskStatus(1);

      // Verify PATCH request was made
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks/1/status',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ completed: true }),
        }),
      );

      // Verify state was updated
      const tasks = stateManager.getTasks();
      expect(tasks[0].completed).toBe(true);
    });

    test('should rollback status on API failure', async () => {
      // Validates: Requirement 4.5 (rollback on failure)
      
      // Set up initial state
      const initialTask = createMockTask({
        id: 1,
        title: '学习 JavaScript',
        completed: false,
      });

      stateManager.setTasks([initialTask]);

      // Mock API failure
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'server_error', message: 'Internal server error' }, 500));

      // Try to toggle status
      await expect(taskService.toggleTaskStatus(1)).rejects.toThrow();

      // Verify status was rolled back
      const tasks = stateManager.getTasks();
      expect(tasks[0].completed).toBe(false);
    });
  });

  describe('Task Deletion Flow', () => {
    test('should delete task with optimistic update', async () => {
      // Validates: Requirements 3.2, 3.3
      
      // Step 1: Set up initial state with two tasks
      const tasks = createMockTasks(2);
      stateManager.setTasks(tasks);

      // Step 2: Delete first task
      mockFetch.mockResolvedValueOnce(createMockResponse(null, 204, null));

      await taskService.deleteTask(1);

      // Verify DELETE request was made
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );

      // Verify task was removed from state
      const remainingTasks = stateManager.getTasks();
      expect(remainingTasks.length).toBe(1);
      expect(remainingTasks[0].id).toBe(2);
    });

    test('should rollback deletion on API failure', async () => {
      // Validates: Requirement 3.4 (error handling)
      
      // Set up initial state
      const task = createMockTask({ id: 1 });
      stateManager.setTasks([task]);

      // Mock deletion failure
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'not_found', message: 'Task not found' }, 404));

      // Try to delete
      await expect(taskService.deleteTask(1)).rejects.toThrow();

      // Verify task is still in state
      const tasks = stateManager.getTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe(1);
    });
  });

  describe('Error Scenario Handling', () => {
    test('should handle network error on task load', async () => {
      // Validates: Requirements 1.5, 6.2
      
      // Mock network error
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(taskService.loadTasks()).rejects.toThrow();
      
      // Verify error state is set
      expect(stateManager.getError()).toBeTruthy();
    });

    test('should handle API timeout', async () => {
      // Validates: Requirement 5.5 (timeout handling)
      
      // Mock timeout
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          }, 100);
        }),
      );

      await expect(taskService.loadTasks()).rejects.toThrow();
      await waitFor(150);
    });

    test('should handle server error (500)', async () => {
      // Validates: Requirements 1.5, 6.1
      
      // Mock server error
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'server_error', message: 'Internal server error' }, 500));

      await expect(taskService.loadTasks()).rejects.toThrow();
      expect(stateManager.getError()).toContain('Internal server error');
    });

    test('should handle validation error from API', async () => {
      // Validates: Requirements 2.6, 6.5
      
      // Mock validation error from API
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        error: 'validation_error', 
        message: 'Title is too long',
      }, 400));

      await expect(
        taskService.createTask('Valid Title', 'Valid Description'),
      ).rejects.toThrow('Title is too long');
    });
  });

  describe('Complete Multi-Step User Journey', () => {
    test('should handle complete user session: load, create, toggle, delete', async () => {
      // Validates: Requirements 1.1, 2.1, 2.2, 2.3, 3.2, 3.3, 4.2, 4.3
      
      // Step 1: Load empty list
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: [] }));

      await taskService.loadTasks();
      expect(stateManager.getTasks().length).toBe(0);

      // Step 2: Create first task
      const task1 = createMockTask({ id: 1, title: '任务一', description: '描述一', completed: false });
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: task1 }, 201));

      await taskService.createTask('任务一', '描述一');
      expect(stateManager.getTasks().length).toBe(1);

      // Step 3: Create second task
      const task2 = createMockTask({ id: 2, title: '任务二', description: '描述二', completed: false });
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: task2 }, 201));

      await taskService.createTask('任务二', '描述二');
      expect(stateManager.getTasks().length).toBe(2);

      // Step 4: Toggle first task to completed
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { ...task1, completed: true } }));

      await taskService.toggleTaskStatus(1);
      expect(stateManager.getTasks()[0].completed).toBe(true);

      // Step 5: Delete second task
      mockFetch.mockResolvedValueOnce(createMockResponse(null, 204, null));

      await taskService.deleteTask(2);
      expect(stateManager.getTasks().length).toBe(1);

      // Step 6: Verify final state
      const finalTasks = stateManager.getTasks();
      expect(finalTasks[0].title).toBe('任务一');
      expect(finalTasks[0].completed).toBe(true);
    });

    test('should handle mixed success and failure scenarios', async () => {
      // Set up initial state
      const task = createMockTask({ id: 1, completed: false });
      stateManager.setTasks([task]);

      // Create a new task - success
      const newTask = createMockTask({ id: 2, title: '新任务', description: '新描述' });
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: newTask }, 201));

      await taskService.createTask('新任务', '新描述');
      expect(stateManager.getTasks().length).toBe(2);

      // Toggle first task - failure
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'server_error', message: 'Server error' }, 500));

      await expect(taskService.toggleTaskStatus(1)).rejects.toThrow();
      expect(stateManager.getTasks()[0].completed).toBe(false);

      // Delete second task - success
      mockFetch.mockResolvedValueOnce(createMockResponse(null, 204, null));

      await taskService.deleteTask(2);
      expect(stateManager.getTasks().length).toBe(1);
      expect(stateManager.getTasks()[0].id).toBe(1);
    });
  });

  describe('State Management and Synchronization', () => {
    test('should notify subscribers on state changes', async () => {
      // Validates: Requirement 9.1 (UI synchronization)
      
      const subscriber = jest.fn();
      stateManager.subscribe(subscriber);

      // Load tasks
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: [createMockTask()] }));

      await taskService.loadTasks();
      
      // Verify subscriber was called
      expect(subscriber).toHaveBeenCalled();
      expect(subscriber).toHaveBeenCalledWith([expect.objectContaining({ id: 1 })]);
    });

    test('should maintain state consistency after operations', async () => {
      // Validates: Requirements 9.3, 9.4
      
      // Set up initial state with 3 uncompleted tasks
      const tasks = [
        createMockTask({ id: 1, completed: false }),
        createMockTask({ id: 2, completed: false }),
        createMockTask({ id: 3, completed: false }),
      ];
      stateManager.setTasks(tasks);

      // Perform multiple operations
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { ...tasks[0], completed: true } }));

      await taskService.toggleTaskStatus(1);

      mockFetch.mockResolvedValueOnce(createMockResponse(null, 204, null));

      await taskService.deleteTask(2);

      // Verify final state is consistent
      const finalTasks = stateManager.getTasks();
      expect(finalTasks.length).toBe(2);
      const task1 = finalTasks.find(t => t.id === 1);
      expect(task1).toBeDefined();
      expect(task1.completed).toBe(true);
      expect(finalTasks.find(t => t.id === 2)).toBeUndefined();
    });
  });
});
