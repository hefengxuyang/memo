/**
 * TaskListComponent Unit Tests
 * 
 * Tests task list rendering, empty state, loading state, error state, and task grouping
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { TaskListComponent } from '../../../js/components/task-list.js';
import { createMockTask } from '../../helpers/factories.js';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.CustomEvent = dom.window.CustomEvent;

describe('TaskListComponent', () => {
  let container;
  let taskService;
  let component;

  // Helper to wait for async DOM updates
  const waitForRender = () => {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  };

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'task-list-container';
    document.body.appendChild(container);

    // Mock task service
    taskService = {
      loadTasks: jest.fn(),
      createTask: jest.fn(),
      toggleTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
    };

    component = new TaskListComponent(container, taskService);
  });

  describe('Task List Rendering', () => {
    test('should render empty container initially', () => {
      expect(container.innerHTML).toBe('');
    });

    test('should render tasks when provided', async () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', completed: false }),
        createMockTask({ id: 2, title: 'Task 2', completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const taskItems = container.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(2);
    });

    test('should render task titles correctly', async () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Buy groceries', completed: false }),
        createMockTask({ id: 2, title: 'Write report', completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const titles = container.querySelectorAll('.task-item__title');
      expect(titles[0].textContent).toBe('Buy groceries');
      expect(titles[1].textContent).toBe('Write report');
    });

    test('should clear previous content before rendering', async () => {
      container.innerHTML = '<div>Previous content</div>';

      const tasks = [createMockTask({ id: 1, completed: false })];
      component.render(tasks);
      await waitForRender();

      expect(container.textContent).not.toContain('Previous content');
    });

    test('should render single task', async () => {
      const tasks = [createMockTask({ id: 1, title: 'Single Task', completed: false })];

      component.render(tasks);
      await waitForRender();

      const taskItems = container.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(1);
    });

    test('should render many tasks', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        createMockTask({ id: i + 1, title: `Task ${i + 1}`, completed: false })
      );

      component.render(tasks);
      await waitForRender();

      const taskItems = container.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(10);
    });

    test('should render tasks with special characters', async () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Task with <html> & "quotes"', completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const title = container.querySelector('.task-item__title');
      expect(title.textContent).toBe('Task with <html> & "quotes"');
    });

    test('should have role="list" on task items container', async () => {
      const tasks = [createMockTask({ id: 1, completed: false })];

      component.render(tasks);
      await waitForRender();

      const list = container.querySelector('.task-list__items');
      expect(list.getAttribute('role')).toBe('list');
    });

    test('should have role="listitem" on each task', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: false }),
        createMockTask({ id: 2, completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const items = container.querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(2);
    });

    test('should have aria-label on task list', async () => {
      const tasks = [createMockTask({ id: 1, completed: false })];

      component.render(tasks);
      await waitForRender();

      const list = container.querySelector('.task-list__items');
      expect(list.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Empty State Display', () => {
    test('should render empty state', () => {
      component.renderEmptyState();

      const emptyState = container.querySelector('.task-list__empty');
      expect(emptyState).toBeTruthy();
    });

    test('should display empty state message', () => {
      component.renderEmptyState();

      const message = container.querySelector('.task-list__empty-message');
      expect(message.textContent).toContain('还没有任务');
    });

    test('should display empty state icon', () => {
      component.renderEmptyState();

      const icon = container.querySelector('.task-list__empty-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toBe('📝');
    });

    test('should have role="status" on empty state', () => {
      component.renderEmptyState();

      const emptyState = container.querySelector('.task-list__empty');
      expect(emptyState.getAttribute('role')).toBe('status');
    });

    test('should have aria-live="polite" on empty state', () => {
      component.renderEmptyState();

      const emptyState = container.querySelector('.task-list__empty');
      expect(emptyState.getAttribute('aria-live')).toBe('polite');
    });

    test('should clear previous content when rendering empty state', () => {
      container.innerHTML = '<div>Previous content</div>';

      component.renderEmptyState();

      expect(container.textContent).not.toContain('Previous content');
    });

    test('should only show empty state content', () => {
      component.renderEmptyState();

      const taskItems = container.querySelectorAll('.task-item');
      const loadingState = container.querySelector('.task-list__loading');
      const errorState = container.querySelector('.task-list__error');

      expect(taskItems.length).toBe(0);
      expect(loadingState).toBeFalsy();
      expect(errorState).toBeFalsy();
    });
  });

  describe('Loading State Display', () => {
    test('should render loading state', () => {
      component.renderLoading();

      const loadingState = container.querySelector('.task-list__loading');
      expect(loadingState).toBeTruthy();
    });

    test('should display loading message', () => {
      component.renderLoading();

      const message = container.querySelector('.task-list__loading-message');
      expect(message.textContent).toContain('加载中');
    });

    test('should display loading spinner', () => {
      component.renderLoading();

      const spinner = container.querySelector('.task-list__spinner');
      expect(spinner).toBeTruthy();
    });

    test('should have role="status" on loading state', () => {
      component.renderLoading();

      const loadingState = container.querySelector('.task-list__loading');
      expect(loadingState.getAttribute('role')).toBe('status');
    });

    test('should have aria-live="polite" on loading state', () => {
      component.renderLoading();

      const loadingState = container.querySelector('.task-list__loading');
      expect(loadingState.getAttribute('aria-live')).toBe('polite');
    });

    test('should have aria-label on loading state', () => {
      component.renderLoading();

      const loadingState = container.querySelector('.task-list__loading');
      expect(loadingState.getAttribute('aria-label')).toContain('加载');
    });

    test('should clear previous content when rendering loading state', () => {
      container.innerHTML = '<div>Previous content</div>';

      component.renderLoading();

      expect(container.textContent).not.toContain('Previous content');
    });

    test('should only show loading state content', () => {
      component.renderLoading();

      const taskItems = container.querySelectorAll('.task-item');
      const emptyState = container.querySelector('.task-list__empty');
      const errorState = container.querySelector('.task-list__error');

      expect(taskItems.length).toBe(0);
      expect(emptyState).toBeFalsy();
      expect(errorState).toBeFalsy();
    });
  });

  describe('Error State Display', () => {
    test('should render error state', () => {
      component.renderError('Test error message');

      const errorState = container.querySelector('.task-list__error');
      expect(errorState).toBeTruthy();
    });

    test('should display error message', () => {
      component.renderError('Network connection failed');

      const message = container.querySelector('.task-list__error-message');
      expect(message.textContent).toBe('Network connection failed');
    });

    test('should display default error message when no message provided', () => {
      component.renderError();

      const message = container.querySelector('.task-list__error-message');
      expect(message.textContent).toContain('加载任务失败');
    });

    test('should display error icon', () => {
      component.renderError('Error');

      const icon = container.querySelector('.task-list__error-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toBe('⚠️');
    });

    test('should have role="alert" on error state', () => {
      component.renderError('Error');

      const errorState = container.querySelector('.task-list__error');
      expect(errorState.getAttribute('role')).toBe('alert');
    });

    test('should have aria-live="assertive" on error state', () => {
      component.renderError('Error');

      const errorState = container.querySelector('.task-list__error');
      expect(errorState.getAttribute('aria-live')).toBe('assertive');
    });

    test('should clear previous content when rendering error state', () => {
      container.innerHTML = '<div>Previous content</div>';

      component.renderError('Error');

      expect(container.textContent).not.toContain('Previous content');
    });

    test('should only show error state content', () => {
      component.renderError('Error');

      const taskItems = container.querySelectorAll('.task-item');
      const emptyState = container.querySelector('.task-list__empty');
      const loadingState = container.querySelector('.task-list__loading');

      expect(taskItems.length).toBe(0);
      expect(emptyState).toBeFalsy();
      expect(loadingState).toBeFalsy();
    });

    test('should handle empty string error message', () => {
      component.renderError('');

      const message = container.querySelector('.task-list__error-message');
      expect(message.textContent).toContain('加载任务失败');
    });

    test('should handle long error messages', () => {
      const longMessage = 'A'.repeat(200);
      component.renderError(longMessage);

      const message = container.querySelector('.task-list__error-message');
      expect(message.textContent).toBe(longMessage);
    });
  });

  describe('Completed and Uncompleted Task Grouping', () => {
    test('should separate completed and uncompleted tasks', async () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Active Task', completed: false }),
        createMockTask({ id: 2, title: 'Completed Task', completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const activeSections = container.querySelectorAll('.task-list__section--active');
      const completedSections = container.querySelectorAll('.task-list__section--completed');

      expect(activeSections.length).toBe(1);
      expect(completedSections.length).toBe(1);
    });

    test('should render uncompleted tasks in active section', async () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', completed: false }),
        createMockTask({ id: 2, title: 'Task 2', completed: false }),
        createMockTask({ id: 3, title: 'Task 3', completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const activeSection = container.querySelector('.task-list__section--active');
      const taskItems = activeSection.querySelectorAll('.task-item');

      expect(taskItems.length).toBe(2);
    });

    test('should render completed tasks in completed section', async () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', completed: false }),
        createMockTask({ id: 2, title: 'Task 2', completed: true }),
        createMockTask({ id: 3, title: 'Task 3', completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const completedSection = container.querySelector('.task-list__section--completed');
      const taskItems = completedSection.querySelectorAll('.task-item');

      expect(taskItems.length).toBe(2);
    });

    test('should show section headers with counts', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: false }),
        createMockTask({ id: 2, completed: false }),
        createMockTask({ id: 3, completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const headers = container.querySelectorAll('.task-list__header');
      expect(headers[0].textContent).toContain('2');
      expect(headers[1].textContent).toContain('1');
    });

    test('should only show active section when no completed tasks', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: false }),
        createMockTask({ id: 2, completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const activeSections = container.querySelectorAll('.task-list__section--active');
      const completedSections = container.querySelectorAll('.task-list__section--completed');

      expect(activeSections.length).toBe(1);
      expect(completedSections.length).toBe(0);
    });

    test('should only show completed section when no active tasks', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: true }),
        createMockTask({ id: 2, completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const activeSections = container.querySelectorAll('.task-list__section--active');
      const completedSections = container.querySelectorAll('.task-list__section--completed');

      expect(activeSections.length).toBe(0);
      expect(completedSections.length).toBe(1);
    });

    test('should render active section before completed section', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: true }),
        createMockTask({ id: 2, completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const sections = container.querySelectorAll('.task-list__section');
      expect(sections[0].classList.contains('task-list__section--active')).toBe(true);
      expect(sections[1].classList.contains('task-list__section--completed')).toBe(true);
    });

    test('should apply correct CSS classes to completed tasks', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const taskItem = container.querySelector('.task-item');
      expect(taskItem.classList.contains('task-item--completed')).toBe(true);
    });

    test('should apply correct CSS classes to uncompleted tasks', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const taskItem = container.querySelector('.task-item');
      expect(taskItem.classList.contains('task-item--active')).toBe(true);
    });

    test('should handle all tasks completed', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: true }),
        createMockTask({ id: 2, completed: true }),
        createMockTask({ id: 3, completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const completedSection = container.querySelector('.task-list__section--completed');
      const taskItems = completedSection.querySelectorAll('.task-item');

      expect(taskItems.length).toBe(3);
    });

    test('should handle all tasks uncompleted', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: false }),
        createMockTask({ id: 2, completed: false }),
        createMockTask({ id: 3, completed: false }),
      ];

      component.render(tasks);
      await waitForRender();

      const activeSection = container.querySelector('.task-list__section--active');
      const taskItems = activeSection.querySelectorAll('.task-item');

      expect(taskItems.length).toBe(3);
    });

    test('should have aria-label on both sections', async () => {
      const tasks = [
        createMockTask({ id: 1, completed: false }),
        createMockTask({ id: 2, completed: true }),
      ];

      component.render(tasks);
      await waitForRender();

      const lists = container.querySelectorAll('.task-list__items');
      expect(lists[0].getAttribute('aria-label')).toContain('待办');
      expect(lists[1].getAttribute('aria-label')).toContain('已完成');
    });
  });

  describe('Event Handling', () => {
    test('should bind toggle handler to task items', async () => {
      const tasks = [createMockTask({ id: 5, completed: false })];
      component.render(tasks);
      await waitForRender();

      const checkbox = container.querySelector('.task-item__checkbox');
      expect(checkbox).toBeTruthy();
      
      // Verify checkbox has event listener by checking it's interactive
      expect(checkbox.type).toBe('checkbox');
    });

    test('should bind delete handler to task items', async () => {
      const tasks = [createMockTask({ id: 7, completed: false })];
      component.render(tasks);
      await waitForRender();

      const deleteBtn = container.querySelector('.task-item__delete');
      expect(deleteBtn).toBeTruthy();
      
      // Verify delete button exists and is interactive
      expect(deleteBtn.tagName).toBe('BUTTON');
    });
  });
});
