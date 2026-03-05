/**
 * Task Item Component
 * 
 * Renders a single task item with toggle and delete functionality
 */

import { formatDate } from '../utils/date-formatter.js';

export class TaskItemComponent {
  /**
   * Render a task item
   * @param {Object} task - Task object with id, title, description, completed, created_at
   * @param {Object} handlers - Event handlers { onToggle, onDelete, onEdit }
   * @param {Document} doc - Document object to use for creating elements (optional, defaults to global document)
   * @returns {HTMLElement} Task item DOM element
   */
  static render(task, handlers, doc = document) {
    const item = doc.createElement('div');
    item.className = `task-item ${task.completed ? 'task-item--completed' : 'task-item--active'}`;
    item.dataset.taskId = task.id;
    
    // Checkbox for completion status
    const checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-item__checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `标记任务"${task.title}"为${task.completed ? '未完成' : '已完成'}`);
    checkbox.addEventListener('change', () => handlers.onToggle(task.id));
    
    // Content container
    const content = doc.createElement('div');
    content.className = 'task-item__content';
    
    // Title
    const title = doc.createElement('h3');
    title.className = 'task-item__title';
    title.textContent = task.title;
    
    // Description
    const description = doc.createElement('p');
    description.className = 'task-item__description';
    description.textContent = task.description;
    
    // Timestamp
    const timestamp = doc.createElement('time');
    timestamp.className = 'task-item__timestamp';
    timestamp.dateTime = task.created_at;
    timestamp.textContent = this.formatDate(task.created_at);
    
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(timestamp);
    
    // Actions container
    const actions = doc.createElement('div');
    actions.className = 'task-item__actions';
    
    // Edit button
    const editBtn = doc.createElement('button');
    editBtn.className = 'task-item__edit';
    editBtn.textContent = '编辑';
    editBtn.setAttribute('aria-label', `编辑任务"${task.title}"`);
    if (handlers.onEdit) {
      editBtn.addEventListener('click', () => handlers.onEdit(task.id));
    }
    
    // Delete button
    const deleteBtn = doc.createElement('button');
    deleteBtn.className = 'task-item__delete';
    deleteBtn.textContent = '删除';
    deleteBtn.setAttribute('aria-label', `删除任务"${task.title}"`);
    deleteBtn.addEventListener('click', () => handlers.onDelete(task.id));
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    // Assemble the item
    item.appendChild(checkbox);
    item.appendChild(content);
    item.appendChild(actions);
    
    return item;
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO 8601 date string
   * @returns {string} Formatted date string
   */
  static formatDate(dateString) {
    return formatDate(dateString);
  }
}
