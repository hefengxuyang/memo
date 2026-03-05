/**
 * TaskItemComponent Unit Tests
 * 
 * Tests task item rendering, date formatting, completion/uncompleted styles, and event handlers
 * Requirements: 1.2, 1.3
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { TaskItemComponent } from '../../../js/components/task-item.js';
import { createMockTask } from '../../helpers/factories.js';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

describe('TaskItemComponent', () => {
  let handlers;

  beforeEach(() => {
    handlers = {
      onToggle: jest.fn(),
      onDelete: jest.fn(),
    };
  });

  describe('Task Item Rendering', () => {
    test('should render task with all required elements', () => {
      const task = createMockTask({
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        completed: false,
        created_at: '2024-01-15T10:30:00Z',
      });

      const element = TaskItemComponent.render(task, handlers);

      expect(element).toBeTruthy();
      expect(element.className).toContain('task-item');
      expect(element.dataset.taskId).toBe('1');
    });

    test('should render task title', () => {
      const task = createMockTask({ title: 'My Important Task' });

      const element = TaskItemComponent.render(task, handlers);
      const title = element.querySelector('.task-item__title');

      expect(title).toBeTruthy();
      expect(title.textContent).toBe('My Important Task');
    });

    test('should render task description', () => {
      const task = createMockTask({ description: 'This is a detailed description' });

      const element = TaskItemComponent.render(task, handlers);
      const description = element.querySelector('.task-item__description');

      expect(description).toBeTruthy();
      expect(description.textContent).toBe('This is a detailed description');
    });

    test('should render empty description', () => {
      const task = createMockTask({ description: '' });

      const element = TaskItemComponent.render(task, handlers);
      const description = element.querySelector('.task-item__description');

      expect(description).toBeTruthy();
      expect(description.textContent).toBe('');
    });

    test('should render checkbox for completion status', () => {
      const task = createMockTask({ completed: false });

      const element = TaskItemComponent.render(task, handlers);
      const checkbox = element.querySelector('.task-item__checkbox');

      expect(checkbox).toBeTruthy();
      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.checked).toBe(false);
    });

    test('should render checked checkbox for completed task', () => {
      const task = createMockTask({ completed: true });

      const element = TaskItemComponent.render(task, handlers);
      const checkbox = element.querySelector('.task-item__checkbox');

      expect(checkbox.checked).toBe(true);
    });

    test('should render timestamp with datetime attribute', () => {
      const task = createMockTask({ created_at: '2024-01-15T10:30:00Z' });

      const element = TaskItemComponent.render(task, handlers);
      const timestamp = element.querySelector('.task-item__timestamp');

      expect(timestamp).toBeTruthy();
      expect(timestamp.tagName).toBe('TIME');
      expect(timestamp.dateTime).toBe('2024-01-15T10:30:00Z');
    });

    test('should render delete button', () => {
      const task = createMockTask();

      const element = TaskItemComponent.render(task, handlers);
      const deleteBtn = element.querySelector('.task-item__delete');

      expect(deleteBtn).toBeTruthy();
      expect(deleteBtn.tagName).toBe('BUTTON');
      expect(deleteBtn.textContent).toBe('×');
    });

    test('should render task with special characters in title', () => {
      const task = createMockTask({ title: 'Task with <special> & "characters"' });

      const element = TaskItemComponent.render(task, handlers);
      const title = element.querySelector('.task-item__title');

      expect(title.textContent).toBe('Task with <special> & "characters"');
    });

    test('should render task with long title', () => {
      const longTitle = 'A'.repeat(200);
      const task = createMockTask({ title: longTitle });

      const element = TaskItemComponent.render(task, handlers);
      const title = element.querySelector('.task-item__title');

      expect(title.textContent).toBe(longTitle);
    });

    test('should render task with long description', () => {
      const longDescription = 'B'.repeat(1000);
      const task = createMockTask({ description: longDescription });

      const element = TaskItemComponent.render(task, handlers);
      const description = element.querySelector('.task-item__description');

      expect(description.textContent).toBe(longDescription);
    });

    test('should render multiple tasks with different IDs', () => {
      const task1 = createMockTask({ id: 1, title: 'Task 1' });
      const task2 = createMockTask({ id: 2, title: 'Task 2' });

      const element1 = TaskItemComponent.render(task1, handlers);
      const element2 = TaskItemComponent.render(task2, handlers);

      expect(element1.dataset.taskId).toBe('1');
      expect(element2.dataset.taskId).toBe('2');
    });
  });

  describe('Date Formatting', () => {
    test('should format date correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = TaskItemComponent.formatDate(dateString);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    test('should format date with correct year', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = TaskItemComponent.formatDate(dateString);

      expect(formatted).toContain('2024');
    });

    test('should format date with padded month', () => {
      const dateString = '2024-01-05T10:30:00Z';
      const formatted = TaskItemComponent.formatDate(dateString);

      expect(formatted).toMatch(/2024-01-/);
    });

    test('should format date with padded day', () => {
      const dateString = '2024-01-05T10:30:00Z';
      const formatted = TaskItemComponent.formatDate(dateString);

      expect(formatted).toMatch(/-05 /);
    });

    test('should format time with padded hours', () => {
      const dateString = '2024-01-15T09:30:00Z';
      const formatted = TaskItemComponent.formatDate(dateString);

      expect(formatted).toMatch(/\d{2}:\d{2}$/);
    });

    test('should format time with padded minutes', () => {
      const dateString = '2024-01-15T10:05:00Z';
      const formatted = TaskItemComponent.formatDate(dateString);

      expect(formatted).toMatch(/:\d{2}$/);
    });

    test('should handle invalid date string', () => {
      const invalidDate = 'invalid-date';
      const formatted = TaskItemComponent.formatDate(invalidDate);

      expect(formatted).toBe('无效日期');
    });

    test('should handle empty date string', () => {
      const formatted = TaskItemComponent.formatDate('');

      expect(formatted).toBe('无效日期');
    });

    test('should render formatted date in timestamp element', () => {
      const task = createMockTask({ created_at: '2024-01-15T10:30:00Z' });

      const element = TaskItemComponent.render(task, handlers);
      const timestamp = element.querySelector('.task-item__timestamp');

      expect(timestamp.textContent).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });
  });

  describe('Completion/Uncompleted Styles', () => {
    test('should apply active class for uncompleted task', () => {
      const task = createMockTask({ completed: false });

      const element = TaskItemComponent.render(task, handlers);

      expect(element.classList.contains('task-item--active')).toBe(true);
      expect(element.classList.contains('task-item--completed')).toBe(false);
    });

    test('should apply completed class for completed task', () => {
      const task = createMockTask({ completed: true });

      const element = TaskItemComponent.render(task, handlers);

      expect(element.classList.contains('task-item--completed')).toBe(true);
      expect(element.classList.contains('task-item--active')).toBe(false);
    });

    test('should have base task-item class for all tasks', () => {
      const uncompletedTask = createMockTask({ completed: false });
      const completedTask = createMockTask({ completed: true });

      const element1 = TaskItemComponent.render(uncompletedTask, handlers);
      const element2 = TaskItemComponent.render(completedTask, handlers);

      expect(element1.classList.contains('task-item')).toBe(true);
      expect(element2.classList.contains('task-item')).toBe(true);
    });

    test('should not have both active and completed classes', () => {
      const task1 = createMockTask({ completed: false });
      const task2 = createMockTask({ completed: true });

      const element1 = TaskItemComponent.render(task1, handlers);
      const element2 = TaskItemComponent.render(task2, handlers);

      // Uncompleted task should not have completed class
      expect(element1.classList.contains('task-item--active')).toBe(true);
      expect(element1.classList.contains('task-item--completed')).toBe(false);

      // Completed task should not have active class
      expect(element2.classList.contains('task-item--completed')).toBe(true);
      expect(element2.classList.contains('task-item--active')).toBe(false);
    });
  });

  describe('Event Handler Binding', () => {
    test('should call onToggle handler when checkbox is changed', () => {
      const task = createMockTask({ id: 5, completed: false });

      const element = TaskItemComponent.render(task, handlers);
      const checkbox = element.querySelector('.task-item__checkbox');

      // Simulate checkbox change
      const event = document.createEvent('Event');
      event.initEvent('change', true, true);
      checkbox.dispatchEvent(event);

      expect(handlers.onToggle).toHaveBeenCalledTimes(1);
      expect(handlers.onToggle).toHaveBeenCalledWith(5);
    });

    test('should call onDelete handler when delete button is clicked', () => {
      const task = createMockTask({ id: 7, title: 'Task to delete' });

      const element = TaskItemComponent.render(task, handlers);
      const deleteBtn = element.querySelector('.task-item__delete');

      // Simulate button click
      const event = document.createEvent('Event');
      event.initEvent('click', true, true);
      deleteBtn.dispatchEvent(event);

      expect(handlers.onDelete).toHaveBeenCalledTimes(1);
      expect(handlers.onDelete).toHaveBeenCalledWith(7);
    });

    test('should pass correct task ID to onToggle', () => {
      const task = createMockTask({ id: 123 });

      const element = TaskItemComponent.render(task, handlers);
      const checkbox = element.querySelector('.task-item__checkbox');

      const event = document.createEvent('Event');
      event.initEvent('change', true, true);
      checkbox.dispatchEvent(event);

      expect(handlers.onToggle).toHaveBeenCalledWith(123);
    });

    test('should pass correct task ID to onDelete', () => {
      const task = createMockTask({ id: 456 });

      const element = TaskItemComponent.render(task, handlers);
      const deleteBtn = element.querySelector('.task-item__delete');

      const event = document.createEvent('Event');
      event.initEvent('click', true, true);
      deleteBtn.dispatchEvent(event);

      expect(handlers.onDelete).toHaveBeenCalledWith(456);
    });

    test('should not call handlers on render', () => {
      const task = createMockTask();

      TaskItemComponent.render(task, handlers);

      expect(handlers.onToggle).not.toHaveBeenCalled();
      expect(handlers.onDelete).not.toHaveBeenCalled();
    });

    test('should handle multiple checkbox changes', () => {
      const task = createMockTask({ id: 10 });

      const element = TaskItemComponent.render(task, handlers);
      const checkbox = element.querySelector('.task-item__checkbox');

      for (let i = 0; i < 3; i++) {
        const event = document.createEvent('Event');
        event.initEvent('change', true, true);
        checkbox.dispatchEvent(event);
      }

      expect(handlers.onToggle).toHaveBeenCalledTimes(3);
    });

    test('should handle multiple delete button clicks', () => {
      const task = createMockTask({ id: 11 });

      const element = TaskItemComponent.render(task, handlers);
      const deleteBtn = element.querySelector('.task-item__delete');

      for (let i = 0; i < 2; i++) {
        const event = document.createEvent('Event');
        event.initEvent('click', true, true);
        deleteBtn.dispatchEvent(event);
      }

      expect(handlers.onDelete).toHaveBeenCalledTimes(2);
    });

    test('should have aria-label on checkbox', () => {
      const task = createMockTask({ title: 'My Task', completed: false });

      const element = TaskItemComponent.render(task, handlers);
      const checkbox = element.querySelector('.task-item__checkbox');

      expect(checkbox.getAttribute('aria-label')).toContain('My Task');
      expect(checkbox.getAttribute('aria-label')).toContain('已完成');
    });

    test('should have aria-label on delete button', () => {
      const task = createMockTask({ title: 'Task to Remove' });

      const element = TaskItemComponent.render(task, handlers);
      const deleteBtn = element.querySelector('.task-item__delete');

      expect(deleteBtn.getAttribute('aria-label')).toContain('Task to Remove');
      expect(deleteBtn.getAttribute('aria-label')).toContain('删除');
    });

    test('should update aria-label based on completion status', () => {
      const uncompletedTask = createMockTask({ title: 'Task', completed: false });
      const completedTask = createMockTask({ title: 'Task', completed: true });

      const element1 = TaskItemComponent.render(uncompletedTask, handlers);
      const element2 = TaskItemComponent.render(completedTask, handlers);

      const checkbox1 = element1.querySelector('.task-item__checkbox');
      const checkbox2 = element2.querySelector('.task-item__checkbox');

      expect(checkbox1.getAttribute('aria-label')).toContain('已完成');
      expect(checkbox2.getAttribute('aria-label')).toContain('未完成');
    });
  });
});
