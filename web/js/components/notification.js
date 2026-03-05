/**
 * Notification Component
 * 
 * Displays success, error, and info messages to the user
 */

export class NotificationComponent {
  constructor(container) {
    this.container = container;
    this.notifications = new Map(); // Track active notifications
    this.notificationCounter = 0; // Unique ID for each notification
    
    // Keyboard navigation: Escape key closes notifications
    this._handleKeyDown = this._handleKeyDown.bind(this);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Handle keyboard events for notifications
   * @private
   */
  _handleKeyDown(event) {
    if (event.key === 'Escape' && this.notifications.size > 0) {
      // Close the most recent notification
      const lastNotificationId = Array.from(this.notifications.keys()).pop();
      if (lastNotificationId) {
        this._closeNotification(lastNotificationId);
      }
    }
  }

  /**
   * Show a success notification
   * @param {string} message - The message to display
   * @param {number} duration - Auto-dismiss duration in milliseconds (default: 3000)
   */
  showSuccess(message, duration = 3000) {
    return this._showNotification(message, 'success', duration);
  }

  /**
   * Show an error notification
   * @param {string} message - The message to display
   * @param {number} duration - Auto-dismiss duration in milliseconds (default: 5000)
   */
  showError(message, duration = 5000) {
    return this._showNotification(message, 'error', duration);
  }

  /**
   * Show an info notification
   * @param {string} message - The message to display
   * @param {number} duration - Auto-dismiss duration in milliseconds (default: 3000)
   */
  showInfo(message, duration = 3000) {
    return this._showNotification(message, 'info', duration);
  }

  /**
   * Close all notifications
   */
  close() {
    // Close all active notifications
    this.notifications.forEach((notification) => {
      this._closeNotification(notification.id);
    });
  }

  /**
   * Cleanup method to remove event listeners
   */
  destroy() {
    document.removeEventListener('keydown', this._handleKeyDown);
    this.close();
  }

  /**
   * Internal method to show a notification
   * @private
   */
  _showNotification(message, type, duration) {
    const id = ++this.notificationCounter;
    
    // Create notification element using the container's document
    const doc = this.container.ownerDocument || document;
    const notification = doc.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    // Use assertive for errors to interrupt screen readers, polite for others
    notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    notification.dataset.notificationId = id;

    // Get icon based on type
    const icon = this._getIcon(type);

    // Build notification HTML
    notification.innerHTML = `
      <span class="notification-icon" aria-hidden="true">${icon}</span>
      <div class="notification-content">${this._escapeHtml(message)}</div>
      <button class="notification-close" aria-label="关闭通知">×</button>
    `;

    // Add close button handler
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      this._closeNotification(id);
    });

    // Add to container
    this.container.appendChild(notification);

    // Store notification reference
    const notificationData = {
      id,
      element: notification,
      timeoutId: null,
    };

    this.notifications.set(id, notificationData);

    // Set auto-dismiss timeout
    if (duration > 0) {
      notificationData.timeoutId = setTimeout(() => {
        this._closeNotification(id);
      }, duration);
    }

    return id;
  }

  /**
   * Close a specific notification
   * @private
   */
  _closeNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Clear timeout if exists
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }

    // Add closing animation
    notification.element.classList.add('closing');

    // Remove after animation completes
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 300); // Match CSS animation duration
  }

  /**
   * Get icon for notification type
   * @private
   */
  _getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
    };
    return icons[type] || icons.info;
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  _escapeHtml(text) {
    const doc = this.container.ownerDocument || document;
    const div = doc.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
