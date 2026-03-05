/**
 * Task Edit Component
 * 
 * Renders the form for editing existing tasks with validation
 */

import { validateTaskInput } from '../utils/validators.js';

export class TaskEditComponent {
  /**
   * Create task edit component
   * @param {HTMLElement} container - Container element
   * @param {TaskService} taskService - Task service instance
   */
  constructor(container, taskService) {
    this.container = container;
    this.taskService = taskService;
    this.currentTask = null;
    this.form = null;
    this.titleInput = null;
    this.descriptionInput = null;
    this.submitButton = null;
    this.cancelButton = null;
  }

  /**
   * Render edit form
   * @param {Object} task - Task object to edit
   */
  render(task) {
    this.currentTask = task;
    
    this.container.innerHTML = `
      <div class="task-edit" role="dialog" aria-labelledby="edit-title" aria-modal="true">
        <div class="task-edit__overlay"></div>
        <div class="task-edit__content">
          <h2 id="edit-title" class="task-edit__heading">编辑任务</h2>
          
          <form class="task-edit__form" id="task-edit-form">
            <div class="task-edit__field">
              <label for="edit-task-title" class="task-edit__label">
                任务标题 <span class="task-edit__required" aria-label="必填">*</span>
              </label>
              <input
                type="text"
                id="edit-task-title"
                class="task-edit__input"
                placeholder="输入任务标题"
                aria-required="true"
                aria-invalid="false"
                maxlength="200"
              />
              <div class="task-edit__char-count" aria-live="polite">
                <span id="title-char-count">${task.title.length}</span>/200
              </div>
              <div class="task-edit__error" id="edit-title-error" role="alert" aria-live="polite"></div>
            </div>

            <div class="task-edit__field">
              <label for="edit-task-description" class="task-edit__label">
                任务描述
              </label>
              <textarea
                id="edit-task-description"
                class="task-edit__textarea"
                placeholder="输入任务描述（可选）"
                rows="4"
                maxlength="1000"
              ></textarea>
              <div class="task-edit__char-count" aria-live="polite">
                <span id="description-char-count">${task.description.length}</span>/1000
              </div>
              <div class="task-edit__error" id="edit-description-error" role="alert" aria-live="polite"></div>
            </div>

            <div class="task-edit__actions">
              <button type="button" class="task-edit__cancel" id="edit-cancel-btn" aria-label="取消编辑">
                取消
              </button>
              <button type="submit" class="task-edit__submit" aria-label="保存任务修改">
                <span class="task-edit__submit-text">保存</span>
                <span class="task-edit__submit-loading" style="display: none;">保存中...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Get references to form elements
    this.form = this.container.querySelector('#task-edit-form');
    this.titleInput = this.container.querySelector('#edit-task-title');
    this.descriptionInput = this.container.querySelector('#edit-task-description');
    this.submitButton = this.container.querySelector('.task-edit__submit');
    this.cancelButton = this.container.querySelector('#edit-cancel-btn');

    // Set values programmatically to avoid HTML escaping issues
    this.titleInput.value = task.title;
    this.descriptionInput.value = task.description;

    // Bind event handlers
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.cancelButton.addEventListener('click', () => this.handleCancel());
    
    // Real-time character count
    this.titleInput.addEventListener('input', () => this.updateCharCount('title'));
    this.descriptionInput.addEventListener('input', () => this.updateCharCount('description'));
    
    // Real-time validation
    this.titleInput.addEventListener('input', () => this.validateField('title'));
    this.descriptionInput.addEventListener('input', () => this.validateField('description'));
    
    // Keyboard support: Escape key to cancel
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleCancel();
      }
    });
    
    // Close on overlay click
    const overlay = this.container.querySelector('.task-edit__overlay');
    overlay.addEventListener('click', () => this.handleCancel());
  }

  /**
   * Show edit form
   * @param {Object} task - Task to edit
   */
  show(task) {
    this.render(task);
    this.container.style.display = 'block';
    
    // Auto-focus on title input
    setTimeout(() => {
      this.titleInput.focus();
      // Move cursor to end of text
      this.titleInput.setSelectionRange(this.titleInput.value.length, this.titleInput.value.length);
    }, 0);
  }

  /**
   * Hide edit form
   */
  hide() {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
    this.currentTask = null;
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleSubmit(event) {
    event.preventDefault();

    const title = this.titleInput.value;
    const description = this.descriptionInput.value;

    // Validate input
    const validation = validateTaskInput(title, description);
    
    if (!validation.valid) {
      // Show all validation errors
      if (validation.errors.title) {
        this.showValidationError('title', validation.errors.title);
      }
      if (validation.errors.description) {
        this.showValidationError('description', validation.errors.description);
      }
      return;
    }

    // Clear any existing errors
    this.clearValidationError('title');
    this.clearValidationError('description');

    // Set submitting state
    this.setSubmitting(true);

    try {
      // Update task through service
      await this.taskService.updateTask(this.currentTask.id, { title, description });
      
      // Hide form on success
      this.hide();
    } catch (error) {
      // Show error message
      this.showValidationError('title', error.message || '更新任务失败，请重试');
    } finally {
      // Reset submitting state
      this.setSubmitting(false);
    }
  }

  /**
   * Handle cancel operation
   */
  handleCancel() {
    this.hide();
  }

  /**
   * Validate input field
   * @param {string} field - Field name ('title' or 'description')
   * @returns {boolean} Whether the field is valid
   */
  validateField(field) {
    const title = this.titleInput.value;
    const description = this.descriptionInput.value;
    const validation = validateTaskInput(title, description);

    if (field === 'title') {
      if (validation.errors.title) {
        this.showValidationError('title', validation.errors.title);
        return false;
      } else {
        this.clearValidationError('title');
        return true;
      }
    } else if (field === 'description') {
      if (validation.errors.description) {
        this.showValidationError('description', validation.errors.description);
        return false;
      } else {
        this.clearValidationError('description');
        return true;
      }
    }

    return validation.valid;
  }

  /**
   * Update character count display
   * @param {string} field - Field name ('title' or 'description')
   */
  updateCharCount(field) {
    const input = field === 'title' ? this.titleInput : this.descriptionInput;
    const countElement = this.container.querySelector(`#${field}-char-count`);
    
    if (countElement && input) {
      countElement.textContent = input.value.length;
    }
  }

