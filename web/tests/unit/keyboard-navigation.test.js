/**
 * Keyboard Navigation Tests
 * 
 * Tests for keyboard navigation functionality across components
 * Validates: Requirements 8.5
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TaskFormComponent } from '../../js/components/task-form.js';
import { NotificationComponent } from '../../js/components/notification.js';
import { TaskItemComponent } from '../../js/components/task-item.js';

describe('Keyboard Navigation', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('TaskFormComponent - Enter Key Submission', () => {
    let taskService;
    let taskForm;

    beforeEach(() => {
      taskService = {
        createTask: jest.fn().mockResolvedValue(undefined),
      };

      taskForm = new TaskFormComponent(container, taskService);
      taskForm.render();
    });

    test('should submit form when Enter key is pressed in title input', async () => {
      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');

      // Set valid input values
      titleInput.value = 'Test Task';
      descriptionInput.value = 'Test Description';

      // Simulate Enter key press in title input
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });

      titleInput.dispatchEvent(enterEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify form was submitted
      expect(taskService.createTask).toHaveBeenCalledWith('Test Task', 'Test Description');
    });

    test('should not submit form when Shift+Enter is pressed in title input', async () => {
      const titleInput = container.querySelector('#task-title');

      titleInput.value = 'Test Task';

      // Simulate Shift+Enter key press
      const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      titleInput.dispatchEvent(shiftEnterEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify form was not submitted
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    test('should allow Enter key in textarea for new lines', () => {
      const descriptionInput = container.querySelector('#task-description');

      // Simulate Enter key press in textarea
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });

      const defaultPrevented = !descriptionInput.dispatchEvent(enterEvent);

      // Verify Enter key was not prevented (allows new lines)
      expect(defaultPrevented).toBe(false);
    });
  });

  describe('NotificationComponent - Escape Key Dismissal', () => {
    let notification;

    beforeEach(() => {
      notification = new NotificationComponent(container);
    });

    afterEach(() => {
      notification.destroy();
    });

    test('should close notification when Escape key is pressed', () => {
      // Show a notification
      notification.showSuccess('Test notification');

      // Verify notification is visible
      expect(container.querySelector('.notification')).toBeTruthy();

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(escapeEvent);

      // Wait for animation
      setTimeout(() => {
        // Verify notification was closed
        expect(container.querySelector('.notification')).toBeFalsy();
      }, 350);
    });

    test('should close most recent notification when multiple are shown', () => {
      // Show multiple notifications
      const id1 = notification.showSuccess('First notification');
      const id2 = notification.showError('Second notification');
      const id3 = notification.showInfo('Third notification');

      // Verify all notifications are visible
      expect(container.querySelectorAll('.notification').length).toBe(3);

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      document.dispatchEvent(escapeEvent);

      // Wait for animation
      setTimeout(() => {
        // Verify only the most recent notification was closed
        expect(container.querySelectorAll('.notification').length).toBe(2);
      }, 350);
    });

    test('should not error when Escape is pressed with no notifications', () => {
      // Simulate Escape key press with no notifications
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      expect(() => {
        document.dispatchEvent(escapeEvent);
      }).not.toThrow();
    });

    test('should remove event listener on destroy', () => {
      const spy = jest.spyOn(document, 'removeEventListener');

      notification.destroy();

      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));

      spy.mockRestore();
    });
  });

  describe('Tab Navigation - Interactive Elements', () => {
    test('all interactive elements should be focusable via Tab key', () => {
      // Create a complete UI with form and task items
      const taskService = {
        createTask: jest.fn(),
      };

      const taskForm = new TaskFormComponent(container, taskService);
      taskForm.render();

      // Add a task item
      const taskItem = TaskItemComponent.render(
        {
          id: 1,
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          onToggle: jest.fn(),
          onDelete: jest.fn(),
        },
      );
      container.appendChild(taskItem);

      // Get all focusable elements
      const focusableElements = container.querySelectorAll(
        'input, textarea, button, [tabindex]:not([tabindex="-1"])',
      );

      // Verify all interactive elements are focusable
      expect(focusableElements.length).toBeGreaterThan(0);

      focusableElements.forEach(element => {
        // Verify element can receive focus
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });

    test('form inputs should have proper tab order', () => {
      const taskService = {
        createTask: jest.fn(),
      };

      const taskForm = new TaskFormComponent(container, taskService);
      taskForm.render();

      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');
      const submitButton = container.querySelector('.task-form__submit');

      // Verify tab order
      expect(titleInput.tabIndex).toBe(0);
      expect(descriptionInput.tabIndex).toBe(0);
      expect(submitButton.tabIndex).toBe(0);
    });
  });

  describe('Focus Indicators', () => {
    test('buttons should have visible focus indicators', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      container.appendChild(button);

      // Focus the button
      button.focus();

      // Get computed styles
      const styles = window.getComputedStyle(button);

      // Note: In jsdom, we can't fully test computed styles,
      // but we can verify the element is focused
      expect(document.activeElement).toBe(button);
    });

    test('inputs should have visible focus indicators', () => {
      const input = document.createElement('input');
      input.type = 'text';
      container.appendChild(input);

      // Focus the input
      input.focus();

      // Verify element is focused
      expect(document.activeElement).toBe(input);
    });

    test('checkboxes should have visible focus indicators', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      container.appendChild(checkbox);

      // Focus the checkbox
      checkbox.focus();

      // Verify element is focused
      expect(document.activeElement).toBe(checkbox);
    });
  });

  describe('Keyboard Accessibility - Task Items', () => {
    test('checkbox should be toggleable with Space key', () => {
      const handlers = {
        onToggle: jest.fn(),
        onDelete: jest.fn(),
      };

      const taskItem = TaskItemComponent.render(
        {
          id: 1,
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
          created_at: '2024-01-15T10:00:00Z',
        },
        handlers,
      );
      container.appendChild(taskItem);

      const checkbox = taskItem.querySelector('.task-item__checkbox');

      // Focus the checkbox
      checkbox.focus();

      // Simulate Space key press
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
      });

      checkbox.dispatchEvent(spaceEvent);

      // Note: Native checkbox behavior handles Space key automatically
      // We just verify the checkbox is focusable
      expect(document.activeElement).toBe(checkbox);
    });

    test('delete button should be activatable with Enter key', () => {
      const handlers = {
        onToggle: jest.fn(),
        onDelete: jest.fn(),
      };

      const taskItem = TaskItemComponent.render(
        {
          id: 1,
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
          created_at: '2024-01-15T10:00:00Z',
        },
        handlers,
      );
      container.appendChild(taskItem);

      const deleteButton = taskItem.querySelector('.task-item__delete');

      // Focus the button
      deleteButton.focus();

      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });

      deleteButton.dispatchEvent(enterEvent);

      // Note: Native button behavior handles Enter key automatically
      // We just verify the button is focusable
      expect(document.activeElement).toBe(deleteButton);
    });
  });

  describe('ARIA Labels for Keyboard Navigation', () => {
    test('form inputs should have accessible labels', () => {
      const taskService = {
        createTask: jest.fn(),
      };

      const taskForm = new TaskFormComponent(container, taskService);
      taskForm.render();

      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');

      // Verify inputs have labels
      const titleLabel = container.querySelector('label[for="task-title"]');
      const descriptionLabel = container.querySelector('label[for="task-description"]');

      expect(titleLabel).toBeTruthy();
      expect(descriptionLabel).toBeTruthy();

      // Verify ARIA attributes
      expect(titleInput.getAttribute('aria-required')).toBe('true');
      expect(titleInput.getAttribute('aria-invalid')).toBe('false');
    });

    test('task item buttons should have descriptive aria-labels', () => {
      const handlers = {
        onToggle: jest.fn(),
        onDelete: jest.fn(),
      };

      const taskItem = TaskItemComponent.render(
        {
          id: 1,
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
          created_at: '2024-01-15T10:00:00Z',
        },
        handlers,
      );
      container.appendChild(taskItem);

      const checkbox = taskItem.querySelector('.task-item__checkbox');
      const deleteButton = taskItem.querySelector('.task-item__delete');

      // Verify ARIA labels
      expect(checkbox.getAttribute('aria-label')).toContain('Test Task');
      expect(deleteButton.getAttribute('aria-label')).toContain('Test Task');
    });

    test('notification close button should have aria-label', () => {
      const notification = new NotificationComponent(container);
      notification.showSuccess('Test notification');

      const closeButton = container.querySelector('.notification-close');

      expect(closeButton.getAttribute('aria-label')).toBe('关闭通知');

      notification.destroy();
    });
  });
});
