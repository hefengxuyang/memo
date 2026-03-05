/**
 * UI Feedback Property-Based Tests
 * 
 * Tests Properties 14, 15
 * Note: Property 18 is tested in accessibility.property.test.js
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { NotificationComponent } from '../../js/components/notification.js';

describe('UI Feedback Properties', () => {
  let container;
  let notification;

  beforeEach(() => {
    // Create a container for notifications
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    notification = new NotificationComponent(container);
  });

  afterEach(() => {
    // Clean up
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  /**
   * Property 14: Success Operation Feedback
   * 
   * **Validates: Requirements 6.3**
   * 
   * For any successful operation (create, delete, update), the frontend should 
   * display a visual confirmation message to the user.
   */
  test('Property 14: Success Operation Feedback - success messages are displayed', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (message) => {
          // Clear any existing notifications first
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
          notification.notifications.clear();

          // Show success notification
          const notificationId = notification.showSuccess(message);

          // Verify notification is displayed
          const notificationElement = container.querySelector('.notification.success');
          expect(notificationElement).not.toBeNull();

          // Verify message content is displayed (check innerHTML since we escape HTML)
          const contentElement = notificationElement.querySelector('.notification-content');
          expect(contentElement.innerHTML).toBe(notification._escapeHtml(message));

          // Verify success styling is applied
          expect(notificationElement.classList.contains('success')).toBe(true);

          // Verify accessibility attributes
          expect(notificationElement.getAttribute('role')).toBe('alert');
          expect(notificationElement.getAttribute('aria-live')).toBe('polite');

          // Verify close button exists
          const closeButton = notificationElement.querySelector('.notification-close');
          expect(closeButton).not.toBeNull();
          expect(closeButton.getAttribute('aria-label')).toBe('关闭通知');

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 14: Error Operation Feedback - error messages are displayed', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (message) => {
          // Clear any existing notifications first
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
          notification.notifications.clear();

          // Show error notification
          const notificationId = notification.showError(message);

          // Verify notification is displayed
          const notificationElement = container.querySelector('.notification.error');
          expect(notificationElement).not.toBeNull();

          // Verify message content is displayed
          const contentElement = notificationElement.querySelector('.notification-content');
          expect(contentElement.innerHTML).toBe(notification._escapeHtml(message));

          // Verify error styling is applied
          expect(notificationElement.classList.contains('error')).toBe(true);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 14: Info Operation Feedback - info messages are displayed', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (message) => {
          // Clear any existing notifications first
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
          notification.notifications.clear();

          // Show info notification
          const notificationId = notification.showInfo(message);

          // Verify notification is displayed
          const notificationElement = container.querySelector('.notification.info');
          expect(notificationElement).not.toBeNull();

          // Verify message content is displayed
          const contentElement = notificationElement.querySelector('.notification-content');
          expect(contentElement.innerHTML).toBe(notification._escapeHtml(message));

          // Verify info styling is applied
          expect(notificationElement.classList.contains('info')).toBe(true);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 14: Multiple notifications can be displayed simultaneously', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
        (messages) => {
          // Clear any existing notifications first
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
          notification.notifications.clear();

          // Show multiple notifications
          messages.forEach(msg => notification.showSuccess(msg));

          // Verify all notifications are displayed
          const notificationElements = container.querySelectorAll('.notification.success');
          expect(notificationElements.length).toBe(messages.length);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
