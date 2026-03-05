/**
 * Application configuration
 * 
 * This file contains all configuration settings for the frontend application.
 * Environment-specific values can be overridden via window.ENV object.
 */

export const config = {
  // Environment
  environment: (typeof window !== 'undefined' && window.ENV?.ENVIRONMENT) || 'development',
  
  // API Configuration
  apiBaseURL: (typeof window !== 'undefined' && window.ENV?.API_BASE_URL) || 'http://localhost:8080',
  apiTimeout: 5000, // milliseconds

  // Notification durations (milliseconds)
  notificationDuration: {
    success: 3000,
    error: 5000,
    info: 3000,
  },

  // Validation limits
  maxTitleLength: 200,
  maxDescriptionLength: 1000,

  // API endpoints
  endpoints: {
    tasks: '/api/tasks',
    taskById: (id) => `/api/tasks/${id}`,
    taskStatus: (id) => `/api/tasks/${id}/status`,
  },
};
