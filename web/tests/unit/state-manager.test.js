/**
 * StateManager Unit Tests
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { StateManager } from '../../js/state-manager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('Task CRUD Operations', () => {
    test('getTasks returns empty array initially', () => {
      expect(stateManager.getTasks()).toEqual([]);
    });

    test('getTasks returns a copy of tasks (immutability)', () => {
      const tasks = [{ id: 1, title: 'Test', completed: false }];
      stateManager.setTasks(tasks);
      
      const retrieved = stateManager.getTasks();
      retrieved.push({ id: 2, title: 'Modified', completed: false });
      
      // Original state should not be modified
      expect(stateManager.getTasks()).toHaveLength(1);
    });

    test('setTasks updates the task list', () => {
      const tasks = [
        { id: 1, title: 'Task 1', completed: false },
        { id: 2, title: 'Task 2', completed: true },
      ];
      
      stateManager.setTasks(tasks);
      expect(stateManager.getTasks()).toEqual(tasks);
    });

    test('setTasks creates a copy (immutability)', () => {
      const tasks = [{ id: 1, title: 'Test', completed: false }];
      stateManager.setTasks(tasks);
      
      tasks.push({ id: 2, title: 'Modified', completed: false });
      
      // State should not be affected by external modifications
      expect(stateManager.getTasks()).toHaveLength(1);
    });

    test('addTask adds a new task', () => {
      const task1 = { id: 1, title: 'Task 1', completed: false };
      const task2 = { id: 2, title: 'Task 2', completed: false };
      
      stateManager.addTask(task1);
      expect(stateManager.getTasks()).toEqual([task1]);
      
      stateManager.addTask(task2);
      expect(stateManager.getTasks()).toEqual([task1, task2]);
    });

    test('updateTask updates an existing task', () => {
      const tasks = [
        { id: 1, title: 'Task 1', completed: false },
        { id: 2, title: 'Task 2', completed: false },
      ];
      stateManager.setTasks(tasks);
      
      stateManager.updateTask(1, { completed: true });
      
      const updated = stateManager.getTasks();
      expect(updated[0].completed).toBe(true);
      expect(updated[1].completed).toBe(false);
    });

    test('updateTask preserves other task properties', () => {
      const task = { 
        id: 1, 
        title: 'Task 1', 
        description: 'Description',
        completed: false,
        created_at: '2024-01-15T10:00:00Z',
      };
      stateManager.setTasks([task]);
      
      stateManager.updateTask(1, { completed: true });
      
      const updated = stateManager.getTasks()[0];
      expect(updated.title).toBe('Task 1');
      expect(updated.description).toBe('Description');
      expect(updated.created_at).toBe('2024-01-15T10:00:00Z');
      expect(updated.completed).toBe(true);
    });

    test('updateTask does nothing if task not found', () => {
      const tasks = [{ id: 1, title: 'Task 1', completed: false }];
      stateManager.setTasks(tasks);
      
      stateManager.updateTask(999, { completed: true });
      
      expect(stateManager.getTasks()).toEqual(tasks);
    });

    test('removeTask removes a task by id', () => {
      const tasks = [
        { id: 1, title: 'Task 1', completed: false },
        { id: 2, title: 'Task 2', completed: false },
        { id: 3, title: 'Task 3', completed: false },
      ];
      stateManager.setTasks(tasks);
      
      stateManager.removeTask(2);
      
      const remaining = stateManager.getTasks();
      expect(remaining).toHaveLength(2);
      expect(remaining.find(t => t.id === 2)).toBeUndefined();
    });

    test('removeTask does nothing if task not found', () => {
      const tasks = [{ id: 1, title: 'Task 1', completed: false }];
      stateManager.setTasks(tasks);
      
      stateManager.removeTask(999);
      
      expect(stateManager.getTasks()).toEqual(tasks);
    });
  });

  describe('State Subscription and Notification', () => {
    test('subscribe adds a listener', () => {
      const listener = jest.fn();
      stateManager.subscribe(listener);
      
      stateManager.setTasks([{ id: 1, title: 'Test', completed: false }]);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('subscribe returns unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe(listener);
      
      expect(typeof unsubscribe).toBe('function');
    });

    test('unsubscribe removes listener', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe(listener);
      
      stateManager.setTasks([{ id: 1, title: 'Test', completed: false }]);
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      stateManager.setTasks([{ id: 2, title: 'Test 2', completed: false }]);
      
      // Should still be 1, not 2
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('setTasks notifies all listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);
      
      const tasks = [{ id: 1, title: 'Test', completed: false }];
      stateManager.setTasks(tasks);
      
      expect(listener1).toHaveBeenCalledWith(tasks);
      expect(listener2).toHaveBeenCalledWith(tasks);
    });

    test('addTask notifies listeners', () => {
      const listener = jest.fn();
      stateManager.subscribe(listener);
      
      const task = { id: 1, title: 'Test', completed: false };
      stateManager.addTask(task);
      
      expect(listener).toHaveBeenCalledWith([task]);
    });

    test('updateTask notifies listeners', () => {
      const listener = jest.fn();
      stateManager.setTasks([{ id: 1, title: 'Test', completed: false }]);
      
      stateManager.subscribe(listener);
      stateManager.updateTask(1, { completed: true });
      
      expect(listener).toHaveBeenCalled();
      const calledWith = listener.mock.calls[0][0];
      expect(calledWith[0].completed).toBe(true);
    });

    test('removeTask notifies listeners', () => {
      const listener = jest.fn();
      stateManager.setTasks([
        { id: 1, title: 'Test 1', completed: false },
        { id: 2, title: 'Test 2', completed: false },
      ]);
      
      stateManager.subscribe(listener);
      stateManager.removeTask(1);
      
      expect(listener).toHaveBeenCalled();
      const calledWith = listener.mock.calls[0][0];
      expect(calledWith).toHaveLength(1);
      expect(calledWith[0].id).toBe(2);
    });

    test('multiple listeners receive independent copies', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);
      
      stateManager.setTasks([{ id: 1, title: 'Test', completed: false }]);
      
      const tasks1 = listener1.mock.calls[0][0];
      const tasks2 = listener2.mock.calls[0][0];
      
      // Modify one copy
      tasks1.push({ id: 2, title: 'Modified', completed: false });
      
      // Other copy should not be affected
      expect(tasks2).toHaveLength(1);
    });
  });

  describe('Loading State Management', () => {
    test('isLoading returns false initially', () => {
      expect(stateManager.isLoading()).toBe(false);
    });

    test('setLoading updates loading state', () => {
      stateManager.setLoading(true);
      expect(stateManager.isLoading()).toBe(true);
      
      stateManager.setLoading(false);
      expect(stateManager.isLoading()).toBe(false);
    });
  });

  describe('Error State Management', () => {
    test('getError returns null initially', () => {
      expect(stateManager.getError()).toBeNull();
    });

    test('setError updates error state', () => {
      const errorMessage = 'Network error';
      stateManager.setError(errorMessage);
      
      expect(stateManager.getError()).toBe(errorMessage);
    });

    test('setError can clear error with null', () => {
      stateManager.setError('Error message');
      expect(stateManager.getError()).toBe('Error message');
      
      stateManager.setError(null);
      expect(stateManager.getError()).toBeNull();
    });
  });

  describe('State Immutability', () => {
    test('modifying returned tasks does not affect internal state', () => {
      const original = [{ id: 1, title: 'Test', completed: false }];
      stateManager.setTasks(original);
      
      const retrieved = stateManager.getTasks();
      retrieved[0].title = 'Modified';
      retrieved[0].completed = true;
      
      const current = stateManager.getTasks();
      expect(current[0].title).toBe('Test');
      expect(current[0].completed).toBe(false);
    });

    test('task operations create new arrays', () => {
      stateManager.setTasks([{ id: 1, title: 'Test', completed: false }]);
      const before = stateManager.getTasks();
      
      stateManager.addTask({ id: 2, title: 'Test 2', completed: false });
      const after = stateManager.getTasks();
      
      // Should be different array instances
      expect(before).not.toBe(after);
      expect(before).toHaveLength(1);
      expect(after).toHaveLength(2);
    });
  });
});
