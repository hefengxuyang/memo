# Visual Tests for Interactive States

This directory contains visual tests to verify interactive state styles.

## Running the Tests

1. Start a local web server from the project root:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

2. Open the test file in your browser:
   ```
   http://localhost:8000/tests/visual/interactive-states.test.html
   ```

## What to Test

### Interactive States
- **Hover**: Move your mouse over elements to see hover effects
- **Focus**: Use Tab key to navigate and see focus indicators
- **Active**: Click and hold to see active states
- **Disabled**: Observe that disabled elements don't respond to interactions

### Requirements Validation

This visual test validates:
- **Requirement 8.2**: UI components provide clear interaction feedback (hover, click, disabled states)
- **Requirement 10.2**: Visual feedback within 100ms of user interaction

### Accessibility Testing

1. **Keyboard Navigation**:
   - Press Tab to navigate through all interactive elements
   - Verify visible focus indicators appear
   - Press Enter/Space to activate buttons and checkboxes

2. **Reduced Motion**:
   - Enable "Reduce motion" in your OS accessibility settings:
     - **macOS**: System Preferences → Accessibility → Display → Reduce motion
     - **Windows**: Settings → Ease of Access → Display → Show animations
     - **Linux**: Varies by desktop environment
   - Reload the page
   - Verify animations are minimal or instant

3. **Screen Reader**:
   - Use a screen reader (NVDA, JAWS, VoiceOver) to verify:
     - All buttons have accessible labels
     - State changes are announced
     - Focus order is logical

### Expected Behavior

#### Buttons
- Hover: Slight darkening, shadow appears
- Focus: Blue outline ring
- Active: Slight scale down or position shift
- Disabled: Grayed out, no hover effects, cursor shows "not-allowed"

#### Inputs
- Hover: Border color changes to gray
- Focus: Blue border with light blue shadow ring
- Disabled: Gray background, lighter text, no interactions

#### Checkboxes
- Hover: Slight scale up (1.1x)
- Focus: Blue outline ring
- Active: Slight scale down (0.95x)
- Disabled: Grayed out, no hover effects

#### Task Items
- Hover: Shadow appears, border color changes, delete button becomes visible
- Completed: Strikethrough text, green background

#### Notifications
- Hover on close button: Background color changes
- Active on close button: Slight scale down
- Focus on close button: Outline ring appears

### Transition Timing

All transitions should feel responsive:
- Fast transitions: 150ms (for immediate feedback)
- Base transitions: 200ms (for most interactions)
- Slow transitions: 300ms (for complex animations)

Verify that interactions feel snappy and responsive, meeting the 100ms feedback requirement.

### Browser Testing

Test in multiple browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Mobile Testing

On mobile devices:
- Touch targets should be at least 44x44px
- Hover effects should not apply (touch devices)
- Active states should provide clear feedback
- Delete buttons should always be visible (not hidden until hover)

## Automated Testing

While this is a visual test, you can also verify:

```javascript
// Check if reduced motion is respected
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
console.log('Reduced motion:', prefersReducedMotion);

// Check computed styles
const button = document.querySelector('.task-form-button');
const styles = window.getComputedStyle(button);
console.log('Transition duration:', styles.transitionDuration);
```

## Known Issues

None currently. Report any issues with interactive states.

## Future Enhancements

- Add automated visual regression testing with Playwright or Puppeteer
- Add performance metrics for transition timing
- Add automated accessibility testing with axe-core
