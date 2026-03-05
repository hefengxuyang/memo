/**
 * TaskFormComponent Unit Tests
 * 
 * Tests form rendering, submission, validation errors, form clearing, and submitting state
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { TaskFormComponent } from '../../../js/components/task-form.js';
import { createMockTaskService } from '../../helpers/mocks.js';

// Setup DOM environment
let dom;
let document;
let container;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="form-container"></div></body></html>');
  document = dom.window.document;
  global.document = document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  container = document.getElementById('form-container');
});

describe('TaskFormComponent', () => {
  describe('Form Rendering', () => {
    test('should render form with all required elements', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const form = container.querySelector('#task-form');
      expect(form).toBeTruthy();
      expect(form.tagName).toBe('FORM');
    });

    test('should render title input field', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      expect(titleInput).toBeTruthy();
      expect(titleInput.type).toBe('text');
      expect(titleInput.getAttribute('aria-required')).toBe('true');
    });

    test('should render title label with required indicator', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const label = container.querySelector('label[for="task-title"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('任务标题');
      
      const required = label.querySelector('.task-form__required');
      expect(required).toBeTruthy();
    });

    test('should render description textarea', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const descriptionInput = container.querySelector('#task-description');
      expect(descriptionInput).toBeTruthy();
      expect(descriptionInput.tagName).toBe('TEXTAREA');
    });

    test('should render description label', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const label = container.querySelector('label[for="task-description"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('任务描述');
    });

    test('should render submit button', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const submitButton = container.querySelector('.task-form__submit');
      expect(submitButton).toBeTruthy();
      expect(submitButton.type).toBe('submit');
    });

    test('should render error containers for title and description', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleError = container.querySelector('#title-error');
      const descriptionError = container.querySelector('#description-error');
      
      expect(titleError).toBeTruthy();
      expect(descriptionError).toBeTruthy();
      expect(titleError.getAttribute('role')).toBe('alert');
      expect(descriptionError.getAttribute('role')).toBe('alert');
    });

    test('should set maxlength attributes on inputs', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');
      
      expect(titleInput.maxLength).toBe(200);
      expect(descriptionInput.maxLength).toBe(1000);
    });

    test('should have placeholder text on inputs', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');
      
      expect(titleInput.placeholder).toBeTruthy();
      expect(descriptionInput.placeholder).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    test('should call taskService.createTask with valid input', async () => {
      const taskService = createMockTaskService();
      taskService.createTask.mockResolvedValue();
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');
      const form = container.querySelector('#task-form');
      
      titleInput.value = 'Test Task';
      descriptionInput.value = 'Test Description';
      
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      await form.dispatchEvent(submitEvent);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(taskService.createTask).toHaveBeenCalledWith('Test Task', 'Test Description');
    });

    test('should prevent default form submission', async () => {
      const taskService = createMockTaskService();
      taskService.createTask.mockResolvedValue();
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = 'Test Task';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      
      let defaultPrevented = false;
      submitEvent.preventDefault = () => { defaultPrevented = true; };
      
      await form.dispatchEvent(submitEvent);
      
      expect(defaultPrevented).toBe(true);
    });

    test('should not submit with empty title', async () => {
      const taskService = createMockTaskService();
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = '';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      await form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    test('should not submit with whitespace-only title', async () => {
      const taskService = createMockTaskService();
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = '   ';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      await form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    test('should submit with empty description', async () => {
      const taskService = createMockTaskService();
      taskService.createTask.mockResolvedValue();
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = 'Test Task';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      await form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(taskService.createTask).toHaveBeenCalledWith('Test Task', '');
    });

    test('should handle submission error', async () => {
      const taskService = createMockTaskService();
      taskService.createTask.mockRejectedValue(new Error('Network error'));
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = 'Test Task';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      await form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const errorElement = container.querySelector('#title-error');
      expect(errorElement.textContent).toBeTruthy();
    });
  });

  describe('Validation Error Display', () => {
    test('should show validation error for title field', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.showValidationError('title', '任务标题不能为空');
      
      const errorElement = container.querySelector('#title-error');
      expect(errorElement.textContent).toBe('任务标题不能为空');
      expect(errorElement.style.display).toBe('block');
    });

    test('should show validation error for description field', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.showValidationError('description', '描述太长');
      
      const errorElement = container.querySelector('#description-error');
      expect(errorElement.textContent).toBe('描述太长');
      expect(errorElement.style.display).toBe('block');
    });

    test('should set aria-invalid on input when showing error', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.showValidationError('title', 'Error message');
      
      const titleInput = container.querySelector('#task-title');
      expect(titleInput.getAttribute('aria-invalid')).toBe('true');
    });

    test('should add error class to input when showing error', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.showValidationError('title', 'Error message');
      
      const titleInput = container.querySelector('#task-title');
      expect(titleInput.classList.contains('task-form__input--error')).toBe(true);
    });

    test('should display validation error on submit with empty title', async () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = '';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      await form.dispatchEvent(submitEvent);
      
      const errorElement = container.querySelector('#title-error');
      expect(errorElement.textContent).toContain('标题');
    });

    test('should clear validation error when field becomes valid', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      // Show error first
      component.showValidationError('title', 'Error message');
      
      // Clear error
      component.clearValidationError('title');
      
      const errorElement = container.querySelector('#title-error');
      expect(errorElement.textContent).toBe('');
      expect(errorElement.style.display).toBe('none');
    });

    test('should remove aria-invalid when clearing error', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      component.showValidationError('title', 'Error message');
      component.clearValidationError('title');
      
      const titleInput = container.querySelector('#task-title');
      expect(titleInput.getAttribute('aria-invalid')).toBe('false');
    });

    test('should remove error class when clearing error', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      component.showValidationError('title', 'Error message');
      component.clearValidationError('title');
      
      const titleInput = container.querySelector('#task-title');
      expect(titleInput.classList.contains('task-form__input--error')).toBe(false);
    });
  });

  describe('Form Clearing', () => {
    test('should clear title input', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = 'Test Task';
      
      component.clearForm();
      
      expect(titleInput.value).toBe('');
    });

    test('should clear description input', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const descriptionInput = container.querySelector('#task-description');
      descriptionInput.value = 'Test Description';
      
      component.clearForm();
      
      expect(descriptionInput.value).toBe('');
    });

    test('should clear validation errors when clearing form', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      component.showValidationError('title', 'Error message');
      component.clearForm();
      
      const errorElement = container.querySelector('#title-error');
      expect(errorElement.textContent).toBe('');
    });

    test('should clear form after successful submission', async () => {
      const taskService = createMockTaskService();
      taskService.createTask.mockResolvedValue();
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');
      
      titleInput.value = 'Test Task';
      descriptionInput.value = 'Test Description';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      await form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(titleInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });
  });

  describe('Submitting State', () => {
    test('should disable submit button when submitting', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.setSubmitting(true);
      
      const submitButton = container.querySelector('.task-form__submit');
      expect(submitButton.disabled).toBe(true);
    });

    test('should disable title input when submitting', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.setSubmitting(true);
      
      const titleInput = container.querySelector('#task-title');
      expect(titleInput.disabled).toBe(true);
    });

    test('should disable description input when submitting', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.setSubmitting(true);
      
      const descriptionInput = container.querySelector('#task-description');
      expect(descriptionInput.disabled).toBe(true);
    });

    test('should show loading text when submitting', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.setSubmitting(true);
      
      const submitText = container.querySelector('.task-form__submit-text');
      const submitLoading = container.querySelector('.task-form__submit-loading');
      
      expect(submitText.style.display).toBe('none');
      expect(submitLoading.style.display).toBe('inline');
    });

    test('should enable inputs when not submitting', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.setSubmitting(true);
      component.setSubmitting(false);
      
      const submitButton = container.querySelector('.task-form__submit');
      const titleInput = container.querySelector('#task-title');
      const descriptionInput = container.querySelector('#task-description');
      
      expect(submitButton.disabled).toBe(false);
      expect(titleInput.disabled).toBe(false);
      expect(descriptionInput.disabled).toBe(false);
    });

    test('should hide loading text when not submitting', () => {
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      component.setSubmitting(true);
      component.setSubmitting(false);
      
      const submitText = container.querySelector('.task-form__submit-text');
      const submitLoading = container.querySelector('.task-form__submit-loading');
      
      expect(submitText.style.display).toBe('inline');
      expect(submitLoading.style.display).toBe('none');
    });

    test('should set submitting state during form submission', async () => {
      const taskService = createMockTaskService();
      let resolveCreate;
      taskService.createTask.mockReturnValue(new Promise(resolve => {
        resolveCreate = resolve;
      }));
      
      const component = new TaskFormComponent(container, taskService);
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = 'Test Task';
      
      const form = container.querySelector('#task-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      
      // Start submission
      form.dispatchEvent(submitEvent);
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check submitting state
      const submitButton = container.querySelector('.task-form__submit');
      expect(submitButton.disabled).toBe(true);
      
      // Complete submission
      resolveCreate();
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check state is reset
      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('Real-time Validation', () => {
    test('should validate title on input event after debounce', async () => {
      jest.useFakeTimers();
      
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      titleInput.value = '';
      
      const inputEvent = new dom.window.Event('input', { bubbles: true });
      titleInput.dispatchEvent(inputEvent);
      
      // Fast-forward time to trigger debounced validation
      jest.advanceTimersByTime(300);
      
      const errorElement = container.querySelector('#title-error');
      expect(errorElement.textContent).toBeTruthy();
      
      jest.useRealTimers();
    });

    test('should validate description on input event after debounce', async () => {
      jest.useFakeTimers();
      
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const descriptionInput = container.querySelector('#task-description');
      descriptionInput.value = 'A'.repeat(1001);
      
      const inputEvent = new dom.window.Event('input', { bubbles: true });
      descriptionInput.dispatchEvent(inputEvent);
      
      // Fast-forward time to trigger debounced validation
      jest.advanceTimersByTime(300);
      
      const errorElement = container.querySelector('#description-error');
      expect(errorElement.textContent).toBeTruthy();
      
      jest.useRealTimers();
    });

    test('should clear error when title becomes valid after debounce', async () => {
      jest.useFakeTimers();
      
      const taskService = createMockTaskService();
      const component = new TaskFormComponent(container, taskService);
      
      component.render();
      
      const titleInput = container.querySelector('#task-title');
      
      // Invalid input
      titleInput.value = '';
      let inputEvent = new dom.window.Event('input', { bubbles: true });
      titleInput.dispatchEvent(inputEvent);
      
      // Fast-forward time
      jest.advanceTimersByTime(300);
      
      // Valid input
      titleInput.value = 'Valid Title';
      inputEvent = new dom.window.Event('input', { bubbles: true });
      titleInput.dispatchEvent(inputEvent);
      
      // Fast-forward time again
      jest.advanceTimersByTime(300);
      
      const errorElement = container.querySelector('#title-error');
      expect(errorElement.textContent).toBe('');
      
      jest.useRealTimers();
    });
  });
});

