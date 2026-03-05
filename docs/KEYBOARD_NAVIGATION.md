# Keyboard Navigation Guide

This document describes the keyboard navigation features implemented in the Memo Web Frontend.

## Overview

The application is fully accessible via keyboard, allowing users to navigate and interact with all features without using a mouse. This ensures compliance with WCAG 2.1 accessibility guidelines and provides a better experience for keyboard users.

## Keyboard Shortcuts

### Global Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to the next interactive element |
| `Shift + Tab` | Move focus to the previous interactive element |
| `Esc` | Close the most recent notification |

### Form Interactions

| Key | Action | Context |
|-----|--------|---------|
| `Enter` | Submit the form | When focused on the title input field |
| `Enter` | Insert new line | When focused on the description textarea |
| `Shift + Enter` | Insert new line (no form submission) | When focused on the title input field |

### Task Item Interactions

| Key | Action | Context |
|-----|--------|---------|
| `Space` | Toggle task completion status | When focused on the task checkbox |
| `Enter` | Activate button | When focused on the delete button |

## Tab Order

The application follows a logical tab order:

1. **Task Form Section**
   - Task title input
   - Task description textarea
   - Submit button

2. **Task List Section**
   - For each task item:
     - Completion checkbox
     - Delete button

3. **Notifications**
   - Close button (×) for each notification

## Focus Indicators

All interactive elements display a visible focus indicator when focused via keyboard:

- **Style**: 2px solid blue outline
- **Offset**: 2px from the element
- **Color**: Primary blue (`#3b82f6`)

Focus indicators are implemented using the `:focus-visible` pseudo-class, which shows the outline only for keyboard navigation (not mouse clicks).

### Example CSS

```css
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## ARIA Labels

All interactive elements have appropriate ARIA labels for screen reader users:

### Form Elements

- **Title Input**: `aria-label="任务标题"`, `aria-required="true"`
- **Description Textarea**: `aria-label="任务描述"`
- **Submit Button**: `aria-label="创建新任务"`

### Task Items

- **Checkbox**: `aria-label="标记任务'[title]'为[已完成/未完成]"`
- **Delete Button**: `aria-label="删除任务'[title]'"`

### Notifications

- **Container**: `aria-live="polite"`, `aria-atomic="true"`
- **Error Notifications**: `aria-live="assertive"` (interrupts screen readers)
- **Close Button**: `aria-label="关闭通知"`

## Implementation Details

### Enter Key Form Submission

The form submission is implemented in `TaskFormComponent`:

```javascript
this.titleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    this.form.requestSubmit();
  }
});
```

This allows users to submit the form by pressing Enter in the title field, while Shift+Enter is reserved for potential multi-line input.

### Escape Key Notification Dismissal

The notification dismissal is implemented in `NotificationComponent`:

```javascript
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && this.notifications.size > 0) {
    const lastNotificationId = Array.from(this.notifications.keys()).pop();
    if (lastNotificationId) {
      this._closeNotification(lastNotificationId);
    }
  }
});
```

This closes the most recent notification when Escape is pressed, allowing users to dismiss notifications without using the mouse.

### Focus Management

Focus management is handled automatically by the browser for native HTML elements (buttons, inputs, checkboxes). The application ensures:

1. All interactive elements are focusable (no `tabindex="-1"` on interactive elements)
2. Tab order is logical and follows the visual layout
3. Focus is not trapped in any component (except modals, if implemented)
4. Focus indicators are always visible for keyboard users

## Testing

### Automated Tests

Keyboard navigation is tested in `tests/unit/keyboard-navigation.test.js`:

- Enter key form submission
- Escape key notification dismissal
- Tab navigation through all elements
- Focus indicators on all interactive elements
- ARIA labels on all elements

### Manual Testing

A visual test page is available at `tests/visual/keyboard-navigation.test.html`:

1. Open the file in a browser
2. Use only your keyboard to interact with the page
3. Verify all features work as expected
4. Check that focus indicators are visible

### Testing Checklist

- [ ] All interactive elements are reachable via Tab key
- [ ] Tab order is logical and follows visual layout
- [ ] Focus indicators are visible on all elements
- [ ] Enter key submits the form from title input
- [ ] Shift+Enter does not submit the form
- [ ] Escape key closes notifications
- [ ] Space key toggles checkboxes
- [ ] Enter key activates buttons
- [ ] ARIA labels are present and descriptive
- [ ] Screen reader announces all elements correctly

## Browser Compatibility

Keyboard navigation is supported in all modern browsers:

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

The `:focus-visible` pseudo-class is supported in all target browsers. For older browsers, a polyfill can be added if needed.

## Accessibility Compliance

The keyboard navigation implementation meets the following WCAG 2.1 criteria:

- **2.1.1 Keyboard (Level A)**: All functionality is available via keyboard
- **2.1.2 No Keyboard Trap (Level A)**: Focus is never trapped
- **2.4.3 Focus Order (Level A)**: Tab order is logical
- **2.4.7 Focus Visible (Level AA)**: Focus indicators are visible
- **3.2.1 On Focus (Level A)**: No unexpected context changes on focus
- **3.2.2 On Input (Level A)**: No unexpected context changes on input
- **4.1.2 Name, Role, Value (Level A)**: All elements have appropriate ARIA labels

## Future Enhancements

Potential keyboard navigation improvements for future versions:

1. **Arrow Key Navigation**: Navigate through task list using arrow keys
2. **Keyboard Shortcuts**: Add shortcuts like `Ctrl+N` for new task, `Ctrl+/` for help
3. **Focus Restoration**: Return focus to the appropriate element after actions
4. **Skip Links**: Add "Skip to main content" link for screen reader users
5. **Modal Focus Trap**: If modals are added, implement focus trapping
6. **Custom Focus Styles**: Allow users to customize focus indicator appearance

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN: Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [A11y Project: Checklist](https://www.a11yproject.com/checklist/)
