/**
 * UI Controller
 * 
 * Main controller that coordinates all components and services
 */

export class UIController {
  constructor(taskService, stateManager, components) {
    this.taskService = taskService;
    this.stateManager = stateManager;
    this.components = components;
    this.unsubscribe = null;
  }

  /**
   * Initialize the application
   * - Subscribe to state changes
   * - Load initial tasks
   * - Set up event listeners
   */
  async init() {
    try {
      // Subscribe to state changes
      this.unsubscribe = this.stateManager.subscribe((tasks) => {
        this.handleStateChange(tasks);
      });

      // Set up event listeners for task actions
      this._setupEventListeners();

      // Render initial loading state
      this.components.taskList.renderLoading();

      // Load initial tasks
      await this.taskService.loadTasks();
    } catch (error) {
      // Show error notification
      this.components.notification.showError(
        error.message || '加载任务失败，请刷新页面重试'
      );
      
      // Show error state in task list
      this.components.taskList.renderError(
        error.message || '加载任务失败，请刷新页面重试'
      );
    }
  }

  /**
   * Handle state changes and update UI
   * @param {Array} tasks - Updated tasks array
   */
  handleStateChange(tasks) {
    const isLoading = this.stateManager.isLoading();
    const error = this.stateManager.getError();

    // Show loading state
    if (isLoading) {
      this.components.taskList.renderLoading();
      return;
    }

    // Show error state
    if (error) {
      this.components.taskList.renderError(error);
      return;
    }

    // Show empty state or task list
    if (tasks.length === 0) {
      this.components.taskList.renderEmptyState();
    } else {
      this.components.taskList.render(tasks);
    }
  }

  /**
   * Handle task toggle event
   * @param {number} id - Task ID
   */
  async handleTaskToggle(id) {
    try {
      await this.taskService.toggleTaskStatus(id);
      // Success feedback
      this.components.notification.showSuccess('任务状态已更新');
    } catch (error) {
      // Error feedback
      this.components.notification.showError(
        error.message || '更新任务状态失败，请重试'
      );
    }
  }

  /**
   * Handle task delete event
   * @param {number} id - Task ID
   */
  async handleTaskDelete(id) {
    try {
      await this.taskService.deleteTask(id);
      // Success feedback
      this.components.notification.showSuccess('任务已删除');
    } catch (error) {
      // Error feedback
      this.components.notification.showError(
        error.message || '删除任务失败，请重试'
      );
    }
  }

  /**
   * Handle task create event
   * @param {string} title - Task title
   * @param {string} description - Task description
   */
  async handleTaskCreate(title, description) {
    try {
      await this.taskService.createTask(title, description);
      // Success feedback
      this.components.notification.showSuccess('任务创建成功');
    } catch (error) {
      // Error feedback
      this.components.notification.showError(
        error.message || '创建任务失败，请重试'
      );
      throw error; // Re-throw so form can handle it
    }
  }
  /**
   * Handle task edit event
   * @param {number} id - Task ID
   */
  handleTaskEdit(id) {
    // Get the task from state
    const tasks = this.stateManager.getTasks();
    const task = tasks.find(t => t.id === id);

    if (task) {
      // Show the edit component with the task
      this.components.taskEdit.show(task);
    } else {
      // Show error if task not found
      this.components.notification.showError('任务未找到');
    }
  }

  /**
   * Set up event listeners for task actions
   * @private
   */
  _setupEventListeners() {
    // Listen for task toggle events from TaskListComponent
    this.components.taskList.container.addEventListener('task-toggle', (event) => {
      const { id } = event.detail;
      this.handleTaskToggle(id);
    });

    // Listen for task delete events from TaskListComponent
    this.components.taskList.container.addEventListener('task-delete', (event) => {
      const { id } = event.detail;
      this.handleTaskDelete(id);
    });

    // Listen for task edit events from TaskListComponent
    this.components.taskList.container.addEventListener('task-edit', (event) => {
      const { id } = event.detail;
      this.handleTaskEdit(id);
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
