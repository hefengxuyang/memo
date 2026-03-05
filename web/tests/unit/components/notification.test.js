/**
 * NotificationComponent Unit Tests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NotificationComponent } from '../../../js/components/notification.js';

describe('NotificationComponent', () => {
  let container;
  let notification;

  beforeEach(() => {
    // Create a container for notifications
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    notification = new NotificationComponent(container);

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up
    jest.clearAllTimers();
    jest.useRealTimers();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('showSuccess', () => {
    test('should display success message with correct styling', () => {
      const message = 'Task created successfully';
      notification.showSuccess(message);

      const notificationElement = container.querySelector('.notification.success');
      expect(notificationElement).not.toBeNull();
      expect(notificationElement.classList.contains('success')).toBe(true);

      const contentElement = notificationElement.querySelector('.notification-content');
      expect(contentElement.innerHTML).toBe(message);
    });

    test('should include success icon', () => {
      notification.showSuccess('Success message');

      const iconElement = container.querySelector('.notification-icon');
      expect(iconElement).not.toBeNull();
      expect(iconElement.textContent).toBe('✓');
    });

    test('should have accessibility attributes', () => {
      notification.showSuccess('Success message');

      const notificationElement = container.querySelector('.notification');
      expect(notificationElement.getAttribute('role')).toBe('alert');
      expect(notificationElement.getAttribute('aria-live')).toBe('polite');
    });

    test('should auto-dismiss after default duration (3000ms)', () => {
      notification.showSuccess('Success message');

      expect(container.querySelector('.notification')).not.toBeNull();

      // Fast-forward time by 3000ms
      jest.advanceTimersByTime(3000);

      // Notification should start closing animation
      expect(container.querySelector('.notification.closing')).not.toBeNull();

      // Fast-forward animation duration
      jest.advanceTimersByTime(300);

      // Notification should be removed
      expect(container.querySelector('.notification')).toBeNull();
    });

    test('should auto-dismiss after custom duration', () => {
      notification.showSuccess('Success message', 5000);

      expect(container.querySelector('.notification')).not.toBeNull();

      // Fast-forward time by 5000ms
      jest.advanceTimersByTime(5000);

      // Notification should start closing animation
      expect(container.querySelector('.notification.closing')).not.toBeNull();
    });

    test('should not auto-dismiss when duration is 0', () => {
      notification.showSuccess('Success message', 0);

      expect(container.querySelector('.notification')).not.toBeNull();

      // Fast-forward time
      jest.advanceTimersByTime(10000);

      // Notification should still be visible (no closing class)
      expect(container.querySelector('.notification')).not.toBeNull();
      expect(container.querySelector('.notification.closing')).toBeNull();
    });
  });

  describe('showError', () => {
    test('should display error message with correct styling', () => {
      const message = 'Failed to create task';
      notification.showError(message);

      const notificationElement = container.querySelector('.notification.error');
      expect(notificationElement).not.toBeNull();
      expect(notificationElement.classList.contains('error')).toBe(true);

      const contentElement = notificationElement.querySelector('.notification-content');
      expect(contentElement.innerHTML).toBe(message);
    });

    test('should include error icon', () => {
      notification.showError('Error message');

      const iconElement = container.querySelector('.notification-icon');
      expect(iconElement).not.toBeNull();
      expect(iconElement.textContent).toBe('✕');
    });

    test('should have assertive aria-live for errors', () => {
      notification.showError('Error message');

      const notificationElement = container.querySelector('.notification');
      expect(notificationElement.getAttribute('role')).toBe('alert');
      expect(notificationElement.getAttribute('aria-live')).toBe('assertive');
    });

    test('should auto-dismiss after default duration (5000ms)', () => {
      notification.showError('Error message');

      expect(container.querySelector('.notification')).not.toBeNull();

      // Fast-forward time by 5000ms
      jest.advanceTimersByTime(5000);

      // Notification should start closing animation
      expect(container.querySelector('.notification.closing')).not.toBeNull();
    });
  });

  describe('showInfo', () => {
    test('should display info message with correct styling', () => {
      const message = 'Loading tasks...';
      notification.showInfo(message);

      const notificationElement = container.querySelector('.notification.info');
      expect(notificationElement).not.toBeNull();
      expect(notificationElement.classList.contains('info')).toBe(true);

      const contentElement = notificationElement.querySelector('.notification-content');
      expect(contentElement.innerHTML).toBe(message);
    });

    test('should include info icon', () => {
      notification.showInfo('Info message');

      const iconElement = container.querySelector('.notification-icon');
      expect(iconElement).not.toBeNull();
      expect(iconElement.textContent).toBe('ℹ');
    });

    test('should auto-dismiss after default duration (3000ms)', () => {
      notification.showInfo('Info message');

      expect(container.querySelector('.notification')).not.toBeNull();

      // Fast-forward time by 3000ms
      jest.advanceTimersByTime(3000);

      // Notification should start closing animation
      expect(container.querySelector('.notification.closing')).not.toBeNull();
    });
  });

  describe('close button', () => {
    test('should have close button with aria-label', () => {
      notification.showSuccess('Test message');

      const closeButton = container.querySelector('.notification-close');
      expect(closeButton).not.toBeNull();
      expect(closeButton.getAttribute('aria-label')).toBe('关闭通知');
    });

    test('should close notification when close button is clicked', () => {
      notification.showSuccess('Test message');

      const closeButton = container.querySelector('.notification-close');
      closeButton.click();

      // Notification should start closing animation
      expect(container.querySelector('.notification.closing')).not.toBeNull();

      // Fast-forward animation duration
      jest.advanceTimersByTime(300);

      // Notification should be removed
      expect(container.querySelector('.notification')).toBeNull();
    });

    test('should cancel auto-dismiss timer when manually closed', () => {
      notification.showSuccess('Test message', 3000);

      // Manually close before auto-dismiss
      const closeButton = container.querySelector('.notification-close');
      closeButton.click();

      // Fast-forward animation duration
      jest.advanceTimersByTime(300);

      // Notification should be removed
      expect(container.querySelector('.notification')).toBeNull();

      // Fast-forward past auto-dismiss time
      jest.advanceTimersByTime(3000);

      // Should not cause any errors (timer was cleared)
      expect(container.querySelector('.notification')).toBeNull();
    });
  });

  describe('close method', () => {
    test('should close all notifications', () => {
      notification.showSuccess('Message 1');
      notification.showError('Message 2');
      notification.showInfo('Message 3');

      expect(container.querySelectorAll('.notification').length).toBe(3);

      notification.close();

      // All notifications should start closing animation
      expect(container.querySelectorAll('.notification.closing').length).toBe(3);

      // Fast-forward animation duration
      jest.advanceTimersByTime(300);

      // All notifications should be removed
      expect(container.querySelectorAll('.notification').length).toBe(0);
    });

    test('should handle empty notification list', () => {
      // Should not throw error when no notifications exist
      expect(() => notification.close()).not.toThrow();
    });
  });

  describe('multiple notifications', () => {
    test('should display multiple notifications simultaneously', () => {
      notification.showSuccess('Message 1');
      notification.showError('Message 2');
      notification.showInfo('Message 3');

      const notifications = container.querySelectorAll('.notification');
      expect(notifications.length).toBe(3);
    });

    test('should stack notifications in order', () => {
      notification.showSuccess('First');
      notification.showError('Second');
      notification.showInfo('Third');

      const notifications = container.querySelectorAll('.notification');
      expect(notifications[0].querySelector('.notification-content').innerHTML).toBe('First');
      expect(notifications[1].querySelector('.notification-content').innerHTML).toBe('Second');
      expect(notifications[2].querySelector('.notification-content').innerHTML).toBe('Third');
    });

    test('should auto-dismiss notifications independently', () => {
      notification.showSuccess('Message 1', 1000);
      notification.showError('Message 2', 2000);

      expect(container.querySelectorAll('.notification').length).toBe(2);

      // Fast-forward 1000ms - first notification should close
      jest.advanceTimersByTime(1000);
      expect(container.querySelectorAll('.notification.closing').length).toBe(1);

      jest.advanceTimersByTime(300); // Animation duration
      expect(container.querySelectorAll('.notification').length).toBe(1);

      // Fast-forward another 700ms - second notification should close
      jest.advanceTimersByTime(700);
      expect(container.querySelectorAll('.notification.closing').length).toBe(1);

      jest.advanceTimersByTime(300); // Animation duration
      expect(container.querySelectorAll('.notification').length).toBe(0);
    });
  });

  describe('XSS prevention', () => {
    test('should escape HTML in messages', () => {
      const maliciousMessage = '<script>alert("XSS")</script>';
      notification.showSuccess(maliciousMessage);

      const contentElement = container.querySelector('.notification-content');
      // Should be escaped, not executed
      expect(contentElement.innerHTML).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
      expect(contentElement.querySelector('script')).toBeNull();
    });

    test('should escape HTML entities', () => {
      const message = '<b>Bold</b> & <i>Italic</i>';
      notification.showSuccess(message);

      const contentElement = container.querySelector('.notification-content');
      expect(contentElement.innerHTML).toBe('&lt;b&gt;Bold&lt;/b&gt; &amp; &lt;i&gt;Italic&lt;/i&gt;');
    });
  });

  describe('return value', () => {
    test('should return unique notification ID', () => {
      const id1 = notification.showSuccess('Message 1');
      const id2 = notification.showSuccess('Message 2');
      const id3 = notification.showError('Message 3');

      expect(id1).toBe(1);
      expect(id2).toBe(2);
      expect(id3).toBe(3);
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });
  });
});
