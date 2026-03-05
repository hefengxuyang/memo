/**
 * APIClient Integration Tests
 * 
 * Tests the APIClient against the actual backend server
 * Run these tests with the backend server running on localhost:8080
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { APIClient } from '../../js/api-client.js';

describe('APIClient Integration Tests', () => {
  let apiClient;
  let createdTaskId;

  beforeAll(() => {
    apiClient = new APIClient('http://localhost:8080', 5000);
  });

  afterAll(async () => {
    // Clean up: delete any tasks created during tests
    if (createdTaskId) {
      try {
        await apiClient.deleteTask(createdTaskId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('getTasks should return array of tasks', async () => {
    const tasks = await apiClient.getTasks();
    expect(Array.isArray(tasks)).toBe(true);
  });

  test('createTask should create a new task and return it', async () => {
    const taskData = {
      title: 'Integration Test Task',
      description: 'This is a test task created by integration tests',
    };

    const createdTask = await apiClient.createTask(taskData);
    
    expect(createdTask).toBeDefined();
    expect(createdTask.id).toBeDefined();
    expect(createdTask.title).toBe(taskData.title);
    expect(createdTask.description).toBe(taskData.description);
    expect(createdTask.completed).toBe(false);
    expect(createdTask.created_at).toBeDefined();

    // Save the ID for cleanup
    createdTaskId = createdTask.id;
  });

  test('getTask should return a specific task', async () => {
    // First create a task
    const taskData = {
      title: 'Get Task Test',
      description: 'Test getting a specific task',
    };
    const createdTask = await apiClient.createTask(taskData);
    createdTaskId = createdTask.id;

    // Then get it
    const fetchedTask = await apiClient.getTask(createdTaskId);
    
    expect(fetchedTask).toBeDefined();
    expect(fetchedTask.id).toBe(createdTaskId);
    expect(fetchedTask.title).toBe(taskData.title);
    expect(fetchedTask.description).toBe(taskData.description);
  });

  test('updateTaskStatus should update task completion status', async () => {
    // First create a task
    const taskData = {
      title: 'Update Status Test',
      description: 'Test updating task status',
    };
    const createdTask = await apiClient.createTask(taskData);
    createdTaskId = createdTask.id;

    // Update its status to completed
    const updatedTask = await apiClient.updateTaskStatus(createdTaskId, true);
    
    expect(updatedTask).toBeDefined();
    expect(updatedTask.id).toBe(createdTaskId);
    expect(updatedTask.completed).toBe(true);

    // Update back to not completed
    const updatedTask2 = await apiClient.updateTaskStatus(createdTaskId, false);
    expect(updatedTask2.completed).toBe(false);
  });

  test('deleteTask should delete a task', async () => {
    // First create a task
    const taskData = {
      title: 'Delete Test',
      description: 'Test deleting a task',
    };
    const createdTask = await apiClient.createTask(taskData);
    const taskId = createdTask.id;

    // Delete it
    await apiClient.deleteTask(taskId);

    // Verify it's deleted by trying to get all tasks
    const tasks = await apiClient.getTasks();
    const deletedTask = tasks.find(t => t.id === taskId);
    expect(deletedTask).toBeUndefined();

    // Clear the cleanup ID since we already deleted it
    createdTaskId = null;
  });

  test('should handle API errors correctly', async () => {
    // Try to get a non-existent task
    await expect(apiClient.getTask(999999)).rejects.toThrow();
  });
});
