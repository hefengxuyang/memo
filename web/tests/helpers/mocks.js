/**
 * Mock Objects
 * 
 * Reusable mock implementations for testing
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock APIClient
 */
export function createMockAPIClient() {
  return {
    getTasks: jest.fn(),
    getTask: jest.fn(),
    createTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    deleteTask: jest.fn(),
  };
}

/**
 * Creates a mock StateManager
 */
export function createMockStateManager() {
  const listeners = [];
  return {
    tasks: [],
    loading: false,
    error: null,
    listeners,
    getTasks: jest.fn(function() { return this.tasks; }),
    setTasks: jest.fn(function(tasks) { 
      this.tasks = tasks;
      this.listeners.forEach(l => l(tasks));
    }),
    addTask: jest.fn(function(task) { 
      this.tasks.push(task);
      this.listeners.forEach(l => l(this.tasks));
    }),
    updateTask: jest.fn(function(id, updates) {
      const index = this.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updates };
        this.listeners.forEach(l => l(this.tasks));
      }
    }),
    removeTask: jest.fn(function(id) {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.listeners.forEach(l => l(this.tasks));
    }),
    subscribe: jest.fn(function(listener) {
      this.listeners.push(listener);
      return () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) this.listeners.splice(index, 1);
      };
    }),
    isLoading: jest.fn(function() { return this.loading; }),
    setLoading: jest.fn(function(loading) { this.loading = loading; }),
    getError: jest.fn(function() { return this.error; }),
    setError: jest.fn(function(error) { this.error = error; }),
  };
}

/**
 * Creates a mock TaskService
 */
export function createMockTaskService() {
  return {
    loadTasks: jest.fn(),
    createTask: jest.fn(),
    toggleTaskStatus: jest.fn(),
    deleteTask: jest.fn(),
    validateTaskInput: jest.fn(),
  };
}

/**
 * Creates a mock NotificationComponent
 */
export function createMockNotificationComponent() {
  return {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    close: jest.fn(),
  };
}
