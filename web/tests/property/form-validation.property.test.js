/**
 * Form Validation Property-Based Tests
 * 
 * Tests Properties 7, 16, 19
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { TaskFormComponent } from '../../js/components/task-form.js';
import { createMockTaskService } from '../helpers/mocks.js';
import { whitespaceStringGenerator, createTaskDataGenerator } from '../helpers/generators.js';

// Setup DOM environment
let dom;
let document;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="form-container"></div></body></html>');
  document = dom.window.document;
  global.document = document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
});

describe('Form Validation Properties', () => {
  describe('Property 16: Validation Error Field Association', () => {
    /**
     * **Validates: Requirements 2.5, 6.5**
     * 
     * For any validation error, the error message should be displayed near 
     * the relevant form field
     */
    test('property: validation errors are displayed near the relevant form field', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('title', 'description'),
          fc.string({ minLength: 1, maxLength: 100 }),
          (field, errorMessage) => {
            const container = document.getElementById('form-container');
            const taskService = createMockTaskService();
            const component = new TaskFormComponent(container, taskService);
            
            component.render();
            component.showValidationError(field, errorMessage);
            
            // Check that error element exists and is associated with the field
            const errorElement = container.querySelector(`#${field}-error`);
            expect(errorElement).toBeTruthy();
            expect(errorElement.textContent).toBe(errorMessage);
            expect(errorElement.style.display).toBe('block');
            
            // Check that the input field has aria-invalid attribute
            const inputElement = field === 'title' 
              ? container.querySelector('#task-title')
              : container.querySelector('#task-description');
            expect(inputElement.getAttribute('aria-invalid')).toBe('true');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: error messages are cleared when field becomes valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('title', 'description'),
          fc.string({ minLength: 1, maxLength: 100 }),
          (field, errorMessage) => {
            const container = document.getElementById('form-container');
            const taskService = createMockTaskService();
            const component = new TaskFormComponent(container, taskService);
            
            component.render();
            
            // Show error first
            component.showValidationError(field, errorMessage);
            
            // Then clear it
            component.clearValidationError(field);
            
            // Check that error is cleared
            const errorElement = container.querySelector(`#${field}-error`);
            expect(errorElement.textContent).toBe('');
            expect(errorElement.style.display).toBe('none');
            
            // Check that aria-invalid is set to false
            const inputElement = field === 'title' 
              ? container.querySelector('#task-title')
              : container.querySelector('#task-description');
            expect(inputElement.getAttribute('aria-invalid')).toBe('false');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 19: Real-time Form Validation', () => {
    /**
     * **Validates: Requirements 2.5, 6.5, 8.3**
     * 
     * For any user input in the task form, validation feedback should be 
     * provided as the user types (after debounce delay)
     */
    test('property: validation feedback is provided as user types in title field', () => {
      jest.useFakeTimers();
      
      fc.assert(
        fc.property(
          whitespaceStringGenerator(),
          (invalidTitle) => {
            const container = document.getElementById('form-container');
            const taskService = createMockTaskService();
            const component = new TaskFormComponent(container, taskService);
            
            component.render();
            
            const titleInput = container.querySelector('#task-title');
            titleInput.value = invalidTitle;
            
            // Trigger input event (simulating user typing)
            const inputEvent = new dom.window.Event('input', { bubbles: true });
            titleInput.dispatchEvent(inputEvent);
            
            // Fast-forward time to trigger debounced validation
            jest.advanceTimersByTime(300);
            
            // Check that validation error is shown
            const errorElement = container.querySelector('#title-error');
            expect(errorElement.textContent).toBeTruthy();
            expect(errorElement.textContent.length).toBeGreaterThan(0);
            expect(titleInput.getAttribute('aria-invalid')).toBe('true');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
      
      jest.useRealTimers();
    });

    test('property: validation feedback is provided for valid title input', () => {
      jest.useFakeTimers();
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          (validTitle) => {
            const container = document.getElementById('form-container');
            const taskService = createMockTaskService();
            const component = new TaskFormComponent(container, taskService);
            
            component.render();
            
            const titleInput = container.querySelector('#task-title');
            titleInput.value = validTitle;
            
            // Trigger input event
            const inputEvent = new dom.window.Event('input', { bubbles: true });
            titleInput.dispatchEvent(inputEvent);
            
            // Fast-forward time to trigger debounced validation
            jest.advanceTimersByTime(300);
            
            // Check that no validation error is shown
            const errorElement = container.querySelector('#title-error');
            expect(errorElement.textContent).toBe('');
            expect(titleInput.getAttribute('aria-invalid')).toBe('false');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
      
      jest.useRealTimers();
    });

    test('property: validation feedback is provided for description length', () => {
      jest.useFakeTimers();
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1001, maxLength: 1500 }),
          (longDescription) => {
            const container = document.getElementById('form-container');
            const taskService = createMockTaskService();
            const component = new TaskFormComponent(container, taskService);
            
            component.render();
            
            const descriptionInput = container.querySelector('#task-description');
            descriptionInput.value = longDescription;
            
            // Trigger input event
            const inputEvent = new dom.window.Event('input', { bubbles: true });
            descriptionInput.dispatchEvent(inputEvent);
            
            // Fast-forward time to trigger debounced validation
            jest.advanceTimersByTime(300);
            
            // Check that validation error is shown
            const errorElement = container.querySelector('#description-error');
            expect(errorElement.textContent).toBeTruthy();
            expect(errorElement.textContent.length).toBeGreaterThan(0);
            expect(descriptionInput.getAttribute('aria-invalid')).toBe('true');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
      
      jest.useRealTimers();
    });

    test('property: real-time validation clears errors when input becomes valid', () => {
      jest.useFakeTimers();
      
      fc.assert(
        fc.property(
          whitespaceStringGenerator(),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          (invalidTitle, validTitle) => {
            const container = document.getElementById('form-container');
            const taskService = createMockTaskService();
            const component = new TaskFormComponent(container, taskService);
            
            component.render();
            
            const titleInput = container.querySelector('#task-title');
            
            // First, enter invalid input
            titleInput.value = invalidTitle;
            let inputEvent = new dom.window.Event('input', { bubbles: true });
            titleInput.dispatchEvent(inputEvent);
            
            // Fast-forward time
            jest.advanceTimersByTime(300);
            
            // Verify error is shown
            let errorElement = container.querySelector('#title-error');
            expect(errorElement.textContent).toBeTruthy();
            
            // Then, enter valid input
            titleInput.value = validTitle;
            inputEvent = new dom.window.Event('input', { bubbles: true });
            titleInput.dispatchEvent(inputEvent);
            
            // Fast-forward time again
            jest.advanceTimersByTime(300);
            
            // Verify error is cleared
            errorElement = container.querySelector('#title-error');
            expect(errorElement.textContent).toBe('');
            expect(titleInput.getAttribute('aria-invalid')).toBe('false');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
      
      jest.useRealTimers();
    });
  });
});

