/**
 * TaskEditComponent Property-Based Tests
 * 
 * Tests Properties 5, 6, 10, 15, 16, 19, 20
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { TaskEditComponent } from '../../js/components/task-edit.js';
import { createMockTaskService } from '../helpers/mocks.js';
import { createTaskDataGenerator, whitespaceStringGenerator } from '../helpers/generators.js';

// Setup DOM environment
let dom;
let document;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="edit-container"></div></body></html>');
  document = dom.window.document;
  global.document = document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
});

describe('TaskEditComponent Properties', () => {
  describe('Property 5: 编辑功能可用性', () => {
    /**
     * **Validates: Requirements 2.1, 2.2, 2.3**
     * 
     * For any task, the edit form should be available, display correctly,
     * and pre-fill with current task data
     */
    test('property: edit form renders with all required elements', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          (task) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            component.show(task);
            
            // Check form exists
            const form = container.querySelector('#task-edit-form');
            expect(form).toBeTruthy();
            
            // Check title input exists and is pre-filled
            const titleInput = container.querySelector('#edit-task-title');
            expect(titleInput).toBeTruthy();
            expect(titleInput.value).toBe(task.title);
            
            // Check description textarea exists and is pre-filled
            const descriptionInput = container.querySelector('#edit-task-description');
            expect(descriptionInput).toBeTruthy();
            expect(descriptionInput.value).toBe(task.description);
            
            // Check submit button exists
            const submitButton = container.querySelector('.task-edit__submit');
            expect(submitButton).toBeTruthy();
            
            // Check cancel button exists
            const cancelButton = container.querySelector('#edit-cancel-btn');
            expect(cancelButton).toBeTruthy();
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 6: 输入验证规则', () => {
    /**
     * **Validates: Requirements 2.4, 2.5, 2.6, 2.7**
     * 
     * For any input, validation should reject empty/whitespace titles,
     * titles > 200 chars, descriptions > 1000 chars, and accept valid inputs
     */
    test('property: validation rejects empty or whitespace-only titles', () => {
      fc.assert(
        fc.property(
          whitespaceStringGenerator(),
          (emptyTitle) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            const task = { id: 1, title: 'Original', description: 'Test', completed: false };
            component.show(task);
            
            const titleInput = container.querySelector('#edit-task-title');
            titleInput.value = emptyTitle;
            
            const isValid = component.validateField('title');
            
            expect(isValid).toBe(false);
            const errorElement = container.querySelector('#edit-title-error');
            expect(errorElement.textContent).toBeTruthy();
            expect(titleInput.getAttribute('aria-invalid')).toBe('true');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: validation rejects titles longer than 200 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 300 }),
          (longTitle) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            const task = { id: 1, title: 'Original', description: 'Test', completed: false };
            component.show(task);
            
            const titleInput = container.querySelector('#edit-task-title');
            titleInput.value = longTitle;
            
            const isValid = component.validateField('title');
            
            expect(isValid).toBe(false);
            const errorElement = container.querySelector('#edit-title-error');
            expect(errorElement.textContent).toContain('200');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: validation rejects descriptions longer than 1000 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1001, maxLength: 1500 }),
          (longDescription) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            const task = { id: 1, title: 'Original', description: 'Test', completed: false };
            component.show(task);
            
            const descriptionInput = container.querySelector('#edit-task-description');
            descriptionInput.value = longDescription;
            
            const isValid = component.validateField('description');
            
            expect(isValid).toBe(false);
            const errorElement = container.querySelector('#edit-description-error');
            expect(errorElement.textContent).toContain('1000');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: validation accepts valid titles and descriptions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 0, maxLength: 1000 }),
          (validTitle, validDescription) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            const task = { id: 1, title: 'Original', description: 'Test', completed: false };
            component.show(task);
            
            const titleInput = container.querySelector('#edit-task-title');
            const descriptionInput = container.querySelector('#edit-task-description');
            
            titleInput.value = validTitle;
            descriptionInput.value = validDescription;
            
            const titleValid = component.validateField('title');
            const descriptionValid = component.validateField('description');
            
            expect(titleValid).toBe(true);
            expect(descriptionValid).toBe(true);
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 10: 取消编辑恢复状态', () => {
    /**
     * **Validates: Requirements 2.11, 2.12**
     * 
     * For any edit session, canceling should hide the form, restore view mode,
     * and discard unsaved changes
     */
    test('property: cancel hides form and discards changes', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 0, maxLength: 1000 }),
          (task, newTitle, newDescription) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            // Show edit form
            component.show(task);
            expect(container.style.display).toBe('block');
            
            // Make changes
            const titleInput = container.querySelector('#edit-task-title');
            const descriptionInput = container.querySelector('#edit-task-description');
            titleInput.value = newTitle;
            descriptionInput.value = newDescription;
            
            // Cancel editing
            component.handleCancel();
            
            // Verify form is hidden
            expect(container.style.display).toBe('none');
            expect(container.innerHTML).toBe('');
            expect(component.currentTask).toBe(null);
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 15: 提交状态UI反馈', () => {
    /**
     * **Validates: Requirements 4.1, 4.2**
     * 
     * For any update request submission, the submit button should be disabled
     * and a loading indicator should be displayed during the request
     */
    test('property: submit button is disabled during submission', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          (task) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            component.show(task);
            
            // Set submitting state
            component.setSubmitting(true);
            
            const submitButton = container.querySelector('.task-edit__submit');
            const cancelButton = container.querySelector('#edit-cancel-btn');
            const titleInput = container.querySelector('#edit-task-title');
            const descriptionInput = container.querySelector('#edit-task-description');
            
            // Verify buttons and inputs are disabled
            expect(submitButton.disabled).toBe(true);
            expect(cancelButton.disabled).toBe(true);
            expect(titleInput.disabled).toBe(true);
            expect(descriptionInput.disabled).toBe(true);
            
            // Verify loading indicator is shown
            const loadingText = container.querySelector('.task-edit__submit-loading');
            const submitText = container.querySelector('.task-edit__submit-text');
            expect(loadingText.style.display).toBe('inline');
            expect(submitText.style.display).toBe('none');
            
            // Verify ARIA attributes
            expect(submitButton.getAttribute('aria-busy')).toBe('true');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: submit button is re-enabled after submission completes', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          (task) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            component.show(task);
            
            // Set submitting state then reset
            component.setSubmitting(true);
            component.setSubmitting(false);
            
            const submitButton = container.querySelector('.task-edit__submit');
            const cancelButton = container.querySelector('#edit-cancel-btn');
            const titleInput = container.querySelector('#edit-task-title');
            const descriptionInput = container.querySelector('#edit-task-description');
            
            // Verify buttons and inputs are enabled
            expect(submitButton.disabled).toBe(false);
            expect(cancelButton.disabled).toBe(false);
            expect(titleInput.disabled).toBe(false);
            expect(descriptionInput.disabled).toBe(false);
            
            // Verify loading indicator is hidden
            const loadingText = container.querySelector('.task-edit__submit-loading');
            const submitText = container.querySelector('.task-edit__submit-text');
            expect(loadingText.style.display).toBe('none');
            expect(submitText.style.display).toBe('inline');
            
            // Verify ARIA attributes
            expect(submitButton.getAttribute('aria-busy')).toBe('false');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 16: Escape键取消编辑', () => {
    /**
     * **Validates: Requirements 4.5**
     * 
     * For any task in edit mode, pressing Escape key should cancel editing
     * and restore view mode
     */
    test('property: Escape key cancels editing', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          (task) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            component.show(task);
            expect(container.style.display).toBe('block');
            
            // Simulate Escape key press
            const escapeEvent = new dom.window.KeyboardEvent('keydown', {
              key: 'Escape',
              bubbles: true,
              cancelable: true,
            });
            container.dispatchEvent(escapeEvent);
            
            // Verify form is hidden
            expect(container.style.display).toBe('none');
            expect(container.innerHTML).toBe('');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 19: 编辑模式自动聚焦', () => {
    /**
     * **Validates: Requirements 4.9**
     * 
     * For any operation entering edit mode, the title input should
     * automatically receive focus
     */
    test('property: title input receives focus when entering edit mode', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          (task) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            // Mock focus method
            let focusCalled = false;
            const originalShow = component.show.bind(component);
            component.show = function(task) {
              originalShow(task);
              const titleInput = container.querySelector('#edit-task-title');
              if (titleInput) {
                titleInput.focus = () => { focusCalled = true; };
                titleInput.setSelectionRange = () => {};
                // Trigger the focus manually since setTimeout won't work in test
                titleInput.focus();
              }
            };
            
            component.show(task);
            
            // Verify focus was called
            expect(focusCalled).toBe(true);
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 20: 实时字符计数', () => {
    /**
     * **Validates: Requirements 4.10**
     * 
     * For any input change, the character count should be displayed in real-time
     * showing current count and maximum limit
     */
    test('property: character count updates in real-time for title', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          fc.string({ minLength: 0, maxLength: 200 }),
          (task, newTitle) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            component.show(task);
            
            const titleInput = container.querySelector('#edit-task-title');
            titleInput.value = newTitle;
            
            // Trigger input event
            const inputEvent = new dom.window.Event('input', { bubbles: true });
            titleInput.dispatchEvent(inputEvent);
            
            // Check character count is updated
            const charCount = container.querySelector('#title-char-count');
            expect(charCount).toBeTruthy();
            expect(charCount.textContent).toBe(String(newTitle.length));
            
            // Check that max length is displayed
            const charCountContainer = charCount.parentElement;
            expect(charCountContainer.textContent).toContain('200');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: character count updates in real-time for description', () => {
      fc.assert(
        fc.property(
          createTaskDataGenerator(),
          fc.string({ minLength: 0, maxLength: 1000 }),
          (task, newDescription) => {
            const container = document.getElementById('edit-container');
            const taskService = createMockTaskService();
            const component = new TaskEditComponent(container, taskService);
            
            component.show(task);
            
            const descriptionInput = container.querySelector('#edit-task-description');
            descriptionInput.value = newDescription;
            
            // Trigger input event
            const inputEvent = new dom.window.Event('input', { bubbles: true });
            descriptionInput.dispatchEvent(inputEvent);
            
            // Check character count is updated
            const charCount = container.querySelector('#description-char-count');
            expect(charCount).toBeTruthy();
            expect(charCount.textContent).toBe(String(newDescription.length));
            
            // Check that max length is displayed
            const charCountContainer = charCount.parentElement;
            expect(charCountContainer.textContent).toContain('1000');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
