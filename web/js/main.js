/**
 * Application Entry Point
 * 
 * Initializes and bootstraps the application
 */

import { APIClient } from './api-client.js';
import { StateManager } from './state-manager.js';
import { TaskService } from './task-service.js';
import { UIController } from './ui-controller.js';
import { TaskListComponent } from './components/task-list.js';
import { TaskFormComponent } from './components/task-form.js';
import { TaskEditComponent } from './components/task-edit.js';
import { NotificationComponent } from './components/notification.js';
import { config } from './config.js';
import { PerformanceMonitor } from './utils/performance.js';

// Create performance monitor
const perfMonitor = new PerformanceMonitor();

// Mark start of application initialization
perfMonitor.mark('app-start');

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  perfMonitor.mark('dom-ready');
  
  // Create instances
  const apiClient = new APIClient(config.apiBaseURL);
  const stateManager = new StateManager();
  const taskService = new TaskService(apiClient, stateManager);
  
  const components = {
    taskList: new TaskListComponent(
      document.getElementById('task-list'),
      taskService
    ),
    taskForm: new TaskFormComponent(
      document.getElementById('task-form'),
      taskService
    ),
    taskEdit: new TaskEditComponent(
      document.getElementById('task-edit-container'),
      taskService
    ),
    notification: new NotificationComponent(
      document.getElementById('notification-container')
    ),
  };
  
  perfMonitor.mark('components-created');
  
  // Render the task form
  components.taskForm.render();
  
  const controller = new UIController(taskService, stateManager, components);
  
  perfMonitor.mark('controller-created');
  
  // Initialize the application
  controller.init()
    .then(() => {
      perfMonitor.mark('app-ready');
      
      // Measure performance metrics
      const domReadyTime = perfMonitor.measure('DOM Ready', 'app-start', 'dom-ready');
      const initTime = perfMonitor.measure('Initialization', 'dom-ready', 'app-ready');
      const totalTime = perfMonitor.measure('Total Load Time', 'app-start', 'app-ready');
      
      // Log performance metrics in development
      if (config.environment !== 'production') {
        console.group('⚡ Performance Metrics');
        console.log(`DOM Ready: ${domReadyTime.toFixed(2)}ms`);
        console.log(`Initialization: ${initTime.toFixed(2)}ms`);
        console.log(`Total Load Time: ${totalTime.toFixed(2)}ms`);
        
        // Check if we meet the 2-second requirement
        if (totalTime < 2000) {
          console.log('✅ Load time requirement met (<2s)');
        } else {
          console.warn('⚠️ Load time exceeds 2-second requirement');
        }
        console.groupEnd();
      }
    })
    .catch(error => {
      console.error('Failed to initialize application:', error);
    });
});
