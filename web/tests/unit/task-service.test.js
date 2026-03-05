/**
 * TaskService Unit Tests
 * 
 * Tests task loading, creation, deletion, status toggle, and error propagation
 * Requirements: 2.5, 4.5, 6.1
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TaskService } from '../../js/task-service.js';
import { createMockTask, createMockTasks } from '../helpers/factories.js';

describe('TaskService', () => {
  let taskService;
  let mockApiClient;
  let mockStateManager;

  beforeEach(() => {
    // Create mock API client
    mockApiClient = {
      getTasks: jest.fn(),
      createTask: jest.fn(),
      updateTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
    };

    // Create mock state manager
    mockStateManager = {
      getTasks: jest.fn(() => []),
      setTasks: jest.fn(),
      addTask: jest.fn(),
      updateTask: jest.fn(),
      removeTask: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    };

    taskService = new TaskService(mockApiClient, mockStateManager);
  });

  describe('Task Loading Flow', () => {
    test('loadTasks should fetch tasks from API and update state', async () => {
      const mockTasks = createMockTasks(3);
      mockApiClient.getTasks.mockResolvedValue(mockTasks);

      await taskService.loadTasks();

      expect(mockStateManager.setLoading).toHaveBeenCalledWith(true);
      expect(mockApiClient.getTasks).toHaveBeenCalled();
      expect(mockStateManager.setTasks).toHaveBeenCalledWith(mockTasks);
      expect(mockStateManager.setError).toHaveBeenCalledWith(null);
      expect(mockStateManager.setLoading).toHaveBeenCalledWith(false);
    });

    test('loadTasks should set loading state before API call', async () => {
      const mockTasks = createMockTasks(2);
      mockApiClient.getTasks.mockResolvedValue(mockTasks);

      await taskService.loadTasks();

      // Verify setLoading(true) was called before getTasks
      const setLoadingCalls = mockStateManager.setLoading.mock.calls;
      const getTasksCall = mockApiClient.getTasks.mock.invocationCallOrder[0];
      const firstSetLoadingCall = mockStateManager.setLoading.mock.invocationCallOrder[0];

      expect(firstSetLoadingCall).toBeLessThan(getTasksCall);
      expect(setLoadingCalls[0][0]).toBe(true);
    });

    test('loadTasks should clear error state before loading', async () => {
      const mockTasks = createMockTasks(1);
      mockApiClient.getTasks.mockResolvedValue(mockTasks);

      await taskService.loadTasks();

      expect(mockStateManager.setError).toHaveBeenCalledWith(null);
    });

    test('loadTasks should set loading to false after completion', async () => {
      const mockTasks = createMockTasks(2);
      mockApiClient.getTasks.mockResolvedValue(mockTasks);

      await taskService.loadTasks();

      const setLoadingCalls = mockStateManager.setLoading.mock.calls;
      expect(setLoadingCalls[setLoadingCalls.length - 1][0]).toBe(false);
    });

    test('loadTasks should handle empty task list', async () => {
      mockApiClient.getTasks.mockResolvedValue([]);

      await taskService.loadTasks();

      expect(mockStateManager.setTasks).toHaveBeenCalledWith([]);
      expect(mockStateManager.setLoading).toHaveBeenCalledWith(false);
    });

    test('loadTasks should propagate API errors', async () => {
      const error = new Error('Network error');
      mockApiClient.getTasks.mockRejectedValue(error);

      await expect(taskService.loadTasks()).rejects.toThrow('Network error');
    });

    test('loadTasks should set error state on failure', async () => {
      const error = new Error('API failure');
      mockApiClient.getTasks.mockRejectedValue(error);

      try {
        await taskService.loadTasks();
      } catch (e) {
        // Expected to throw
      }

      expect(mockStateManager.setError).toHaveBeenCalledWith('API failure');
    });

    test('loadTasks should set loading to false even on error', async () => {
      const error = new Error('Network error');
      mockApiClient.getTasks.mockRejectedValue(error);

      try {
        await taskService.loadTasks();
      } catch (e) {
        // Expected to throw
      }

      const setLoadingCalls = mockStateManager.setLoading.mock.calls;
      expect(setLoadingCalls[setLoadingCalls.length - 1][0]).toBe(false);
    });
  });

  describe('Task Creation and Validation', () => {
    test('createTask should validate input before API call', async () => {
      const mockTask = createMockTask({ title: 'Valid Task' });
      mockApiClient.createTask.mockResolvedValue(mockTask);

      await taskService.createTask('Valid Task', 'Description');

      expect(mockApiClient.createTask).toHaveBeenCalled();
    });

    test('createTask should reject empty title', async () => {
      await expect(taskService.createTask('', 'Description')).rejects.toThrow('任务标题不能为空');

      expect(mockApiClient.createTask).not.toHaveBeenCalled();
    });

    test('createTask should reject whitespace-only title', async () => {
      await expect(taskService.createTask('   ', 'Description')).rejects.toThrow('任务标题不能为空');

      expect(mockApiClient.createTask).not.toHaveBeenCalled();
    });

    test('createTask should reject title with only tabs and newlines', async () => {
      await expect(taskService.createTask('\t\n  \t', 'Description')).rejects.toThrow('任务标题不能为空');

      expect(mockApiClient.createTask).not.toHaveBeenCalled();
    });

    test('createTask should accept valid title and description', async () => {
      const mockTask = createMockTask({ title: 'New Task', description: 'New Description' });
      mockApiClient.createTask.mockResolvedValue(mockTask);

      const result = await taskService.createTask('New Task', 'New Description');

      expect(mockApiClient.createTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
      });
      expect(result).toEqual(mockTask);
    });

    test('createTask should accept empty description', async () => {
      const mockTask = createMockTask({ title: 'Task', description: '' });
      mockApiClient.createTask.mockResolvedValue(mockTask);

      await taskService.createTask('Task', '');

      expect(mockApiClient.createTask).toHaveBeenCalledWith({
        title: 'Task',
        description: '',
      });
    });

    test('createTask should use empty string as default description', async () => {
      const mockTask = createMockTask({ title: 'Task' });
      mockApiClient.createTask.mockResolvedValue(mockTask);

      await taskService.createTask('Task');

      expect(mockApiClient.createTask).toHaveBeenCalledWith({
        title: 'Task',
        description: '',
      });
    });

    test('createTask should add task to state after successful creation', async () => {
      const mockTask = createMockTask({ id: 5, title: 'New Task' });
      mockApiClient.createTask.mockResolvedValue(mockTask);

      await taskService.createTask('New Task', 'Description');

      expect(mockStateManager.addTask).toHaveBeenCalledWith(mockTask);
    });

    test('createTask should set loading state during creation', async () => {
      const mockTask = createMockTask();
      mockApiClient.createTask.mockResolvedValue(mockTask);

      await taskService.createTask('Task', 'Description');

      expect(mockStateManager.setLoading).toHaveBeenCalledWith(true);
      expect(mockStateManager.setLoading).toHaveBeenCalledWith(false);
    });

    test('createTask should clear error state before creation', async () => {
      const mockTask = createMockTask();
      mockApiClient.createTask.mockResolvedValue(mockTask);

      await taskService.createTask('Task', 'Description');

      expect(mockStateManager.setError).toHaveBeenCalledWith(null);
    });

    test('createTask should propagate API errors', async () => {
      const error = new Error('Server error');
      mockApiClient.createTask.mockRejectedValue(error);

      await expect(taskService.createTask('Task', 'Description')).rejects.toThrow('Server error');
    });

    test('createTask should set error state on API failure', async () => {
      const error = new Error('Creation failed');
      mockApiClient.createTask.mockRejectedValue(error);

      try {
        await taskService.createTask('Task', 'Description');
      } catch (e) {
        // Expected to throw
      }

      expect(mockStateManager.setError).toHaveBeenCalledWith('Creation failed');
    });

    test('createTask should not add task to state on API failure', async () => {
      const error = new Error('API error');
      mockApiClient.createTask.mockRejectedValue(error);

      try {
        await taskService.createTask('Task', 'Description');
      } catch (e) {
        // Expected to throw
      }

      expect(mockStateManager.addTask).not.toHaveBeenCalled();
    });

    test('createTask should set loading to false even on error', async () => {
      const error = new Error('Error');
      mockApiClient.createTask.mockRejectedValue(error);

      try {
        await taskService.createTask('Task', 'Description');
      } catch (e) {
        // Expected to throw
      }

      const setLoadingCalls = mockStateManager.setLoading.mock.calls;
      expect(setLoadingCalls[setLoadingCalls.length - 1][0]).toBe(false);
    });
  });

  describe('Task Deletion with Optimistic Update', () => {
    test('deleteTask should remove task from state immediately', async () => {
      const mockTask = createMockTask({ id: 1 });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.deleteTask.mockResolvedValue();

      await taskService.deleteTask(1);

      expect(mockStateManager.removeTask).toHaveBeenCalledWith(1);
      expect(mockApiClient.deleteTask).toHaveBeenCalledWith(1);
    });

    test('deleteTask should call API after optimistic update', async () => {
      const mockTask = createMockTask({ id: 2 });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.deleteTask.mockResolvedValue();

      await taskService.deleteTask(2);

      // Verify removeTask was called before deleteTask
      const removeTaskOrder = mockStateManager.removeTask.mock.invocationCallOrder[0];
      const deleteTaskOrder = mockApiClient.deleteTask.mock.invocationCallOrder[0];

      expect(removeTaskOrder).toBeLessThan(deleteTaskOrder);
    });

    test('deleteTask should rollback on API failure', async () => {
      const mockTask = createMockTask({ id: 3 });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.deleteTask.mockRejectedValue(new Error('Delete failed'));

      try {
        await taskService.deleteTask(3);
      } catch (e) {
        // Expected to throw
      }

      // Should re-add the task after removal
      expect(mockStateManager.removeTask).toHaveBeenCalledWith(3);
      expect(mockStateManager.addTask).toHaveBeenCalledWith(mockTask);
    });

    test('deleteTask should set error state on failure', async () => {
      const mockTask = createMockTask({ id: 4 });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.deleteTask.mockRejectedValue(new Error('Network error'));

      try {
        await taskService.deleteTask(4);
      } catch (e) {
        // Expected to throw
      }

      expect(mockStateManager.setError).toHaveBeenCalledWith('Network error');
    });

    test('deleteTask should propagate API errors', async () => {
      const mockTask = createMockTask({ id: 5 });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.deleteTask.mockRejectedValue(new Error('API error'));

      await expect(taskService.deleteTask(5)).rejects.toThrow('API error');
    });

    test('deleteTask should throw error if task not found', async () => {
      mockStateManager.getTasks.mockReturnValue([]);

      await expect(taskService.deleteTask(999)).rejects.toThrow('Task not found');

      expect(mockApiClient.deleteTask).not.toHaveBeenCalled();
    });

    test('deleteTask should handle multiple tasks correctly', async () => {
      const tasks = createMockTasks(3);
      mockStateManager.getTasks.mockReturnValue(tasks);
      mockApiClient.deleteTask.mockResolvedValue();

      await taskService.deleteTask(2);

      expect(mockStateManager.removeTask).toHaveBeenCalledWith(2);
      expect(mockApiClient.deleteTask).toHaveBeenCalledWith(2);
    });
  });

  describe('Status Toggle with Optimistic Update and Rollback', () => {
    test('toggleTaskStatus should update state immediately', async () => {
      const mockTask = createMockTask({ id: 1, completed: false });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockResolvedValue({ ...mockTask, completed: true });

      await taskService.toggleTaskStatus(1);

      expect(mockStateManager.updateTask).toHaveBeenCalledWith(1, { completed: true });
      expect(mockApiClient.updateTaskStatus).toHaveBeenCalledWith(1, true);
    });

    test('toggleTaskStatus should toggle from false to true', async () => {
      const mockTask = createMockTask({ id: 1, completed: false });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockResolvedValue({ ...mockTask, completed: true });

      await taskService.toggleTaskStatus(1);

      expect(mockStateManager.updateTask).toHaveBeenCalledWith(1, { completed: true });
    });

    test('toggleTaskStatus should toggle from true to false', async () => {
      const mockTask = createMockTask({ id: 2, completed: true });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockResolvedValue({ ...mockTask, completed: false });

      await taskService.toggleTaskStatus(2);

      expect(mockStateManager.updateTask).toHaveBeenCalledWith(2, { completed: false });
    });

    test('toggleTaskStatus should call API after optimistic update', async () => {
      const mockTask = createMockTask({ id: 3, completed: false });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockResolvedValue({ ...mockTask, completed: true });

      await taskService.toggleTaskStatus(3);

      // Verify updateTask was called before updateTaskStatus
      const updateTaskOrder = mockStateManager.updateTask.mock.invocationCallOrder[0];
      const updateStatusOrder = mockApiClient.updateTaskStatus.mock.invocationCallOrder[0];

      expect(updateTaskOrder).toBeLessThan(updateStatusOrder);
    });

    test('toggleTaskStatus should rollback on API failure', async () => {
      const mockTask = createMockTask({ id: 4, completed: false });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockRejectedValue(new Error('Update failed'));

      try {
        await taskService.toggleTaskStatus(4);
      } catch (e) {
        // Expected to throw
      }

      // Should update twice: once optimistically, once to rollback
      expect(mockStateManager.updateTask).toHaveBeenCalledTimes(2);
      expect(mockStateManager.updateTask).toHaveBeenNthCalledWith(1, 4, { completed: true });
      expect(mockStateManager.updateTask).toHaveBeenNthCalledWith(2, 4, { completed: false });
    });

    test('toggleTaskStatus should rollback to original state on failure', async () => {
      const mockTask = createMockTask({ id: 5, completed: true });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockRejectedValue(new Error('Network error'));

      try {
        await taskService.toggleTaskStatus(5);
      } catch (e) {
        // Expected to throw
      }

      // Should rollback to original completed: true
      expect(mockStateManager.updateTask).toHaveBeenNthCalledWith(2, 5, { completed: true });
    });

    test('toggleTaskStatus should set error state on failure', async () => {
      const mockTask = createMockTask({ id: 6, completed: false });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockRejectedValue(new Error('Server error'));

      try {
        await taskService.toggleTaskStatus(6);
      } catch (e) {
        // Expected to throw
      }

      expect(mockStateManager.setError).toHaveBeenCalledWith('Server error');
    });

    test('toggleTaskStatus should propagate API errors', async () => {
      const mockTask = createMockTask({ id: 7, completed: false });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      mockApiClient.updateTaskStatus.mockRejectedValue(new Error('API error'));

      await expect(taskService.toggleTaskStatus(7)).rejects.toThrow('API error');
    });

    test('toggleTaskStatus should throw error if task not found', async () => {
      mockStateManager.getTasks.mockReturnValue([]);

      await expect(taskService.toggleTaskStatus(999)).rejects.toThrow('Task not found');

      expect(mockApiClient.updateTaskStatus).not.toHaveBeenCalled();
    });

    test('toggleTaskStatus should handle multiple tasks correctly', async () => {
      const tasks = createMockTasks(3);
      mockStateManager.getTasks.mockReturnValue(tasks);
      mockApiClient.updateTaskStatus.mockResolvedValue({ ...tasks[1], completed: !tasks[1].completed });

      await taskService.toggleTaskStatus(2);

      expect(mockStateManager.updateTask).toHaveBeenCalledWith(2, { completed: !tasks[1].completed });
    });
  });

  describe('Error Propagation', () => {
    test('should propagate network errors from loadTasks', async () => {
      const networkError = new Error('Network connection failed');
      mockApiClient.getTasks.mockRejectedValue(networkError);

      await expect(taskService.loadTasks()).rejects.toThrow('Network connection failed');
    });

    test('should propagate validation errors from createTask', async () => {
      await expect(taskService.createTask('')).rejects.toThrow('任务标题不能为空');
    });

    test('should propagate server errors from createTask', async () => {
      const serverError = new Error('Internal server error');
      mockApiClient.createTask.mockRejectedValue(serverError);

      await expect(taskService.createTask('Task', 'Desc')).rejects.toThrow('Internal server error');
    });

    test('should propagate errors from deleteTask', async () => {
      const mockTask = createMockTask({ id: 1 });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      const deleteError = new Error('Delete operation failed');
      mockApiClient.deleteTask.mockRejectedValue(deleteError);

      await expect(taskService.deleteTask(1)).rejects.toThrow('Delete operation failed');
    });

    test('should propagate errors from toggleTaskStatus', async () => {
      const mockTask = createMockTask({ id: 1, completed: false });
      mockStateManager.getTasks.mockReturnValue([mockTask]);
      const updateError = new Error('Update operation failed');
      mockApiClient.updateTaskStatus.mockRejectedValue(updateError);

      await expect(taskService.toggleTaskStatus(1)).rejects.toThrow('Update operation failed');
    });

    test('errors should include original error message', async () => {
      const customError = new Error('Custom error message');
      mockApiClient.getTasks.mockRejectedValue(customError);

      try {
        await taskService.loadTasks();
      } catch (error) {
        expect(error.message).toBe('Custom error message');
      }
    });
  });

  describe('Input Validation', () => {
    test('validateTaskInput should return valid for correct input', () => {
      const result = taskService.validateTaskInput('Valid Title', 'Valid Description');

      expect(result.valid).toBe(true);
    });

    test('validateTaskInput should return invalid for empty title', () => {
      const result = taskService.validateTaskInput('', 'Description');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('标题');
    });

    test('validateTaskInput should return invalid for whitespace title', () => {
      const result = taskService.validateTaskInput('   ', 'Description');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('标题');
    });

    test('validateTaskInput should accept empty description', () => {
      const result = taskService.validateTaskInput('Valid Title', '');

      expect(result.valid).toBe(true);
    });

    test('validateTaskInput should use empty string as default description', () => {
      const result = taskService.validateTaskInput('Valid Title');

      expect(result.valid).toBe(true);
    });
  });
});