  /**
   * Show validation error
   * @param {string} field - Field name
   * @param {string} message - Error message
   */
  showValidationError(field, message) {
    const errorElement = this.container.querySelector(`#edit-${field}-error`);
    const inputElement = field === 'title' ? this.titleInput : this.descriptionInput;

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'true');
      inputElement.classList.add('task-edit__input--error');
    }
  }

  /**
   * Clear validation error
   * @param {string} field - Field name
   */
  clearValidationError(field) {
    const errorElement = this.container.querySelector(`#edit-${field}-error`);
    const inputElement = field === 'title' ? this.titleInput : this.descriptionInput;

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'false');
      inputElement.classList.remove('task-edit__input--error');
    }
  }

  /**
   * Set submitting state
   * @param {boolean} submitting - Whether form is submitting
   */
  setSubmitting(submitting) {
    const submitText = this.container.querySelector('.task-edit__submit-text');
    const submitLoading = this.container.querySelector('.task-edit__submit-loading');

    if (submitting) {
      this.submitButton.disabled = true;
      this.submitButton.setAttribute('aria-label', '正在保存任务，请稍候');
      this.submitButton.setAttribute('aria-busy', 'true');
      this.cancelButton.disabled = true;
      this.titleInput.disabled = true;
      this.descriptionInput.disabled = true;
      
      if (submitText) submitText.style.display = 'none';
      if (submitLoading) submitLoading.style.display = 'inline';
    } else {
      this.submitButton.disabled = false;
      this.submitButton.setAttribute('aria-label', '保存任务修改');
      this.submitButton.setAttribute('aria-busy', 'false');
      this.cancelButton.disabled = false;
      this.titleInput.disabled = false;
      this.descriptionInput.disabled = false;
      
      if (submitText) submitText.style.display = 'inline';
      if (submitLoading) submitLoading.style.display = 'none';
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
