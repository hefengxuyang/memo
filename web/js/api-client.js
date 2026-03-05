/**
 * API Client
 * 
 * Handles all HTTP communication with the backend API
 */

import { config } from './config.js';
import { AppError, NetworkError, TimeoutError, ClientError, ServerError } from './utils/errors.js';
import { RequestDeduplicator } from './utils/performance.js';

export class APIClient {
  /**
   * Creates an APIClient instance
   * @param {string} baseURL - Base URL for the API (default from config)
   * @param {number} timeout - Request timeout in milliseconds (default 5000ms)
   */
  constructor(baseURL = config.apiBaseURL, timeout = config.apiTimeout) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.deduplicator = new RequestDeduplicator();
  }

  /**
   * Get all tasks
   * @returns {Promise<Array>} Array of task objects
   */
  async getTasks() {
    // Deduplicate concurrent getTasks requests
    return this.deduplicator.dedupe('getTasks', async () => {
      const response = await this.request('/api/tasks', {
        method: 'GET',
      });
      return response.data;
    });
  }

  /**
   * Get a single task by ID
   * @param {number} id - Task ID
   * @returns {Promise<Object>} Task object
   */
  async getTask(id) {
    // Deduplicate concurrent getTask requests for the same ID
    return this.deduplicator.dedupe(`getTask:${id}`, async () => {
      const response = await this.request(`/api/tasks/${id}`, {
        method: 'GET',
      });
      return response.data;
    });
  }

  /**
   * Create a new task
   * @param {Object} data - Task data with title and description
   * @param {string} data.title - Task title
   * @param {string} data.description - Task description
   * @returns {Promise<Object>} Created task object
   */
  async createTask(data) {
    const response = await this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Update task completion status
   * @param {number} id - Task ID
   * @param {boolean} completed - New completion status
   * @returns {Promise<Object>} Updated task object
   */
  async updateTaskStatus(id, completed) {
    const response = await this.request(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
    return response.data;
  }

  /**
   * Update task
   * @param {number} id - Task ID
   * @param {Object} data - Update data { title, description }
   * @returns {Promise<Object>} Updated task object
   */
  async updateTask(id, data) {
    const response = await this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Delete a task
   * @param {number} id - Task ID
   * @returns {Promise<void>}
   */
  async deleteTask(id) {
    await this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Private method to handle HTTP requests
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Parsed JSON response
   * @throws {NetworkError} When network connection fails
   * @throws {TimeoutError} When request exceeds timeout
   * @throws {ClientError} When server returns 4xx status
   * @throws {ServerError} When server returns 5xx status
   */
  async request(endpoint, options = {}) {
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Build full URL
      const url = `${this.baseURL}${endpoint}`;

      // Set default headers with JSON Content-Type
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Make the fetch request
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      // Clear timeout after response received
      clearTimeout(timeoutId);

      // Handle HTTP status codes
      if (!response.ok) {
        // Parse error response body
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If error response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Throw appropriate error based on status code
        if (response.status >= 400 && response.status < 500) {
          throw new ClientError(errorMessage, response.status);
        } else if (response.status >= 500) {
          throw new ServerError(errorMessage);
        }
      }

      // Parse and return JSON response
      // Handle empty responses (e.g., 204 No Content for DELETE)
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        return null;
      }
      
      const data = await response.json();
      return data;

    } catch (error) {
      // Clear timeout in case of error
      clearTimeout(timeoutId);

      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new TimeoutError();
      }

      // Handle network errors (TypeError from fetch)
      if (error instanceof TypeError && !error.message.includes('JSON')) {
        throw new NetworkError();
      }

      // Re-throw our custom errors
      if (error instanceof AppError) {
        throw error;
      }

      // Re-throw unexpected errors
      throw error;
    }
  }
}
