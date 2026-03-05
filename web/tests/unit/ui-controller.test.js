/**
 * UIController Unit Tests
 * 
 * Tests application initialization, state change handling, 
 * user operation coordination, and error handling
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { UIController } from '../../js/ui-controller.js';
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

describe('UIController', () => {
  let taskService;
  let stateManager;
  let components;
  let controller;

  beforeEach(() => {
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

  describe('constructor', () => {
    test('should initialize with provided dependencies', () => {
      expect(controller.taskService).toBe(taskService);
      expect(controller.stateManager).toBe(stateManager);
      expect(controller.components).toBe(components);
      expect(controller.unsubscribe).toBeNull();
    });
  });

  describe('init', () => {
    test('should subscribe to state changes', async () => {
      taskService.loadTasks.mockResolvedValue(undefined);
      
      await controller.init();
      
      expect(stateManager.subscribe).toHaveBeenCalledTimes(1);
      expect(typeof stateManager.subscribe.mock.calls[0][0]).toBe('function');
    });

    test('should set up event listeners', async () => {
      taskService.loadTasks.mockResolvedValue(undefined);
      
      await controller.init();
      
      expect(components.taskList.container.addEventListener).toHaveBeenCalledWith(
        'task-toggle',
        expect.any(Function),
      );
      expect(components.taskList.container.addEventListener).toHaveBeenCalledWith(
        'task-delete',
        expect.any(Function),
      );
    });

    test('should load initial tasks', async () => {
      taskService.loadTasks.mockResolvedValue(undefined);
      
      await controller.init();
      
      expect(taskService.loadTasks).toHaveBeenCalledTimes(1);
    });

    test('should show error notification when loading fails', async () => {
      const error = new Error('Network error');
      taskService.loadTasks.mockRejectedValue(error);
      
      await controller.init();
      
      expect(components.notification.showError).toHaveBeenCalledWith('Network error');
    });

    test('should show error in task list when loading fails', async () => {
      const error = new Error('Network error');
      taskService.loadTasks.mockRejectedValue(error);
      
      await controller.init();
      
      expect(components.taskList.renderError).toHaveBeenCalledWith('Network error');
    });
  });

  describe('handleStateChange', () => {
    test('should render loading state when loading', () => {
      stateManager.setLoading(true);
      
      controller.handleStateChange([]);
      
      expect(components.taskList.renderLoading).toHaveBeenCalled();
      expect(components.taskList.render).not.toHaveBeenCalled();
      expect(components.taskList.renderEmptyState).not.toHaveBeenCalled();
    });

    test('should render error state when error exists', () => {
      const errorMessage = 'Something went wrong';
      stateManager.setError(errorMessage);
      
      controller.handleStateChange([]);
      
      expect(components.taskList.renderError).toHaveBeenCalledWith(errorMessage);
      expect(components.taskList.render).not.toHaveBeenCalled();
      expect(components.taskList.renderEmptyState).not.toHaveBeenCalled();
    });

    test('should render empty state when no tasks', () => {
      stateManager.setLoading(false);
      stateManager.setError(null);
      
      controller.handleStateChange([]);
      
      expect(components.taskList.renderEmptyState).toHaveBeenCalled();
      expect(components.taskList.render).not.toHaveBeenCalled();
    });

    test('should render task list when tasks exist', () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: '', completed: false, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, title: 'Task 2', description: '', completed: true, created_at: '2024-01-02T00:00:00Z' },
      ];
      stateManager.setLoading(false);
      stateManager.setError(null);
      
      controller.handleStateChange(tasks);
      
      expect(components.taskList.render).toHaveBeenCalledWith(tasks);
      expect(components.taskList.renderEmptyState).not.toHaveBeenCalled();
    });

    test('should prioritize loading state over error state', () => {
      stateManager.setLoading(true);
      stateManager.setError('Some error');
      
      controller.handleStateChange([]);
      
      expect(components.taskList.renderLoading).toHaveBeenCalled();
      expect(components.taskList.renderError).not.toHaveBeenCalled();
    });

    test('should prioritize error state over empty/task list', () => {
      stateManager.setLoading(false);
      stateManager.setError('Some error');
      
      controller.handleStateChange([]);
      
      expect(components.taskList.renderError).toHaveBeenCalled();
      expect(components.taskList.renderEmptyState).not.toHaveBeenCalled();
      expect(components.taskList.render).not.toHaveBeenCalled();
    });
  });

  describe('handleTaskToggle', () => {
    test('should call taskService.toggleTaskStatus with correct id', async () => {
      taskService.toggleTaskStatus.mockResolvedValue(undefined);
      
      await controller.handleTaskToggle(123);
      
      expect(taskService.toggleTaskStatus).toHaveBeenCalledWith(123);
    });

    test('should show success notification on successful toggle', async () => {
      taskService.toggleTaskStatus.mockResolvedValue(undefined);
      
      await controller.handleTaskToggle(1);
      
      expect(components.notification.showSuccess).toHaveBeenCalledWith('任务状态已更新');
    });

    test('should show error notification on failed toggle', async () => {
      const error = new Error('Toggle failed');
      taskService.toggleTaskStatus.mockRejectedValue(error);
      
      await controller.handleTaskToggle(1);
      
      expect(components.notification.showError).toHaveBeenCalledWith('Toggle failed');
    });

    test('should not throw error when toggle fails', async () => {
      const error = new Error('Toggle failed');
      taskService.toggleTaskStatus.mockRejectedValue(error);
      
      await expect(controller.handleTaskToggle(1)).resolves.not.toThrow();
    });
  });

  describe('handleTaskDelete', () => {
    test('should call taskService.deleteTask with correct id', async () => {
      taskService.deleteTask.mockResolvedValue(undefined);
      
      await controller.handleTaskDelete(456);
      
      expect(taskService.deleteTask).toHaveBeenCalledWith(456);
    });

    test('should show success notification on successful delete', async () => {
      taskService.deleteTask.mockResolvedValue(undefined);
      
      await controller.handleTaskDelete(1);
      
      expect(components.notification.showSuccess).toHaveBeenCalledWith('任务已删除');
    });

    test('should show error notification on failed delete', async () => {
      const error = new Error('Delete failed');
      taskService.deleteTask.mockRejectedValue(error);
      
      await controller.handleTaskDelete(1);
      
      expect(components.notification.showError).toHaveBeenCalledWith('Delete failed');
    });

    test('should not throw error when delete fails', async () => {
      const error = new Error('Delete failed');
      taskService.deleteTask.mockRejectedValue(error);
      
      await expect(controller.handleTaskDelete(1)).resolves.not.toThrow();
    });
  });

  describe('handleTaskCreate', () => {
    test('should call taskService.createTask with correct parameters', async () => {
      taskService.createTask.mockResolvedValue({ id: 1, title: 'New Task', description: 'Description', completed: false, created_at: '2024-01-01T00:00:00Z' });
      
      await controller.handleTaskCreate('New Task', 'Description');
      
      expect(taskService.createTask).toHaveBeenCalledWith('New Task', 'Description');
    });

    test('should show success notification on successful create', async () => {
      taskService.createTask.mockResolvedValue({ id: 1, title: 'New Task', description: '', completed: false, created_at: '2024-01-01T00:00:00Z' });
      
      await controller.handleTaskCreate('New Task', '');
      
      expect(components.notification.showSuccess).toHaveBeenCalledWith('任务创建成功');
    });

    test('should show error notification on failed create', async () => {
      const error = new Error('Create failed');
      taskService.createTask.mockRejectedValue(error);
      
      await expect(controller.handleTaskCreate('New Task', '')).rejects.toThrow();
      
      expect(components.notification.showError).toHaveBeenCalledWith('Create failed');
    });

    test('should re-throw error when create fails', async () => {
      const error = new Error('Create failed');
      taskService.createTask.mockRejectedValue(error);
      
      await expect(controller.handleTaskCreate('New Task', '')).rejects.toThrow('Create failed');
    });
  });

  describe('event listeners', () => {
    test('should handle task-toggle event', async () => {
      taskService.loadTasks.mockResolvedValue(undefined);
      taskService.toggleTaskStatus.mockResolvedValue(undefined);
      
      await controller.init();
      
      // Get the event listener that was registered
      const toggleListener = components.taskList.container.addEventListener.mock.calls
        .find(call => call[0] === 'task-toggle')[1];
      
      // Simulate event
      const event = { detail: { id: 123 } };
      await toggleListener(event);
      
      expect(taskService.toggleTaskStatus).toHaveBeenCalledWith(123);
    });

    test('should handle task-delete event', async () => {
      taskService.loadTasks.mockResolvedValue(undefined);
      taskService.deleteTask.mockResolvedValue(undefined);
      
      await controller.init();
      
      // Get the event listener that was registered
      const deleteListener = components.taskList.container.addEventListener.mock.calls
        .find(call => call[0] === 'task-delete')[1];
      
      // Simulate event
      const event = { detail: { id: 456 } };
      await deleteListener(event);
      
      expect(taskService.deleteTask).toHaveBeenCalledWith(456);
    });
  });

  describe('destroy', () => {
    test('should call unsubscribe function if it exists', async () => {
      taskService.loadTasks.mockResolvedValue(undefined);
      const unsubscribeMock = jest.fn();
      stateManager.subscribe.mockReturnValue(unsubscribeMock);
      
      await controller.init();
      controller.destroy();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    test('should not throw if unsubscribe is null', () => {
      expect(() => controller.destroy()).not.toThrow();
    });
  });

  describe('integration', () => {
    test('should coordinate full initialization flow', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: '', completed: false, created_at: '2024-01-01T00:00:00Z' },
      ];
      
      taskService.loadTasks.mockImplementation(async () => {
        stateManager.setTasks(tasks);
      });
      
      await controller.init();
      
      // Verify subscription was set up
      expect(stateManager.subscribe).toHaveBeenCalled();
      
      // Verify tasks were loaded
      expect(taskService.loadTasks).toHaveBeenCalled();
      
      // Verify event listeners were set up
      expect(components.taskList.container.addEventListener).toHaveBeenCalledTimes(2);
    });

    test('should handle state changes through subscription', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: '', completed: false, created_at: '2024-01-01T00:00:00Z' },
      ];
      
      let stateChangeCallback;
      stateManager.subscribe.mockImplementation((callback) => {
        stateChangeCallback = callback;
        return jest.fn();
      });
      
      taskService.loadTasks.mockResolvedValue(undefined);
      
      await controller.init();
      
      // Simulate state change
      stateChangeCallback(tasks);
      
      // Verify UI was updated
      expect(components.taskList.render).toHaveBeenCalledWith(tasks);
    });
  });
});
