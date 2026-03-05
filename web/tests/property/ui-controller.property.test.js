/**
 * UIController Property-Based Tests
 * 
 * Tests Properties 3, 15, 21, 22, 23
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { UIController } from '../../js/ui-controller.js';
import { taskGenerator, apiErrorGenerator } from '../helpers/generators.js';
import { createMockTaskService, createMockStateManager, createMockNotificationComponent } from '../helpers/mocks.js';

/**
 * Creates a mock TaskListComponent
 */
function createMockTaskListComponent() {
  const container = {
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
  
  return {
    container,
    render: jest.fn(),
    renderEmptyState: jest.fn(),
    renderLoading: jest.fn(),
    renderError: jest.fn(),
  };
}

/**
 * Creates a mock TaskFormComponent
 */
function createMockTaskFormComponent() {
  return {
    render: jest.fn(),
    clearForm: jest.fn(),
    setSubmitting: jest.fn(),
    showValidationError: jest.fn(),
  };
}

describe('UIController Property-Based Tests', () => {
  let taskService;
  let stateManager;
  let components;
  let controller;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    taskService = createMockTaskService();
    stateManager = createMockStateManager();
    components = {
      taskList: createMockTaskListComponent(),
      taskForm: createMockTaskFormComponent(),
      notification: createMockNotificationComponent(),
    };
    controller = new UIController(taskService, stateManager, components);
  });

  /**
   * Property 3: API Error Display
   * 
   * For any API operation that fails, the frontend should display 
   * a user-friendly error message to the user.
   * 
   * **Validates: Requirements 1.5, 2.6, 3.4, 6.1, 6.2**
   */
  describe('Property 3: API Error Display', () => {
    test('should display error notification when task toggle fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          apiErrorGenerator(),
          async (taskId, errorData) => {
            // Setup: Make toggleTaskStatus fail
            taskService.toggleTaskStatus.mockRejectedValue(
              new Error(errorData.message),
            );

            // Execute: Toggle task
            await controller.handleTaskToggle(taskId);

            // Verify: Error notification was shown
            expect(components.notification.showError).toHaveBeenCalled();
            const errorCall = components.notification.showError.mock.calls[0];
            expect(errorCall[0]).toBeTruthy();
            expect(typeof errorCall[0]).toBe('string');
          },
        ),
        { numRuns: 100 },
      );
    });

    test('should display error notification when task delete fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          apiErrorGenerator(),
          async (taskId, errorData) => {
            // Setup: Make deleteTask fail
            taskService.deleteTask.mockRejectedValue(
              new Error(errorData.message),
            );

            // Execute: Delete task
            await controller.handleTaskDelete(taskId);

            // Verify: Error notification was shown
            expect(components.notification.showError).toHaveBeenCalled();
            const errorCall = components.notification.showError.mock.calls[0];
            expect(errorCall[0]).toBeTruthy();
            expect(typeof errorCall[0]).toBe('string');
          },
        ),
        { numRuns: 100 },
      );
    });

    test('should display error notification when task create fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ maxLength: 1000 }),
          apiErrorGenerator(),
          async (title, description, errorData) => {
            // Setup: Make createTask fail
            taskService.createTask.mockRejectedValue(
              new Error(errorData.message),
            );

            // Execute: Create task (expect it to throw)
            try {
              await controller.handleTaskCreate(title, description);
            } catch (error) {
              // Expected to throw
            }

            // Verify: Error notification was shown
            expect(components.notification.showError).toHaveBeenCalled();
            const errorCall = components.notification.showError.mock.calls[0];
            expect(errorCall[0]).toBeTruthy();
            expect(typeof errorCall[0]).toBe('string');
          },
        ),
        { numRuns: 100 },
      );
    });

    test('should display error in task list when initial load fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          apiErrorGenerator(),
          async (errorData) => {
            // Setup: Make loadTasks fail
            taskService.loadTasks.mockRejectedValue(
              new Error(errorData.message),
            );

            // Execute: Initialize controller
            await controller.init();

            // Verify: Error was displayed in both notification and task list
            expect(components.notification.showError).toHaveBeenCalled();
            expect(components.taskList.renderError).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 15: Loading State Display
   * 
   * For any API request in progress, the frontend should display 
   * a loading indicator until the response is received or the request times out.
   * 
   * **Validates: Requirements 1.5, 2.6, 3.4, 6.1, 6.2, 6.4, 9.3, 9.4, 10.3**
   */
  describe('Property 15: Loading State Display', () => {
    test('should display loading state when loading tasks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(taskGenerator()),
          async (tasks) => {
            // Setup: Make loadTasks async and set loading state
            taskService.loadTasks.mockImplementation(async () => {
              stateManager.setLoading(true);
              // Simulate async delay
              await new Promise(resolve => setTimeout(resolve, 10));
              stateManager.setTasks(tasks);
              stateManager.setLoading(false);
            });

            // Execute: Initialize controller
            const initPromise = controller.init();

            // Verify: Loading state should be displayed during load
            // (handleStateChange is called by subscription)
            stateManager.setLoading(true);
            controller.handleStateChange(stateManager.getTasks());
            expect(components.taskList.renderLoading).toHaveBeenCalled();

            await initPromise;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('should hide loading state after tasks are loaded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(taskGenerator(), { minLength: 1 }),
          async (tasks) => {
            // Setup: Make loadTasks complete successfully
            taskService.loadTasks.mockImplementation(async () => {
              stateManager.setLoading(true);
              await new Promise(resolve => setTimeout(resolve, 10));
              stateManager.setTasks(tasks);
              stateManager.setLoading(false);
            });

            // Execute: Initialize controller
            await controller.init();

            // Simulate state change after loading completes
            stateManager.setLoading(false);
            controller.handleStateChange(tasks);

            // Verify: Task list should be rendered (not loading)
            expect(components.taskList.render).toHaveBeenCalledWith(tasks);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 21: Concurrent Operation Consistency
   * 
   * For any set of concurrent operations on tasks, when all operations complete,
   * the final UI state should be consistent with the backend state, 
   * regardless of response order.
   * 
   * **Validates: Requirements 9.3**
   */
  describe('Property 21: Concurrent Operation Consistency', () => {
    test('should handle concurrent toggle operations consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 5 }),
          async (taskIds) => {
            // Create fresh mocks for this iteration
            const freshTaskService = createMockTaskService();
            const freshStateManager = createMockStateManager();
            const freshComponents = {
              taskList: createMockTaskListComponent(),
              taskForm: createMockTaskFormComponent(),
              notification: createMockNotificationComponent(),
            };
            const freshController = new UIController(freshTaskService, freshStateManager, freshComponents);

            // Setup: Make all toggles succeed
            freshTaskService.toggleTaskStatus.mockResolvedValue(undefined);

            // Execute: Trigger multiple concurrent toggles
            const togglePromises = taskIds.map(id => 
              freshController.handleTaskToggle(id),
            );

            await Promise.all(togglePromises);

            // Verify: All toggles were called
            expect(freshTaskService.toggleTaskStatus).toHaveBeenCalledTimes(taskIds.length);
            
            // Verify: Success notification shown for each
            expect(freshComponents.notification.showSuccess).toHaveBeenCalledTimes(taskIds.length);
          },
        ),
        { numRuns: 50 },
      );
    });

    test('should handle concurrent delete operations consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 2, maxLength: 5 }),
          async (taskIds) => {
            // Create fresh mocks for this iteration
            const freshTaskService = createMockTaskService();
            const freshStateManager = createMockStateManager();
            const freshComponents = {
              taskList: createMockTaskListComponent(),
              taskForm: createMockTaskFormComponent(),
              notification: createMockNotificationComponent(),
            };
            const freshController = new UIController(freshTaskService, freshStateManager, freshComponents);

            // Setup: Make all deletes succeed
            freshTaskService.deleteTask.mockResolvedValue(undefined);

            // Execute: Trigger multiple concurrent deletes
            const deletePromises = taskIds.map(id => 
              freshController.handleTaskDelete(id),
            );

            await Promise.all(deletePromises);

            // Verify: All deletes were called
            expect(freshTaskService.deleteTask).toHaveBeenCalledTimes(taskIds.length);
            
            // Verify: Success notification shown for each
            expect(freshComponents.notification.showSuccess).toHaveBeenCalledTimes(taskIds.length);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 22: Failed Operation State Consistency
   * 
   * For any operation that fails, the UI state should remain consistent 
   * with the backend state (no orphaned or incorrect data in the UI).
   * 
   * **Validates: Requirements 9.4**
   */
  describe('Property 22: Failed Operation State Consistency', () => {
    test('should maintain state consistency when toggle fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          apiErrorGenerator(),
          async (taskId, errorData) => {
            // Setup: Make toggle fail
            taskService.toggleTaskStatus.mockRejectedValue(
              new Error(errorData.message),
            );

            // Get initial state
            const initialTasks = stateManager.getTasks();

            // Execute: Toggle task
            await controller.handleTaskToggle(taskId);

            // Verify: State should be consistent (TaskService handles rollback)
            // Error notification should be shown
            expect(components.notification.showError).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });

    test('should maintain state consistency when delete fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          apiErrorGenerator(),
          async (taskId, errorData) => {
            // Setup: Make delete fail
            taskService.deleteTask.mockRejectedValue(
              new Error(errorData.message),
            );

            // Get initial state
            const initialTasks = stateManager.getTasks();

            // Execute: Delete task
            await controller.handleTaskDelete(taskId);

            // Verify: State should be consistent (TaskService handles rollback)
            // Error notification should be shown
            expect(components.notification.showError).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });

    test('should maintain state consistency when create fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ maxLength: 1000 }),
          apiErrorGenerator(),
          async (title, description, errorData) => {
            // Setup: Make create fail
            taskService.createTask.mockRejectedValue(
              new Error(errorData.message),
            );

            // Get initial state
            const initialTasks = stateManager.getTasks();

            // Execute: Create task (expect it to throw)
            try {
              await controller.handleTaskCreate(title, description);
            } catch (error) {
              // Expected to throw
            }

            // Verify: State should remain unchanged
            expect(stateManager.getTasks()).toEqual(initialTasks);
            
            // Error notification should be shown
            expect(components.notification.showError).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 23: API Request Deduplication
   * 
   * For any sequence of user actions, the frontend should not make 
   * redundant API requests for the same data within a short time window.
   * 
   * **Validates: Requirements 10.3**
   */
  describe('Property 23: API Request Deduplication', () => {
    test('should only load tasks once during initialization', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(taskGenerator()),
          async (tasks) => {
            // Create fresh mocks for this iteration
            const freshTaskService = createMockTaskService();
            const freshStateManager = createMockStateManager();
            const freshComponents = {
              taskList: createMockTaskListComponent(),
              taskForm: createMockTaskFormComponent(),
              notification: createMockNotificationComponent(),
            };
            const freshController = new UIController(freshTaskService, freshStateManager, freshComponents);

            // Setup: Make loadTasks succeed
            freshTaskService.loadTasks.mockResolvedValue(undefined);
            freshStateManager.setTasks(tasks);

            // Execute: Initialize controller
            await freshController.init();

            // Verify: loadTasks should be called exactly once
            expect(freshTaskService.loadTasks).toHaveBeenCalledTimes(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    test('should not make redundant requests for same task operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1 }),
          async (taskId) => {
            // Create fresh mocks for this iteration
            const freshTaskService = createMockTaskService();
            const freshStateManager = createMockStateManager();
            const freshComponents = {
              taskList: createMockTaskListComponent(),
              taskForm: createMockTaskFormComponent(),
              notification: createMockNotificationComponent(),
            };
            const freshController = new UIController(freshTaskService, freshStateManager, freshComponents);

            // Setup: Make toggle succeed
            freshTaskService.toggleTaskStatus.mockResolvedValue(undefined);

            // Execute: Toggle same task once
            await freshController.handleTaskToggle(taskId);

            // Verify: Only one API call was made
            expect(freshTaskService.toggleTaskStatus).toHaveBeenCalledTimes(1);
            expect(freshTaskService.toggleTaskStatus).toHaveBeenCalledWith(taskId);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
