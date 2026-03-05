/**
 * State Manager
 * 
 * Manages application state and notifies subscribers of changes
 */

export class StateManager {
  constructor() {
    this.tasks = [];
    this.loading = false;
    this.error = null;
    this.listeners = [];
  }

  /**
   * Get all tasks
   * @returns {Array} Copy of tasks array (immutable)
   */
  getTasks() {
    // Return deep copy to ensure immutability
    return this.tasks.map(task => ({ ...task }));
  }

  /**
   * Set tasks list
   * @param {Array} tasks - New tasks array
   */
  setTasks(tasks) {
    // Create deep copy to ensure immutability
    this.tasks = tasks.map(task => ({ ...task }));
    this.notifyListeners();
  }

  /**
   * Add a new task
   * @param {Object} task - Task to add
   */
  addTask(task) {
    this.tasks = [...this.tasks, { ...task }];
    this.notifyListeners();
  }

  /**
   * Update an existing task
   * @param {number} id - Task ID
   * @param {Object} updates - Partial task updates
   */
  updateTask(id, updates) {
    this.tasks = this.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    this.notifyListeners();
  }

  /**
   * Remove a task
   * @param {number} id - Task ID to remove
   */
  removeTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function to be called on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state changes
   * @private
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.getTasks());
    });
  }

  /**
   * Get loading state
   * @returns {boolean} Current loading state
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Set loading state
   * @param {boolean} loading - New loading state
   */
  setLoading(loading) {
    this.loading = loading;
    this.notifyListeners();
  }

  /**
   * Get error message
   * @returns {string|null} Current error message
   */
  getError() {
    return this.error;
  }

  /**
   * Set error message
   * @param {string|null} error - Error message or null to clear
   */
  setError(error) {
    this.error = error;
    this.notifyListeners();
  }
}
