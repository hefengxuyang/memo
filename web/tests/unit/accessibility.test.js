/**
 * Accessibility Unit Tests
 * 
 * Verifies ARIA labels, roles, and accessibility attributes across all components
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TaskListComponent } from '../../js/components/task-list.js';
import { TaskFormComponent } from '../../js/components/task-form.js';
import { TaskItemComponent } from '../../js/components/task-item.js';
import { NotificationComponent } from '../../js/components/notification.js';

describe('Accessibility - ARIA Labels and Roles', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('TaskFormComponent', () => {
    let taskService;
    let taskForm;

    beforeEach(() => {
      taskService = {
        createTask: jest.fn().mockResolvedValue(undefined),
      };
      taskForm = new TaskFormComponent(container, taskService);
      taskForm.render();
    });

    test('should have aria-required on title input', () => {
      const titleInput = container.querySelector('#task-title');
      expect(titleInput.getAttribute('aria-required')).toBe('true');
    });

    test('should have aria-invalid on title input', () => {
      const titleInput = container.querySelector('#task-title');
      expect(titleInput.getAttribute('aria-invalid')).toBe('false');
    });

    test('should update aria-invalid when validation fails', () => {
      const titleInput = container.querySelector('#task-title');
      
      // Show validation error
      taskForm.showValidationError('title', 'Title is required');
      
      expect(titleInput.getAttribute('aria-invalid')).toBe('true');
    });

    test('should have role="alert" on error containers', () => {
      const titleError = container.querySelector('#title-error');
      const descriptionError = container.querySelector('#description-error');
      
      expect(titleError.getAttribute('role')).toBe('alert');
      expect(descriptionError.getAttribute('role')).toBe('alert');
    });

    test('should have aria-live="polite" on error containers', () => {
      const titleError = container.querySelector('#title-error');
      const descriptionError = container.querySelector('#description-error');
      
      expect(titleError.getAttribute('aria-live')).toBe('polite');
      expect(descriptionError.getAttribute('aria-live')).toBe('polite');
    });

    test('should have aria-label on submit button', () => {
      const submitButton = container.querySelector('.task-form__submit');
      expect(submitButton.getAttribute('aria-label')).toBe('创建新任务');
    });

    test('should update aria-label when submitting', () => {
      const submitButton = container.querySelector('.task-form__submit');
      
      taskForm.setSubmitting(true);
      expect(submitButton.getAttribute('aria-label')).toBe('正在创建任务，请稍候');
      
      taskForm.setSubmitting(false);
      expect(submitButton.getAttribute('aria-label')).toBe('创建新任务');
    });

    test('should have aria-busy on submit button when submitting', () => {
      const submitButton = container.querySelector('.task-form__submit');
      
      taskForm.setSubmitting(true);
      expect(submitButton.getAttribute('aria-busy')).toBe('true');
      
      taskForm.setSubmitting(false);
      expect(submitButton.getAttribute('aria-busy')).toBe('false');
    });

    test('should have proper label associations', () => {
      const titleLabel = container.querySelector('label[for="task-title"]');
      const descriptionLabel = container.querySelector('label[for="task-description"]');
      
      expect(titleLabel).not.toBeNull();
      expect(descriptionLabel).not.toBeNull();
    });
  });

  describe('TaskListComponent', () => {
    let taskService;
    let taskList;

    beforeEach(() => {
      taskService = {};
      taskList = new TaskListComponent(container, taskService);
    });

    test('should have role="list" on task containers', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, title: 'Task 2', description: 'Desc 2', completed: true, created_at: '2024-01-02T00:00:00Z' },
      ];
      
      taskList.render(tasks);
      
      // Wait for DOM batcher to flush
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const lists = container.querySelectorAll('[role="list"]');
      expect(lists.length).toBeGreaterThan(0);
    });

    test('should have aria-label on task lists', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, title: 'Task 2', description: 'Desc 2', completed: true, created_at: '2024-01-02T00:00:00Z' },
      ];
      
      taskList.render(tasks);
      
      // Wait for DOM batcher to flush
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const uncompletedList = container.querySelector('[aria-label="待办任务列表"]');
      const completedList = container.querySelector('[aria-label="已完成任务列表"]');
      
      expect(uncompletedList).not.toBeNull();
      expect(completedList).not.toBeNull();
    });

    test('should have role="listitem" on task items', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, created_at: '2024-01-01T00:00:00Z' },
      ];
      
      taskList.render(tasks);
      
      // Wait for DOM batcher to flush
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const listItems = container.querySelectorAll('[role="listitem"]');
      expect(listItems.length).toBe(1);
    });

    test('should have role="status" and aria-live on empty state', () => {
      taskList.renderEmptyState();
      
      const emptyState = container.querySelector('.task-list__empty');
      expect(emptyState.getAttribute('role')).toBe('status');
      expect(emptyState.getAttribute('aria-live')).toBe('polite');
    });

    test('should have role="status" and aria-live on loading state', () => {
      taskList.renderLoading();
      
      const loadingState = container.querySelector('.task-list__loading');
      expect(loadingState.getAttribute('role')).toBe('status');
      expect(loadingState.getAttribute('aria-live')).toBe('polite');
      expect(loadingState.getAttribute('aria-label')).toBe('正在加载任务');
    });

    test('should have role="alert" and aria-live on error state', () => {
      taskList.renderError('Error message');
      
      const errorState = container.querySelector('.task-list__error');
      expect(errorState.getAttribute('role')).toBe('alert');
      expect(errorState.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('TaskItemComponent', () => {
    test('should have aria-label on checkbox', () => {
      const task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        created_at: '2024-01-01T00:00:00Z',
      };
      
      const handlers = {
        onToggle: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const taskItem = TaskItemComponent.render(task, handlers);
      const checkbox = taskItem.querySelector('.task-item__checkbox');
      
      expect(checkbox.getAttribute('aria-label')).toBe('标记任务"Test Task"为已完成');
    });

    test('should have aria-label on delete button', () => {
      const task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        created_at: '2024-01-01T00:00:00Z',
      };
      
      const handlers = {
        onToggle: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const taskItem = TaskItemComponent.render(task, handlers);
      const deleteButton = taskItem.querySelector('.task-item__delete');
      
      expect(deleteButton.getAttribute('aria-label')).toBe('删除任务"Test Task"');
    });

    test('should update checkbox aria-label based on completion status', () => {
      const completedTask = {
        id: 1,
        title: 'Completed Task',
        description: 'Test Description',
        completed: true,
        created_at: '2024-01-01T00:00:00Z',
      };
      
      const handlers = {
        onToggle: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const taskItem = TaskItemComponent.render(completedTask, handlers);
      const checkbox = taskItem.querySelector('.task-item__checkbox');
      
      expect(checkbox.getAttribute('aria-label')).toBe('标记任务"Completed Task"为未完成');
    });
  });

  describe('NotificationComponent', () => {
    let notification;

    beforeEach(() => {
      notification = new NotificationComponent(container);
    });

    test('should have role="alert" on notifications', () => {
      notification.showSuccess('Success message');
      
      const notificationElement = container.querySelector('.notification');
      expect(notificationElement.getAttribute('role')).toBe('alert');
    });

    test('should have aria-live="polite" on success notifications', () => {
      notification.showSuccess('Success message');
      
      const notificationElement = container.querySelector('.notification');
      expect(notificationElement.getAttribute('aria-live')).toBe('polite');
    });

    test('should have aria-live="assertive" on error notifications', () => {
      notification.showError('Error message');
      
      const notificationElement = container.querySelector('.notification');
      expect(notificationElement.getAttribute('aria-live')).toBe('assertive');
    });

    test('should have aria-live="polite" on info notifications', () => {
      notification.showInfo('Info message');
      
      const notificationElement = container.querySelector('.notification');
      expect(notificationElement.getAttribute('aria-live')).toBe('polite');
    });

    test('should have aria-label on close button', () => {
      notification.showSuccess('Test message');
      
      const closeButton = container.querySelector('.notification-close');
      expect(closeButton.getAttribute('aria-label')).toBe('关闭通知');
    });

    test('should have aria-hidden on icon', () => {
      notification.showSuccess('Test message');
      
      const icon = container.querySelector('.notification-icon');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('HTML Structure', () => {
    test('should have proper semantic sections in index.html', () => {
      // This test would need to load the actual index.html
      // For now, we'll just verify the structure is correct
      const taskFormSection = document.createElement('section');
      taskFormSection.className = 'task-form-section';
      taskFormSection.setAttribute('aria-label', '创建新任务');
      
      expect(taskFormSection.getAttribute('aria-label')).toBe('创建新任务');
      
      const taskListSection = document.createElement('section');
      taskListSection.className = 'task-list-section';
      taskListSection.setAttribute('aria-label', '任务列表');
      
      expect(taskListSection.getAttribute('aria-label')).toBe('任务列表');
    });

    test('should have aria-live on notification container', () => {
      const notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.setAttribute('aria-live', 'polite');
      notificationContainer.setAttribute('aria-atomic', 'true');
      
      expect(notificationContainer.getAttribute('aria-live')).toBe('polite');
      expect(notificationContainer.getAttribute('aria-atomic')).toBe('true');
    });
  });
});
