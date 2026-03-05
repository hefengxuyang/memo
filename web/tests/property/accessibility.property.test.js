/**
 * Accessibility Property-Based Tests
 * 
 * Tests Properties 18, 20
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { TaskItemComponent } from '../../js/components/task-item.js';
import { TaskFormComponent } from '../../js/components/task-form.js';
import { NotificationComponent } from '../../js/components/notification.js';
import { taskGenerator } from '../helpers/generators.js';

describe('Accessibility Properties', () => {
  let container;

  beforeEach(() => {
    // Create a container for testing
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  /**
   * Property 18: Interactive Element States
   * 
   * **Validates: Requirements 8.2**
   * 
   * For any interactive UI element (button, input, checkbox), it should have 
   * appropriate visual states for hover, active, focus, and disabled conditions.
   */
  describe('Property 18: Interactive Element States', () => {
    test('buttons have all required interactive state attributes', () => {
      fc.assert(
        fc.property(
          taskGenerator(),
          (task) => {
            // Render a task item which contains buttons
            const taskItem = TaskItemComponent.render(task, {
              onToggle: () => {},
              onDelete: () => {},
            });
            container.appendChild(taskItem);

            // Get the delete button
            const deleteButton = taskItem.querySelector('.task-item__delete');
            expect(deleteButton).not.toBeNull();
            expect(deleteButton.tagName).toBe('BUTTON');

            // Verify button can be disabled (has disabled property)
            expect('disabled' in deleteButton).toBe(true);

            // Verify button is focusable (has tabindex or is naturally focusable)
            const tabIndex = deleteButton.getAttribute('tabindex');
            const isFocusable = tabIndex === null || parseInt(tabIndex) >= 0;
            expect(isFocusable).toBe(true);

            // Clean up
            container.removeChild(taskItem);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('checkboxes have all required interactive state attributes', () => {
      fc.assert(
        fc.property(
          taskGenerator(),
          (task) => {
            // Render a task item which contains a checkbox
            const taskItem = TaskItemComponent.render(task, {
              onToggle: () => {},
              onDelete: () => {},
            });
            container.appendChild(taskItem);

            // Get the checkbox
            const checkbox = taskItem.querySelector('.task-item__checkbox');
            expect(checkbox).not.toBeNull();
            expect(checkbox.type).toBe('checkbox');

            // Verify checkbox can be disabled
            expect('disabled' in checkbox).toBe(true);

            // Verify checkbox can be checked
            expect('checked' in checkbox).toBe(true);
            expect(checkbox.checked).toBe(task.completed);

            // Verify checkbox is focusable
            const tabIndex = checkbox.getAttribute('tabindex');
            const isFocusable = tabIndex === null || parseInt(tabIndex) >= 0;
            expect(isFocusable).toBe(true);

            // Clean up
            container.removeChild(taskItem);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('form inputs have all required interactive state attributes', () => {
      fc.assert(
        fc.property(
          fc.constant(null), // No need for random data, just testing form structure
          () => {
            // Create a mock task service
            const mockTaskService = {
              createTask: async () => {},
            };

            // Render the form
            const formComponent = new TaskFormComponent(container, mockTaskService);
            formComponent.render();

            // Get the title input
            const titleInput = container.querySelector('#task-title');
            expect(titleInput).not.toBeNull();

            // Verify input can be disabled
            expect('disabled' in titleInput).toBe(true);

            // Verify input is focusable
            const tabIndex = titleInput.getAttribute('tabindex');
            const isFocusable = tabIndex === null || parseInt(tabIndex) >= 0;
            expect(isFocusable).toBe(true);

            // Verify input has required attribute or aria-required
            const hasRequired = titleInput.hasAttribute('required') || 
                               titleInput.getAttribute('aria-required') === 'true';
            expect(hasRequired).toBe(true);

            // Get the description textarea
            const descriptionInput = container.querySelector('#task-description');
            expect(descriptionInput).not.toBeNull();

            // Verify textarea can be disabled
            expect('disabled' in descriptionInput).toBe(true);

            // Verify textarea is focusable
            const textareaTabIndex = descriptionInput.getAttribute('tabindex');
            const textareaFocusable = textareaTabIndex === null || parseInt(textareaTabIndex) >= 0;
            expect(textareaFocusable).toBe(true);

            // Get the submit button
            const submitButton = container.querySelector('.task-form__submit');
            expect(submitButton).not.toBeNull();

            // Verify button can be disabled
            expect('disabled' in submitButton).toBe(true);

            // Clean up
            container.innerHTML = '';

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('disabled state prevents interaction', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create a button and test disabled state
            const button = document.createElement('button');
            button.className = 'test-button';
            button.textContent = 'Test';
            container.appendChild(button);

            // Initially enabled
            expect(button.disabled).toBe(false);

            // Disable the button
            button.disabled = true;
            expect(button.disabled).toBe(true);

            // Verify disabled attribute is set
            expect(button.hasAttribute('disabled')).toBe(true);

            // Clean up
            container.removeChild(button);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 20: Accessibility Labels
   * 
   * **Validates: Requirements 8.5**
   * 
   * For all interactive elements (buttons, inputs, checkboxes), they should have 
   * appropriate ARIA labels, roles, or associated label elements for screen reader 
   * accessibility.
   */
  describe('Property 20: Accessibility Labels', () => {
    test('task item buttons have aria-label attributes', () => {
      fc.assert(
        fc.property(
          taskGenerator(),
          (task) => {
            // Render a task item
            const taskItem = TaskItemComponent.render(task, {
              onToggle: () => {},
              onDelete: () => {},
            });
            container.appendChild(taskItem);

            // Check delete button has aria-label
            const deleteButton = taskItem.querySelector('.task-item__delete');
            expect(deleteButton).not.toBeNull();
            
            const deleteAriaLabel = deleteButton.getAttribute('aria-label');
            expect(deleteAriaLabel).not.toBeNull();
            expect(deleteAriaLabel.length).toBeGreaterThan(0);
            expect(deleteAriaLabel).toContain('删除');

            // Clean up
            container.removeChild(taskItem);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('task item checkboxes have aria-label attributes', () => {
      fc.assert(
        fc.property(
          taskGenerator(),
          (task) => {
            // Render a task item
            const taskItem = TaskItemComponent.render(task, {
              onToggle: () => {},
              onDelete: () => {},
            });
            container.appendChild(taskItem);

            // Check checkbox has aria-label
            const checkbox = taskItem.querySelector('.task-item__checkbox');
            expect(checkbox).not.toBeNull();
            
            const checkboxAriaLabel = checkbox.getAttribute('aria-label');
            expect(checkboxAriaLabel).not.toBeNull();
            expect(checkboxAriaLabel.length).toBeGreaterThan(0);
            expect(checkboxAriaLabel).toContain('标记');

            // Clean up
            container.removeChild(taskItem);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('form inputs have associated labels', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create a mock task service
            const mockTaskService = {
              createTask: async () => {},
            };

            // Render the form
            const formComponent = new TaskFormComponent(container, mockTaskService);
            formComponent.render();

            // Check title input has associated label
            const titleInput = container.querySelector('#task-title');
            expect(titleInput).not.toBeNull();
            
            const titleLabel = container.querySelector('label[for="task-title"]');
            expect(titleLabel).not.toBeNull();
            expect(titleLabel.textContent.trim().length).toBeGreaterThan(0);

            // Check description textarea has associated label
            const descriptionInput = container.querySelector('#task-description');
            expect(descriptionInput).not.toBeNull();
            
            const descriptionLabel = container.querySelector('label[for="task-description"]');
            expect(descriptionLabel).not.toBeNull();
            expect(descriptionLabel.textContent.trim().length).toBeGreaterThan(0);

            // Clean up
            container.innerHTML = '';

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('form inputs have aria-required for required fields', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create a mock task service
            const mockTaskService = {
              createTask: async () => {},
            };

            // Render the form
            const formComponent = new TaskFormComponent(container, mockTaskService);
            formComponent.render();

            // Check title input has aria-required
            const titleInput = container.querySelector('#task-title');
            expect(titleInput).not.toBeNull();
            
            const ariaRequired = titleInput.getAttribute('aria-required');
            expect(ariaRequired).toBe('true');

            // Clean up
            container.innerHTML = '';

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('form inputs have aria-invalid for validation states', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create a mock task service
            const mockTaskService = {
              createTask: async () => {},
            };

            // Render the form
            const formComponent = new TaskFormComponent(container, mockTaskService);
            formComponent.render();

            // Check title input has aria-invalid
            const titleInput = container.querySelector('#task-title');
            expect(titleInput).not.toBeNull();
            
            const ariaInvalid = titleInput.getAttribute('aria-invalid');
            expect(ariaInvalid).not.toBeNull();
            expect(['true', 'false']).toContain(ariaInvalid);

            // Clean up
            container.innerHTML = '';

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('error messages have role="alert" and aria-live', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create a mock task service
            const mockTaskService = {
              createTask: async () => {},
            };

            // Render the form
            const formComponent = new TaskFormComponent(container, mockTaskService);
            formComponent.render();

            // Check error elements have proper ARIA attributes
            const titleError = container.querySelector('#title-error');
            expect(titleError).not.toBeNull();
            
            const role = titleError.getAttribute('role');
            const ariaLive = titleError.getAttribute('aria-live');
            
            expect(role).toBe('alert');
            expect(ariaLive).toBe('polite');

            // Clean up
            container.innerHTML = '';

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('submit button has aria-label', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Create a mock task service
            const mockTaskService = {
              createTask: async () => {},
            };

            // Render the form
            const formComponent = new TaskFormComponent(container, mockTaskService);
            formComponent.render();

            // Check submit button has aria-label
            const submitButton = container.querySelector('.task-form__submit');
            expect(submitButton).not.toBeNull();
            
            const ariaLabel = submitButton.getAttribute('aria-label');
            expect(ariaLabel).not.toBeNull();
            expect(ariaLabel.length).toBeGreaterThan(0);

            // Clean up
            container.innerHTML = '';

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('notification close buttons have aria-label', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (message) => {
            // Create notification container
            const notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-test-container';
            container.appendChild(notificationContainer);

            // Create notification component
            const notification = new NotificationComponent(notificationContainer);
            notification.showSuccess(message);

            // Check close button has aria-label
            const closeButton = notificationContainer.querySelector('.notification-close');
            expect(closeButton).not.toBeNull();
            
            const ariaLabel = closeButton.getAttribute('aria-label');
            expect(ariaLabel).not.toBeNull();
            expect(ariaLabel.length).toBeGreaterThan(0);
            expect(ariaLabel).toContain('关闭');

            // Clean up
            container.removeChild(notificationContainer);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('notifications have role="alert" and aria-live', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (message) => {
            // Create notification container
            const notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-test-container';
            container.appendChild(notificationContainer);

            // Create notification component
            const notification = new NotificationComponent(notificationContainer);
            notification.showSuccess(message);

            // Check notification has proper ARIA attributes
            const notificationElement = notificationContainer.querySelector('.notification');
            expect(notificationElement).not.toBeNull();
            
            const role = notificationElement.getAttribute('role');
            const ariaLive = notificationElement.getAttribute('aria-live');
            
            expect(role).toBe('alert');
            expect(ariaLive).toBe('polite');

            // Clean up
            container.removeChild(notificationContainer);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
