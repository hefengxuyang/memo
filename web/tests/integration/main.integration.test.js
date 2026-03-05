/**
 * Main Entry Point Integration Tests
 * 
 * Tests that the application initializes correctly with all components
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('Main Entry Point Integration', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Create a new JSDOM instance with the HTML structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Memo</title>
        </head>
        <body>
          <div id="task-form"></div>
          <div id="task-list"></div>
          <div id="notification-container"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable',
    });

    window = dom.window;
    document = window.document;
    
    // Set up global objects
    global.window = window;
    global.document = document;
    global.CustomEvent = window.CustomEvent;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.document;
    delete global.CustomEvent;
    delete global.fetch;
    dom.window.close();
  });

  test('should have all required DOM containers', () => {
    expect(document.getElementById('task-form')).toBeTruthy();
    expect(document.getElementById('task-list')).toBeTruthy();
    expect(document.getElementById('notification-container')).toBeTruthy();
  });

  test('should initialize all modules when imported', async () => {
    // Import modules
    const { APIClient } = await import('../../js/api-client.js');
    const { StateManager } = await import('../../js/state-manager.js');
    const { TaskService } = await import('../../js/task-service.js');
    const { UIController } = await import('../../js/ui-controller.js');
    const { TaskListComponent } = await import('../../js/components/task-list.js');
    const { TaskFormComponent } = await import('../../js/components/task-form.js');
    const { NotificationComponent } = await import('../../js/components/notification.js');
    const { config } = await import('../../js/config.js');

    // Verify all modules are defined
    expect(APIClient).toBeDefined();
    expect(StateManager).toBeDefined();
    expect(TaskService).toBeDefined();
    expect(UIController).toBeDefined();
    expect(TaskListComponent).toBeDefined();
    expect(TaskFormComponent).toBeDefined();
    expect(NotificationComponent).toBeDefined();
    expect(config).toBeDefined();
  });

  test('should create instances of all components', async () => {
    const { APIClient } = await import('../../js/api-client.js');
    const { StateManager } = await import('../../js/state-manager.js');
    const { TaskService } = await import('../../js/task-service.js');
    const { TaskListComponent } = await import('../../js/components/task-list.js');
    const { TaskFormComponent } = await import('../../js/components/task-form.js');
    const { NotificationComponent } = await import('../../js/components/notification.js');
    const { config } = await import('../../js/config.js');

    // Create instances as main.js does
    const apiClient = new APIClient(config.apiBaseURL);
    const stateManager = new StateManager();
    const taskService = new TaskService(apiClient, stateManager);
    
    const taskList = new TaskListComponent(
      document.getElementById('task-list'),
      taskService,
    );
    const taskForm = new TaskFormComponent(
      document.getElementById('task-form'),
      taskService,
    );
    const notification = new NotificationComponent(
      document.getElementById('notification-container'),
    );

    // Verify instances are created
    expect(apiClient).toBeInstanceOf(APIClient);
    expect(stateManager).toBeInstanceOf(StateManager);
    expect(taskService).toBeInstanceOf(TaskService);
    expect(taskList).toBeInstanceOf(TaskListComponent);
    expect(taskForm).toBeInstanceOf(TaskFormComponent);
    expect(notification).toBeInstanceOf(NotificationComponent);
  });

  test('should render task form after initialization', async () => {
    const { TaskFormComponent } = await import('../../js/components/task-form.js');
    const { TaskService } = await import('../../js/task-service.js');
    const { APIClient } = await import('../../js/api-client.js');
    const { StateManager } = await import('../../js/state-manager.js');

    const apiClient = new APIClient();
    const stateManager = new StateManager();
    const taskService = new TaskService(apiClient, stateManager);
    
    const taskForm = new TaskFormComponent(
      document.getElementById('task-form'),
      taskService,
    );

    // Render the form
    taskForm.render();

    // Verify form is rendered
    const form = document.querySelector('.task-form');
    expect(form).toBeTruthy();
    expect(document.getElementById('task-title')).toBeTruthy();
    expect(document.getElementById('task-description')).toBeTruthy();
  });

  test('should initialize UIController and call init', async () => {
    const { UIController } = await import('../../js/ui-controller.js');
    const { TaskService } = await import('../../js/task-service.js');
    const { APIClient } = await import('../../js/api-client.js');
    const { StateManager } = await import('../../js/state-manager.js');
    const { TaskListComponent } = await import('../../js/components/task-list.js');
    const { TaskFormComponent } = await import('../../js/components/task-form.js');
    const { NotificationComponent } = await import('../../js/components/notification.js');

    // Mock fetch to return empty tasks
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const apiClient = new APIClient();
    const stateManager = new StateManager();
    const taskService = new TaskService(apiClient, stateManager);
    
    const components = {
      taskList: new TaskListComponent(document.getElementById('task-list'), taskService),
      taskForm: new TaskFormComponent(document.getElementById('task-form'), taskService),
      notification: new NotificationComponent(document.getElementById('notification-container')),
    };

    components.taskForm.render();

    const controller = new UIController(taskService, stateManager, components);

    // Initialize
    await controller.init();

    // Verify init was called (should have fetched tasks)
    expect(global.fetch).toHaveBeenCalled();
    
    // Verify task list container has content (either empty state or tasks)
    const taskListContainer = document.getElementById('task-list');
    expect(taskListContainer.innerHTML).not.toBe('');
  });
});
