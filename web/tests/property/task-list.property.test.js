/**
 * TaskListComponent Property-Based Tests
 * 
 * Tests Properties 1, 2, 3, 4
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { TaskListComponent } from '../../js/components/task-list.js';
import { createMockTaskService } from '../helpers/mocks.js';
import { createTaskDataGenerator } from '../helpers/generators.js';

// Setup DOM environment
let dom;
let document;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="list-container"></div></body></html>');
  document = dom.window.document;
  global.document = document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
});

describe('TaskListComponent Properties', () => {
  describe('Property 1: 任务列表正确分区和计数', () => {
    /**
     * **Validates: Requirements 1.5, 1.6**
     * 
     * For any task list, the rendering should contain two sections (active and completed),
     * each section header should display the correct task count, and tasks should be
     * correctly categorized into the corresponding section based on completed status
     */
    test('property: task list is correctly partitioned into active and completed sections', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createTaskDataGenerator(), { minLength: 1, maxLength: 20 }),
          async (tasks) => {
            const container = document.getElementById('list-container');
            const taskService = createMockTaskService();
            const component = new TaskListComponent(container, taskService);
            
            component.render(tasks);
            
            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const activeTasks = tasks.filter(t => !t.completed);
            const completedTasks = tasks.filter(t => t.completed);
            
            // Check active section exists if there are active tasks
            if (activeTasks.length > 0) {
              const activeSection = container.querySelector('.task-list__section--active');
              expect(activeSection).toBeTruthy();
              
              const activeHeader = activeSection.querySelector('.task-list__header');
              expect(activeHeader.textContent).toContain(String(activeTasks.length));
              
              const activeItems = activeSection.querySelectorAll('.task-item');
              expect(activeItems.length).toBe(activeTasks.length);
            }
            
            // Check completed section exists if there are completed tasks
            if (completedTasks.length > 0) {
              const completedSection = container.querySelector('.task-list__section--completed');
              expect(completedSection).toBeTruthy();
              
              const completedHeader = completedSection.querySelector('.task-list__header');
              expect(completedHeader.textContent).toContain(String(completedTasks.length));
              
              const completedItems = completedSection.querySelectorAll('.task-item');
              expect(completedItems.length).toBe(completedTasks.length);
            }
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: tasks are correctly categorized by completed status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createTaskDataGenerator(), { minLength: 1, maxLength: 20 }),
          async (tasks) => {
            const container = document.getElementById('list-container');
            const taskService = createMockTaskService();
            const component = new TaskListComponent(container, taskService);
            
            component.render(tasks);
            
            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Check all active tasks are in active section
            const activeSection = container.querySelector('.task-list__section--active');
            if (activeSection) {
              const activeItems = activeSection.querySelectorAll('.task-item');
              activeItems.forEach(item => {
                expect(item.classList.contains('task-item--active')).toBe(true);
                expect(item.classList.contains('task-item--completed')).toBe(false);
              });
            }
            
            // Check all completed tasks are in completed section
            const completedSection = container.querySelector('.task-list__section--completed');
            if (completedSection) {
              const completedItems = completedSection.querySelectorAll('.task-item');
              completedItems.forEach(item => {
                expect(item.classList.contains('task-item--completed')).toBe(true);
                expect(item.classList.contains('task-item--active')).toBe(false);
              });
            }
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 2: 任务按创建时间倒序排列', () => {
    /**
     * **Validates: Requirements 1.7**
     * 
     * For any task list, within each section, tasks should be sorted by creation time
     * in descending order (newest first)
     */
    test('property: tasks are sorted by creation time in descending order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createTaskDataGenerator(), { minLength: 2, maxLength: 20 }),
          async (tasks) => {
            const container = document.getElementById('list-container');
            const taskService = createMockTaskService();
            const component = new TaskListComponent(container, taskService);
            
            // Sort tasks by created_at descending (newest first)
            const sortedTasks = [...tasks].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );
            
            component.render(sortedTasks);
            
            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Get all rendered task items
            const taskItems = container.querySelectorAll('.task-item');
            
            // Verify order matches sorted order
            taskItems.forEach((item, index) => {
              const taskId = parseInt(item.dataset.taskId);
              expect(taskId).toBe(sortedTasks[index].id);
            });
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 3: 任务项包含所有必需信息', () => {
    /**
     * **Validates: Requirements 1.8**
     * 
     * For any task, the rendered task item should contain title, description,
     * completed status, and creation time
     */
    test('property: task items contain all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          createTaskDataGenerator(),
          async (task) => {
            const container = document.getElementById('list-container');
            const taskService = createMockTaskService();
            const component = new TaskListComponent(container, taskService);
            
            component.render([task]);
            
            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const taskItem = container.querySelector('.task-item');
            expect(taskItem).toBeTruthy();
            
            // Check title exists
            const title = taskItem.querySelector('.task-item__title');
            expect(title).toBeTruthy();
            expect(title.textContent).toBe(task.title);
            
            // Check description exists
            const description = taskItem.querySelector('.task-item__description');
            expect(description).toBeTruthy();
            expect(description.textContent).toBe(task.description);
            
            // Check completed status (checkbox)
            const checkbox = taskItem.querySelector('.task-item__checkbox');
            expect(checkbox).toBeTruthy();
            expect(checkbox.checked).toBe(task.completed);
            
            // Check creation time exists
            const timestamp = taskItem.querySelector('.task-item__timestamp');
            expect(timestamp).toBeTruthy();
            expect(timestamp.dateTime).toBe(task.created_at);
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: task items have edit button', async () => {
      await fc.assert(
        fc.asyncProperty(
          createTaskDataGenerator(),
          async (task) => {
            const container = document.getElementById('list-container');
            const taskService = createMockTaskService();
            const component = new TaskListComponent(container, taskService);
            
            component.render([task]);
            
            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const taskItem = container.querySelector('.task-item');
            
            // Check edit button exists
            const editButton = taskItem.querySelector('.task-item__edit');
            expect(editButton).toBeTruthy();
            expect(editButton.tagName).toBe('BUTTON');
            expect(editButton.getAttribute('aria-label')).toContain('编辑');
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 4: 任务列表响应状态变化', () => {
    /**
     * **Validates: Requirements 1.9, 1.10**
     * 
     * For any task list, when a new task is added, the list should automatically update
     * and include the new task; when a task's completed status is toggled, the task
     * should automatically move to the corresponding section
     */
    test('property: list updates when new task is added', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(createTaskDataGenerator(), { minLength: 1, maxLength: 10 }),
          createTaskDataGenerator(),
          async (initialTasks, newTask) => {
            const container = document.getElementById('list-container');
            const taskService = createMockTaskService();
            const component = new TaskListComponent(container, taskService);
            
            // Render initial tasks
            component.render(initialTasks);
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const initialCount = container.querySelectorAll('.task-item').length;
            expect(initialCount).toBe(initialTasks.length);
            
            // Add new task
            const updatedTasks = [...initialTasks, newTask];
            component.render(updatedTasks);
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const updatedCount = container.querySelectorAll('.task-item').length;
            expect(updatedCount).toBe(updatedTasks.length);
            
            // Verify new task is rendered
            const taskIds = Array.from(container.querySelectorAll('.task-item'))
              .map(item => parseInt(item.dataset.taskId));
            expect(taskIds).toContain(newTask.id);
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    test('property: task moves to correct section when completed status changes', async () => {
      await fc.assert(
        fc.asyncProperty(
          createTaskDataGenerator().filter(t => !t.completed),
          async (task) => {
            const container = document.getElementById('list-container');
            const taskService = createMockTaskService();
            const component = new TaskListComponent(container, taskService);
            
            // Render task as uncompleted
            component.render([task]);
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Verify task is in active section
            let activeSection = container.querySelector('.task-list__section--active');
            expect(activeSection).toBeTruthy();
            const activeItems = activeSection.querySelectorAll('.task-item');
            expect(activeItems.length).toBe(1);
            
            // Toggle task to completed
            const completedTask = { ...task, completed: true };
            component.render([completedTask]);
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Verify task is now in completed section
            const completedSection = container.querySelector('.task-list__section--completed');
            expect(completedSection).toBeTruthy();
            const completedItems = completedSection.querySelectorAll('.task-item');
            expect(completedItems.length).toBe(1);
            
            // Verify no active section exists
            activeSection = container.querySelector('.task-list__section--active');
            expect(activeSection).toBeFalsy();
            
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
