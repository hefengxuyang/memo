/**
 * Task Form Component
 * 
 * Renders the form for creating new tasks with validation
 */

import { validateTaskInput } from '../utils/validators.js';
import { debounce } from '../utils/performance.js';

export class TaskFormComponent {
  constructor(container, taskService) {
    this.container = container;
    this.taskService = taskService;
    this.titleInput = null;
    this.descriptionInput = null;
    this.submitButton = null;
    this.form = null;
    
    // Create debounced validation function (300ms delay)
    this.debouncedValidateTitle = debounce(() => this.validateField('title'), 300);
    this.debouncedValidateDescription = debounce(() => this.validateField('description'), 300);
  }

  render() {
    this.container.innerHTML = `
      <form class="task-form" id="task-form">
        <div class="task-form__field">
          <label for="task-title" class="task-form__label">
            任务标题 <span class="task-form__required" aria-label="必填">*</span>
          </label>
          <input
            type="text"
            id="task-title"
            class="task-form__input"
            placeholder="输入任务标题"
            aria-required="true"
            aria-invalid="false"
            maxlength="200"
          />
          <div class="task-form__error" id="title-error" role="alert" aria-live="polite"></div>
        </div>

        <div class="task-form__field">
          <label for="task-description" class="task-form__label">
            任务描述
          </label>
          <textarea
            id="task-description"
            class="task-form__textarea"
            placeholder="输入任务描述（可选）"
            rows="3"
            maxlength="1000"
          ></textarea>
          <div class="task-form__error" id="description-error" role="alert" aria-live="polite"></div>
        </div>

        <button type="submit" class="task-form__submit" aria-label="创建新任务">
          <span class="task-form__submit-text">添加任务</span>
          <span class="task-form__submit-loading" style="display: none;">创建中...</span>
        </button>
      </form>
    `;

    // Get references to form elements
    this.form = this.container.querySelector('#task-form');
    this.titleInput = this.container.querySelector('#task-title');
    this.descriptionInput = this.container.querySelector('#task-description');
    this.submitButton = this.container.querySelector('.task-form__submit');

    // Bind event handlers
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation with debouncing
    this.titleInput.addEventListener('input', () => this.debouncedValidateTitle());
    this.descriptionInput.addEventListener('input', () => this.debouncedValidateDescription());
    
    // Keyboard navigation: Enter key submits form
    this.titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.form.requestSubmit();
      }
    });
  }

  validateField(field) {
    const title = this.titleInput.value;
    const description = this.descriptionInput.value;
    const validation = validateTaskInput(title, description);

    if (field === 'title') {
      if (validation.errors.title) {
        this.showValidationError('title', validation.errors.title);
      } else {
        this.clearValidationError('title');
      }
    } else if (field === 'description') {
      if (validation.errors.description) {
        this.showValidationError('description', validation.errors.description);
      } else {
        this.clearValidationError('description');
      }
    }

    return validation.valid;
  }

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
      // Create task through service
      await this.taskService.createTask(title, description);
      
      // Clear form on success
      this.clearForm();
    } catch (error) {
      // Show error message
      this.showValidationError('title', error.message || '创建任务失败，请重试');
    } finally {
      // Reset submitting state
      this.setSubmitting(false);
    }
  }

  showValidationError(field, message) {
    const errorElement = this.container.querySelector(`#${field}-error`);
    const inputElement = field === 'title' ? this.titleInput : this.descriptionInput;

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'true');
      inputElement.classList.add('task-form__input--error');
    }
  }

  clearValidationError(field) {
    const errorElement = this.container.querySelector(`#${field}-error`);
    const inputElement = field === 'title' ? this.titleInput : this.descriptionInput;

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    if (inputElement) {
      inputElement.setAttribute('aria-invalid', 'false');
      inputElement.classList.remove('task-form__input--error');
    }
  }

  clearForm() {
    if (this.titleInput) {
      this.titleInput.value = '';
    }
    if (this.descriptionInput) {
      this.descriptionInput.value = '';
    }
    
    // Clear any validation errors
    this.clearValidationError('title');
    this.clearValidationError('description');
  }

  setSubmitting(submitting) {
    const submitText = this.container.querySelector('.task-form__submit-text');
    const submitLoading = this.container.querySelector('.task-form__submit-loading');

    if (submitting) {
      this.submitButton.disabled = true;
      this.submitButton.setAttribute('aria-label', '正在创建任务，请稍候');
      this.submitButton.setAttribute('aria-busy', 'true');
      this.titleInput.disabled = true;
      this.descriptionInput.disabled = true;
      
      if (submitText) submitText.style.display = 'none';
      if (submitLoading) submitLoading.style.display = 'inline';
    } else {
      this.submitButton.disabled = false;
      this.submitButton.setAttribute('aria-label', '创建新任务');
      this.submitButton.setAttribute('aria-busy', 'false');
      this.titleInput.disabled = false;
      this.descriptionInput.disabled = false;
      
      if (submitText) submitText.style.display = 'inline';
      if (submitLoading) submitLoading.style.display = 'none';
    }
  }
}
