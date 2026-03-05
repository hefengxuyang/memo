/**
 * TaskService Property-Based Tests
 * 
 * Tests Properties 5, 6, 7, 8, 9, 10
 * Validates: Requirements 2.3, 2.4, 2.5, 2.8, 2.9, 2.10, 3.3, 4.3, 4.5, 9.1
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { TaskService } from '../../js/task-service.js';
import { StateManager } from '../../js/state-manager.js';
import { 
  validTaskGenerator,
  whitespaceStringGenerator,
  createTaskDataGenerator, 
} from '../helpers/generators.js';
import { createMockTask } from '../helpers/factories.js';

describe('TaskService Property-Based Tests', () => {
  let stateManager;
  let mockApiClient;
  let taskService;

  // Helper to create fresh instances for each test
  const createFreshInstances = () => {
    const sm = new StateManager();
    const api = {
      getTasks: async () => [],
      createTask: async (data) => ({ id: 1, ...data, completed: false, created_at: new Date().toISOString() }),
      updateTaskStatus: async (id, completed) => ({ id, completed }),
      deleteTask: async (id) => {},
    };
    const ts = new TaskService(api, sm);
    return { stateManager: sm, mockApiClient: api, taskService: ts };
  };

  beforeEach(() => {
    const instances = createFreshInstances();
    stateManager = instances.stateManager;
    mockApiClient = instances.mockApiClient;
    taskService = instances.taskService;
  });

  /**
   * Property 5: UI Synchronization After Operations
   * **Validates: Requirements 2.3, 3.3, 4.3, 9.1**
   * 
   * For any successful CRUD operation (create, delete, update status), 
   * the task list UI should be updated to reflect the new state
   */
  describe('Property 5: UI Synchronization After Operations', () => {
    test('create operation updates state with new task', async () => {
      await fc.assert(
        fc.asyncProperty(createTaskDataGenerator(), async (taskData) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Setup: Mock API to return created task
          const createdTask = {
            id: Math.floor(Math.random() * 10000),
            title: taskData.title,
            description: taskData.description,
            completed: false,
            created_at: new Date().toISOString(),
          };
          api.createTask = async () => createdTask;

          // Execute: Create task
          await ts.createTask(taskData.title, taskData.description);

          // Verify: State contains the new task
          const tasks = sm.getTasks();
          const foundTask = tasks.find(t => t.id === createdTask.id);
          
          return foundTask !== undefined &&
                 foundTask.title === taskData.title &&
                 foundTask.description === taskData.description &&
                 foundTask.completed === false;
        }),
        { numRuns: 100 },
      );
    });

    test('delete operation removes task from state', async () => {
      await fc.assert(
        fc.asyncProperty(validTaskGenerator(), async (task) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Setup: Add task to state
          sm.addTask(task);
          const initialCount = sm.getTasks().length;

          // Execute: Delete task
          await ts.deleteTask(task.id);

          // Verify: Task is removed from state
          const tasks = sm.getTasks();
          const foundTask = tasks.find(t => t.id === task.id);
          
          return foundTask === undefined && 
                 tasks.length === initialCount - 1;
        }),
        { numRuns: 100 },
      );
    });

    test('toggle status operation updates task completion state', async () => {
      await fc.assert(
        fc.asyncProperty(validTaskGenerator(), async (task) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Setup: Add task to state
          sm.addTask(task);
          const originalCompleted = task.completed;

          // Execute: Toggle status
          await ts.toggleTaskStatus(task.id);

          // Verify: Task completion status is toggled
          const tasks = sm.getTasks();
          const updatedTask = tasks.find(t => t.id === task.id);
          
          return updatedTask !== undefined &&
                 updatedTask.completed === !originalCompleted;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 6: Form Reset After Creation
   * **Validates: Requirements 2.4**
   * 
   * For any successful task creation, the form input fields should be cleared
   * Note: This property tests that TaskService returns successfully, 
   * allowing the UI layer to clear the form
   */
  describe('Property 6: Form Reset After Creation', () => {
    test('successful task creation returns created task object', async () => {
      await fc.assert(
        fc.asyncProperty(createTaskDataGenerator(), async (taskData) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Setup: Mock API to return created task
          const createdTask = {
            id: Math.floor(Math.random() * 10000),
            title: taskData.title,
            description: taskData.description,
            completed: false,
            created_at: new Date().toISOString(),
          };
          api.createTask = async () => createdTask;

          // Execute: Create task
          const result = await ts.createTask(taskData.title, taskData.description);

          // Verify: Returns the created task (UI can use this to know creation succeeded)
          return result !== undefined &&
                 result.id === createdTask.id &&
                 result.title === taskData.title &&
                 result.description === taskData.description;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: Empty Title Validation
   * **Validates: Requirements 2.5**
   * 
   * For any string composed entirely of whitespace characters (including empty string),
   * attempting to create a task with that title should display a validation error
   */
  describe('Property 7: Empty Title Validation', () => {
    test('whitespace-only titles fail validation', async () => {
      await fc.assert(
        fc.asyncProperty(whitespaceStringGenerator(), async (title) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Execute: Validate input
          const validation = ts.validateTaskInput(title);

          // Verify: Validation fails for whitespace-only titles
          return !validation.valid && 
                 validation.error !== undefined &&
                 validation.error.length > 0;
        }),
        { numRuns: 100 },
      );
    });

    test('whitespace-only titles throw error on createTask', async () => {
      await fc.assert(
        fc.asyncProperty(whitespaceStringGenerator(), async (title) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Execute & Verify: Creating task with whitespace title throws error
          try {
            await ts.createTask(title, 'Some description');
            return false; // Should not reach here
          } catch (error) {
            return error.message !== undefined && error.message.length > 0;
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 10: Rollback on Update Failure
   * **Validates: Requirements 4.5**
   * 
   * For any task status toggle that fails (API returns error),
   * the task's visual state should be reverted to its original completion status
   */
  describe('Property 10: Rollback on Update Failure', () => {
    test('failed toggle status reverts to original state', async () => {
      await fc.assert(
        fc.asyncProperty(validTaskGenerator(), async (task) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Setup: Add task to state and mock API to fail
          sm.addTask(task);
          const originalCompleted = task.completed;
          api.updateTaskStatus = async () => {
            throw new Error('API Error: Failed to update task status');
          };

          // Execute: Try to toggle status (should fail)
          try {
            await ts.toggleTaskStatus(task.id);
          } catch (error) {
            // Expected to throw
          }

          // Verify: Task status is reverted to original
          const tasks = sm.getTasks();
          const revertedTask = tasks.find(t => t.id === task.id);
          
          return revertedTask !== undefined &&
                 revertedTask.completed === originalCompleted;
        }),
        { numRuns: 100 },
      );
    });

    test('failed delete operation reverts to original state', async () => {
      await fc.assert(
        fc.asyncProperty(validTaskGenerator(), async (task) => {
          // Create fresh instances for each test iteration
          const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
          
          // Setup: Add task to state and mock API to fail
          sm.addTask(task);
          api.deleteTask = async () => {
            throw new Error('API Error: Failed to delete task');
          };

          // Execute: Try to delete task (should fail)
          try {
            await ts.deleteTask(task.id);
          } catch (error) {
            // Expected to throw
          }

          // Verify: Task is still in state (rollback successful)
          const tasks = sm.getTasks();
          const restoredTask = tasks.find(t => t.id === task.id);
          
          return restoredTask !== undefined &&
                 restoredTask.id === task.id &&
                 restoredTask.title === task.title &&
                 restoredTask.completed === task.completed;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: Valid Input Triggers API Call
   * **Validates: Requirements 2.8**
   * 
   * For any valid input (passing validation), TaskService should call 
   * APIClient's updateTask method with the correct parameters
   */
  describe('Property 7: Valid Input Triggers API Call', () => {
    test('updateTask calls API with correct parameters', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTaskGenerator(),
          createTaskDataGenerator(),
          async (task, updateData) => {
            // Create fresh instances for each test iteration
            const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
            
            // Setup: Add task to state and track API calls
            sm.addTask(task);
            let apiCalled = false;
            let apiCalledWithCorrectId = false;
            let apiCalledWithCorrectData = false;
            
            api.updateTask = async (id, data) => {
              apiCalled = true;
              apiCalledWithCorrectId = (id === task.id);
              apiCalledWithCorrectData = (
                data.title === updateData.title &&
                data.description === updateData.description
              );
              // Return updated task
              return { ...task, ...data };
            };

            // Execute: Update task
            await ts.updateTask(task.id, updateData);

            // Verify: API was called with correct parameters
            return apiCalled && 
                   apiCalledWithCorrectId && 
                   apiCalledWithCorrectData;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 8: UI Response After Successful Update
   * **Validates: Requirements 2.9**
   * 
   * For any successful task update, the frontend should update the task 
   * in the state manager with the new data
   */
  describe('Property 8: UI Response After Successful Update', () => {
    test('successful update updates state with new data', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTaskGenerator(),
          createTaskDataGenerator(),
          async (task, updateData) => {
            // Create fresh instances for each test iteration
            const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
            
            // Setup: Add task to state
            sm.addTask(task);
            
            // Mock API to return updated task
            const updatedTask = {
              ...task,
              title: updateData.title,
              description: updateData.description,
            };
            api.updateTask = async () => updatedTask;

            // Execute: Update task
            await ts.updateTask(task.id, updateData);

            // Verify: State contains the updated task
            const tasks = sm.getTasks();
            const foundTask = tasks.find(t => t.id === task.id);
            
            return foundTask !== undefined &&
                   foundTask.title === updateData.title &&
                   foundTask.description === updateData.description &&
                   foundTask.id === task.id &&
                   foundTask.completed === task.completed &&
                   foundTask.created_at === task.created_at;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 9: UI Response After Failed Update
   * **Validates: Requirements 2.10**
   * 
   * For any failed task update, the frontend should display an error message
   * and the task data in state should remain unchanged
   */
  describe('Property 9: UI Response After Failed Update', () => {
    test('failed update preserves original task data', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTaskGenerator(),
          createTaskDataGenerator(),
          async (task, updateData) => {
            // Create fresh instances for each test iteration
            const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
            
            // Setup: Add task to state and mock API to fail
            sm.addTask(task);
            const originalTitle = task.title;
            const originalDescription = task.description;
            
            api.updateTask = async () => {
              throw new Error('API Error: Failed to update task');
            };

            // Execute: Try to update task (should fail)
            try {
              await ts.updateTask(task.id, updateData);
            } catch (error) {
              // Expected to throw
            }

            // Verify: Task data is unchanged in state
            const tasks = sm.getTasks();
            const unchangedTask = tasks.find(t => t.id === task.id);
            
            return unchangedTask !== undefined &&
                   unchangedTask.title === originalTitle &&
                   unchangedTask.description === originalDescription &&
                   unchangedTask.id === task.id &&
                   unchangedTask.completed === task.completed;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('failed update sets error in state manager', async () => {
      await fc.assert(
        fc.asyncProperty(
          validTaskGenerator(),
          createTaskDataGenerator(),
          async (task, updateData) => {
            // Create fresh instances for each test iteration
            const { stateManager: sm, mockApiClient: api, taskService: ts } = createFreshInstances();
            
            // Setup: Add task to state and mock API to fail
            sm.addTask(task);
            const errorMessage = 'API Error: Failed to update task';
            
            api.updateTask = async () => {
              throw new Error(errorMessage);
            };

            // Execute: Try to update task (should fail)
            try {
              await ts.updateTask(task.id, updateData);
            } catch (error) {
              // Expected to throw
            }

            // Verify: Error is set in state manager
            const error = sm.getError();
            return error !== null && error.includes('Failed to update task');
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
