/**
 * Task List Component
 * 
 * Renders the list of tasks with different states (loading, empty, error, tasks)
 */

import { TaskItemComponent } from './task-item.js';
import { DOMBatcher } from '../utils/performance.js';

export class TaskListComponent {
  constructor(container, taskService) {
    this.container = container;
    this.taskService = taskService;
    this.domBatcher = new DOMBatcher();
  }

  /**
   * Render task list with completed and uncompleted sections
   * @param {Array} tasks - Array of task objects
   */
  render(tasks) {
    // Use DOM batcher to optimize rendering
    this.domBatcher.schedule(() => {
      // Clear container
      this.container.innerHTML = '';

      // Separate completed and uncompleted tasks
      const uncompletedTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed);

      // Create document fragment for batch insertion using container's document
      const doc = this.container.ownerDocument || document;
      const fragment = doc.createDocumentFragment();

      // Create uncompleted tasks section
      if (uncompletedTasks.length > 0) {
        const uncompletedSection = this._createTaskSection(
          'active',
          `待办任务 (${uncompletedTasks.length})`,
          '待办任务列表',
          uncompletedTasks,
        );
        fragment.appendChild(uncompletedSection);
      }

      // Create completed tasks section
      if (completedTasks.length > 0) {
        const completedSection = this._createTaskSection(
          'completed',
          `已完成 (${completedTasks.length})`,
          '已完成任务列表',
          completedTasks,
        );
        fragment.appendChild(completedSection);
      }

      // Append all at once
      this.container.appendChild(fragment);
    });
  }

  /**
   * Create a task section (helper method)
   * @param {string} type - Section type ('active' or 'completed')
   * @param {string} headerText - Header text
   * @param {string} ariaLabel - ARIA label for the list
   * @param {Array} tasks - Tasks to render
   * @returns {HTMLElement} Section element
   * @private
   */
  _createTaskSection(type, headerText, ariaLabel, tasks) {
    const doc = this.container.ownerDocument || document;
    const section = doc.createElement('div');
    section.className = `task-list__section task-list__section--${type}`;
    
    const header = doc.createElement('h2');
    header.className = 'task-list__header';
    header.textContent = headerText;
    section.appendChild(header);

    const list = doc.createElement('div');
    list.className = 'task-list__items';
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', ariaLabel);

    // Create all task items and append to fragment
    const listFragment = doc.createDocumentFragment();
    tasks.forEach(task => {
      const taskItem = TaskItemComponent.render(task, {
        onToggle: (id) => this.handleToggle(id),
        onDelete: (id) => this.handleDelete(id),
        onEdit: (id) => this.handleEdit(id),
      }, doc);
      taskItem.setAttribute('role', 'listitem');
      listFragment.appendChild(taskItem);
    });

    list.appendChild(listFragment);
    section.appendChild(list);
    
    return section;
  }

  /**
   * Render empty state when no tasks exist
   */
  renderEmptyState() {
    this.container.innerHTML = '';

    const doc = this.container.ownerDocument || document;
    const emptyState = doc.createElement('div');
    emptyState.className = 'task-list__empty';
    emptyState.setAttribute('role', 'status');
    emptyState.setAttribute('aria-live', 'polite');

    const icon = doc.createElement('div');
    icon.className = 'task-list__empty-icon';
    icon.textContent = '📝';

    const message = doc.createElement('p');
    message.className = 'task-list__empty-message';
    message.textContent = '还没有任务，创建第一个任务开始吧！';

    emptyState.appendChild(icon);
    emptyState.appendChild(message);
    this.container.appendChild(emptyState);
  }

  /**
   * Render loading state
   */
  renderLoading() {
    this.container.innerHTML = '';

    const doc = this.container.ownerDocument || document;
    const loadingState = doc.createElement('div');
    loadingState.className = 'task-list__loading';
    loadingState.setAttribute('role', 'status');
    loadingState.setAttribute('aria-live', 'polite');
    loadingState.setAttribute('aria-label', '正在加载任务');

    const spinner = doc.createElement('div');
    spinner.className = 'task-list__spinner';

    const message = doc.createElement('p');
    message.className = 'task-list__loading-message';
    message.textContent = '加载中...';

    loadingState.appendChild(spinner);
    loadingState.appendChild(message);
    this.container.appendChild(loadingState);
  }

  /**
   * Render error state
   * @param {string} message - Error message to display
   */
  renderError(message) {
    this.container.innerHTML = '';

    const doc = this.container.ownerDocument || document;
    const errorState = doc.createElement('div');
    errorState.className = 'task-list__error';
    errorState.setAttribute('role', 'alert');
    errorState.setAttribute('aria-live', 'assertive');

    const icon = doc.createElement('div');
    icon.className = 'task-list__error-icon';
    icon.textContent = '⚠️';

    const errorMessage = doc.createElement('p');
    errorMessage.className = 'task-list__error-message';
    errorMessage.textContent = message || '加载任务失败，请稍后重试';

    errorState.appendChild(icon);
    errorState.appendChild(errorMessage);
    this.container.appendChild(errorState);
  }

  /**
   * Handle task toggle event
   * @param {number} id - Task ID
   * @private
   */
  handleToggle(id) {
    // This will be called by UIController through event delegation
    // For now, we'll emit a custom event that UIController can listen to
    const event = new this.container.ownerDocument.defaultView.CustomEvent('task-toggle', { 
      detail: { id },
      bubbles: true,
      cancelable: true,
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Handle task delete event
   * @param {number} id - Task ID
   * @private
   */
  handleDelete(id) {
    // This will be called by UIController through event delegation
    // For now, we'll emit a custom event that UIController can listen to
    const event = new this.container.ownerDocument.defaultView.CustomEvent('task-delete', { 
      detail: { id },
      bubbles: true,
      cancelable: true,
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Handle task edit event
   * @param {number} id - Task ID
   * @private
   */
  handleEdit(id) {
    // Emit a custom event that UIController can listen to
    const event = new this.container.ownerDocument.defaultView.CustomEvent('task-edit', { 
      detail: { id },
      bubbles: true,
      cancelable: true,
    });
    this.container.dispatchEvent(event);
  }
}
