/**
 * TaskEditComponent Unit Tests
 * 
 * Tests specific scenarios and edge cases for task editing
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { TaskEditComponent } from '../../../js/components/task-edit.js';
import { createMockTaskService } from '../../helpers/mocks.js';

// Setup DOM environment
let dom;
let document;
let container;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="edit-container"></div></body></html>');
  document = dom.window.document;
  global.document = document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  container = document.getElementById('edit-container');
});

describe('TaskEditComponent', () => {
  describe('Rendering', () => {
    test('should render edit form with pre-filled values', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      // Check form exists
      expect(container.querySelector('#task-edit-form')).toBeTruthy();
      
      // Check title is pre-filled
      const titleInput = container.querySelector('#edit-task-title');
      expect(titleInput.value).toBe('Test Task');
      
      // Check description is pre-filled
      const descriptionInput = container.querySelector('#edit-task-description');
      expect(descriptionInput.value).toBe('Test Description');
      
      // Check buttons exist
      expect(container.querySelector('.task-edit__submit')).toBeTruthy();
      expect(container.querySelector('#edit-cancel-btn')).toBeTruthy();
    });

    test('should render with empty description', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test Task',
        description: '',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const descriptionInput = container.querySelector('#edit-task-description');
      expect(descriptionInput.value).toBe('');
    });

    test('should display character counts', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Description',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleCharCount = container.querySelector('#title-char-count');
      expect(titleCharCount.textContent).toBe('4');
      
      const descriptionCharCount = container.querySelector('#description-char-count');
      expect(descriptionCharCount.textContent).toBe('11');
    });
  });

  describe('Show/Hide', () => {
    test('should show form when show() is called', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      expect(container.style.display).toBe('block');
      expect(component.currentTask).toBe(task);
    });

    test('should hide form when hide() is called', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      component.hide();
      
      expect(container.style.display).toBe('none');
      expect(container.innerHTML).toBe('');
      expect(component.currentTask).toBe(null);
    });
  });

  describe('Cancel Editing', () => {
    test('should hide form when cancel button is clicked', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const cancelButton = container.querySelector('#edit-cancel-btn');
      cancelButton.click();
      
      expect(container.style.display).toBe('none');
    });

    test('should hide form when Escape key is pressed', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const escapeEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      container.dispatchEvent(escapeEvent);
      
      expect(container.style.display).toBe('none');
    });

    test('should hide form when overlay is clicked', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const overlay = container.querySelector('.task-edit__overlay');
      overlay.click();
      
      expect(container.style.display).toBe('none');
    });
  });

  describe('Form Submission', () => {
    test('should call taskService.updateTask on successful submission', async () => {
      const taskService = createMockTaskService();
      taskService.updateTask = jest.fn().mockResolvedValue({
        id: 1,
        title: 'Updated Title',
        description: 'Updated Description',
        completed: false,
        created_at: new Date().toISOString()
      });
      
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Original',
        description: 'Original',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      const descriptionInput = container.querySelector('#edit-task-description');
      
      titleInput.value = 'Updated Title';
      descriptionInput.value = 'Updated Description';
      
      const form = container.querySelector('#task-edit-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(taskService.updateTask).toHaveBeenCalledWith(1, {
        title: 'Updated Title',
        description: 'Updated Description'
      });
      
      // Form should be hidden after successful submission
      expect(container.style.display).toBe('none');
    });

    test('should show validation error for empty title', async () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Original',
        description: 'Original',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      titleInput.value = '   '; // Whitespace only
      
      const form = container.querySelector('#task-edit-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check validation error is shown
      const errorElement = container.querySelector('#edit-title-error');
      expect(errorElement.textContent).toBeTruthy();
      expect(errorElement.style.display).toBe('block');
      
      // Form should still be visible
      expect(container.style.display).toBe('block');
    });

    test('should show validation error for title too long', async () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Original',
        description: 'Original',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      titleInput.value = 'a'.repeat(201); // Too long
      
      const form = container.querySelector('#task-edit-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check validation error is shown
      const errorElement = container.querySelector('#edit-title-error');
      expect(errorElement.textContent).toContain('200');
    });

    test('should show error message on API failure', async () => {
      const taskService = createMockTaskService();
      taskService.updateTask = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Original',
        description: 'Original',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      titleInput.value = 'Updated Title';
      
      const form = container.querySelector('#task-edit-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check error is shown
      const errorElement = container.querySelector('#edit-title-error');
      expect(errorElement.textContent).toContain('Network error');
      
      // Form should still be visible
      expect(container.style.display).toBe('block');
    });

    test('should disable submit button during submission', async () => {
      const taskService = createMockTaskService();
      let resolveUpdate;
      taskService.updateTask = jest.fn().mockReturnValue(
        new Promise(resolve => { resolveUpdate = resolve; })
      );
      
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Original',
        description: 'Original',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      titleInput.value = 'Updated Title';
      
      const submitButton = container.querySelector('.task-edit__submit');
      const cancelButton = container.querySelector('#edit-cancel-btn');
      
      const form = container.querySelector('#task-edit-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Wait a tick for the async handler to start
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check buttons are disabled during submission
      expect(submitButton.disabled).toBe(true);
      expect(cancelButton.disabled).toBe(true);
      
      // Resolve the promise
      resolveUpdate({ id: 1, title: 'Updated Title', description: 'Original', completed: false });
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  describe('Real-time Validation', () => {
    test('should update character count on input', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      titleInput.value = 'New Title';
      
      const inputEvent = new dom.window.Event('input', { bubbles: true });
      titleInput.dispatchEvent(inputEvent);
      
      const charCount = container.querySelector('#title-char-count');
      expect(charCount.textContent).toBe('9');
    });

    test('should show validation error on invalid input', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      titleInput.value = '   '; // Invalid
      
      const inputEvent = new dom.window.Event('input', { bubbles: true });
      titleInput.dispatchEvent(inputEvent);
      
      const errorElement = container.querySelector('#edit-title-error');
      expect(errorElement.textContent).toBeTruthy();
      expect(titleInput.getAttribute('aria-invalid')).toBe('true');
    });

    test('should clear validation error on valid input', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      
      // First set invalid
      titleInput.value = '   ';
      let inputEvent = new dom.window.Event('input', { bubbles: true });
      titleInput.dispatchEvent(inputEvent);
      
      // Then set valid
      titleInput.value = 'Valid Title';
      inputEvent = new dom.window.Event('input', { bubbles: true });
      titleInput.dispatchEvent(inputEvent);
      
      const errorElement = container.querySelector('#edit-title-error');
      expect(errorElement.textContent).toBe('');
      expect(titleInput.getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      // Check dialog role
      const dialog = container.querySelector('.task-edit');
      expect(dialog.getAttribute('role')).toBe('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      
      // Check form elements have proper labels
      const titleInput = container.querySelector('#edit-task-title');
      expect(titleInput.getAttribute('aria-required')).toBe('true');
      expect(titleInput.getAttribute('aria-invalid')).toBe('false');
      
      // Check error elements have proper roles
      const titleError = container.querySelector('#edit-title-error');
      expect(titleError.getAttribute('role')).toBe('alert');
      expect(titleError.getAttribute('aria-live')).toBe('polite');
    });

    test('should update aria-invalid on validation error', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const titleInput = container.querySelector('#edit-task-title');
      
      // Show error
      component.showValidationError('title', 'Error message');
      expect(titleInput.getAttribute('aria-invalid')).toBe('true');
      
      // Clear error
      component.clearValidationError('title');
      expect(titleInput.getAttribute('aria-invalid')).toBe('false');
    });

    test('should update aria-busy during submission', () => {
      const taskService = createMockTaskService();
      const component = new TaskEditComponent(container, taskService);
      
      const task = {
        id: 1,
        title: 'Test',
        description: 'Test',
        completed: false,
        created_at: new Date().toISOString()
      };
      
      component.show(task);
      
      const submitButton = container.querySelector('.task-edit__submit');
      
      // Set submitting
      component.setSubmitting(true);
      expect(submitButton.getAttribute('aria-busy')).toBe('true');
      
      // Reset
      component.setSubmitting(false);
      expect(submitButton.getAttribute('aria-busy')).toBe('false');
    });
  });
});
