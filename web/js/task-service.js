/**
 * Task Service
 * 
 * Business logic layer that coordinates API calls and state updates
 */

import { validateTaskTitle, validateTaskDescription } from './utils/validators.js';

export class TaskService {
  constructor(apiClient, stateManager) {
    this.apiClient = apiClient;
    this.stateManager = stateManager;
  }

  /**
   * Load all tasks from the API and update state
   * @throws {AppError} When API request fails
   */
  async loadTasks() {
    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);
      
      const tasks = await this.apiClient.getTasks();
      this.stateManager.setTasks(tasks);
    } catch (error) {
      this.stateManager.setError(error.message);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Create a new task with validation
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @returns {Promise<Object>} Created task object
   * @throws {ValidationError} When input validation fails
   * @throws {AppError} When API request fails
   */
  async createTask(title, description = '') {
    // Validate input
    const validation = this.validateTaskInput(title, description);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);
      
      // Wait for server response to get server-generated ID
      const createdTask = await this.apiClient.createTask({ title, description });
      
      // Add to state after successful creation
      this.stateManager.addTask(createdTask);
      
      return createdTask;
    } catch (error) {
      this.stateManager.setError(error.message);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Toggle task completion status with optimistic update
   * @param {number} id - Task ID
   * @throws {AppError} When API request fails (will rollback)
   */
  async toggleTaskStatus(id) {
    // Get current task state for rollback
    const tasks = this.stateManager.getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    const originalCompleted = task.completed;
    const newCompleted = !originalCompleted;
    
    try {
      // Optimistic update: Update UI immediately
      this.stateManager.updateTask(id, { completed: newCompleted });
      
      // Send API request
      await this.apiClient.updateTaskStatus(id, newCompleted);
    } catch (error) {
      // Rollback on failure
      this.stateManager.updateTask(id, { completed: originalCompleted });
      this.stateManager.setError(error.message);
      throw error;
    }
  }

  /**
   * Delete a task with optimistic update
   * @param {number} id - Task ID
   * @throws {AppError} When API request fails (will rollback)
   */
  async deleteTask(id) {
    // Get current task for rollback
    const tasks = this.stateManager.getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    try {
      // Optimistic update: Remove from UI immediately
      this.stateManager.removeTask(id);
      
      // Send API request
      await this.apiClient.deleteTask(id);
    } catch (error) {
      // Rollback on failure: Re-add the task
      this.stateManager.addTask(task);
      this.stateManager.setError(error.message);
      throw error;
    }
  }

  /**
   * Update a task with validation
   * @param {number} id - Task ID
   * @param {Object} updates - Update data { title, description }
   * @returns {Promise<Object>} Updated task object
   * @throws {ValidationError} When input validation fails
   * @throws {AppError} When API request fails
   */
  async updateTask(id, updates) {
    // Validate input
    const validation = this.validateTaskInput(updates.title, updates.description);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);

      // Call API to update task
      const updatedTask = await this.apiClient.updateTask(id, updates);

      // Update state with the response from server
      this.stateManager.updateTask(id, updatedTask);

      return updatedTask;
    } catch (error) {
      this.stateManager.setError(error.message);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }


  validateTaskInput(title, description = '') {
    const titleValidation = validateTaskTitle(title);
    if (!titleValidation.valid) {
      return titleValidation;
    }

    const descValidation = validateTaskDescription(description);
    if (!descValidation.valid) {
      return descValidation;
    }

    return { valid: true };
  }
}
