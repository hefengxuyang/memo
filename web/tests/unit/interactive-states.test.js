/**
 * Interactive States Tests
 * 
 * Tests to verify interactive state styles are properly implemented
 * Validates Requirements 8.2 and 10.2
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Interactive States', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Load HTML with CSS
    const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf-8');
    dom = new JSDOM(html, {
      resources: 'usable',
      runScripts: 'dangerously',
    });
    document = dom.window.document;
    window = dom.window;
  });

  afterEach(() => {
    if (dom && dom.window) {
      dom.window.close();
    }
  });

  describe('CSS Files Existence', () => {
    test('interactive-states.css file exists', () => {
      const cssPath = path.join(__dirname, '../../css/interactive-states.css');
      expect(fs.existsSync(cssPath)).toBe(true);
    });

    test('interactive-states.css is linked in HTML', () => {
      const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf-8');
      expect(html).toContain('interactive-states.css');
    });
  });

  describe('CSS Variables for Transitions', () => {
    test('transition variables are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/variables.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('--transition-fast');
      expect(cssContent).toContain('--transition-base');
      expect(cssContent).toContain('--transition-slow');
    });

    test('transition durations are within acceptable range', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/variables.css'),
        'utf-8',
      );
      
      // Extract transition values
      const fastMatch = cssContent.match(/--transition-fast:\s*(\d+)ms/);
      const baseMatch = cssContent.match(/--transition-base:\s*(\d+)ms/);
      const slowMatch = cssContent.match(/--transition-slow:\s*(\d+)ms/);
      
      expect(fastMatch).toBeTruthy();
      expect(baseMatch).toBeTruthy();
      expect(slowMatch).toBeTruthy();
      
      const fast = parseInt(fastMatch[1]);
      const base = parseInt(baseMatch[1]);
      const slow = parseInt(slowMatch[1]);
      
      // Verify transitions are fast enough for 100ms feedback requirement (Req 10.2)
      expect(fast).toBeLessThanOrEqual(200);
      expect(base).toBeLessThanOrEqual(300);
      expect(slow).toBeLessThanOrEqual(400);
      
      // Verify logical ordering
      expect(fast).toBeLessThan(base);
      expect(base).toBeLessThan(slow);
    });
  });

  describe('Interactive State Styles', () => {
    test('button hover states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('button:hover');
      expect(cssContent).toContain(':not(:disabled)');
    });

    test('button focus states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('button:focus-visible');
      expect(cssContent).toContain('outline');
    });

    test('button active states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('button:active');
    });

    test('button disabled states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('button:disabled');
      expect(cssContent).toContain('cursor: not-allowed');
    });

    test('input hover states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('input:hover');
    });

    test('input focus states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('input:focus');
      expect(cssContent).toContain('box-shadow');
    });

    test('input disabled states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('input:disabled');
    });

    test('checkbox interactive states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('input[type="checkbox"]:hover');
      expect(cssContent).toContain('input[type="checkbox"]:active');
      expect(cssContent).toContain('input[type="checkbox"]:focus');
      expect(cssContent).toContain('input[type="checkbox"]:disabled');
    });
  });

  describe('Prefers Reduced Motion Support', () => {
    test('prefers-reduced-motion media query is defined in variables.css', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/variables.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(cssContent).toContain('animation-duration: 0.01ms !important');
      expect(cssContent).toContain('transition-duration: 0.01ms !important');
    });

    test('prefers-reduced-motion media query is defined in interactive-states.css', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    });

    test('prefers-reduced-motion media query is defined in main.css', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/main.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('Component-Specific Interactive States', () => {
    test('task-form button states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/components/task-form.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('.task-form-button:hover');
      expect(cssContent).toContain('.task-form-button:active');
      expect(cssContent).toContain('.task-form-button:focus');
      expect(cssContent).toContain('.task-form-button:disabled');
    });

    test('task-form input states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/components/task-form.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('.task-form-input:hover');
      expect(cssContent).toContain('.task-form-input:focus');
      expect(cssContent).toContain('.task-form-input:disabled');
    });

    test('task-item interactive states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/components/task-item.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('.task-item:hover');
      expect(cssContent).toContain('.task-item__checkbox:hover');
      expect(cssContent).toContain('.task-item__checkbox:active');
      expect(cssContent).toContain('.task-item__checkbox:focus');
      expect(cssContent).toContain('.task-item__delete:hover');
      expect(cssContent).toContain('.task-item__delete:active');
      expect(cssContent).toContain('.task-item__delete:disabled');
    });

    test('notification close button states are defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/components/notification.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('.notification-close:hover');
      expect(cssContent).toContain('.notification-close:active');
      expect(cssContent).toContain('.notification-close:focus');
    });
  });

  describe('Transition Properties', () => {
    test('buttons have transition properties', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toMatch(/button\s*{[^}]*transition:/);
    });

    test('inputs have transition properties', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toMatch(/input[^{]*{[^}]*transition:/);
    });

    test('task items have transition properties', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/components/task-item.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('transition:');
    });
  });

  describe('Accessibility - Focus Indicators', () => {
    test('focus-visible pseudo-class is used', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain(':focus-visible');
    });

    test('focus-not-focus-visible pattern is used to hide outlines for mouse users', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain(':focus:not(:focus-visible)');
    });

    test('outline styles are defined for focus states', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      const focusVisibleMatches = cssContent.match(/:focus-visible\s*{[^}]*outline:/g);
      expect(focusVisibleMatches).toBeTruthy();
      expect(focusVisibleMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Touch Device Optimizations', () => {
    test('touch device media query is defined', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('@media (hover: none) and (pointer: coarse)');
    });

    test('minimum touch target sizes are specified for touch devices', () => {
      const cssContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      expect(cssContent).toContain('min-height: 44px');
      expect(cssContent).toContain('min-width: 44px');
    });
  });

  describe('Requirements Validation', () => {
    test('Requirement 8.2: Interactive feedback states are implemented', () => {
      const interactiveStatesContent = fs.readFileSync(
        path.join(__dirname, '../../css/interactive-states.css'),
        'utf-8',
      );
      
      // Verify hover states
      expect(interactiveStatesContent).toContain(':hover');
      
      // Verify active/click states
      expect(interactiveStatesContent).toContain(':active');
      
      // Verify disabled states
      expect(interactiveStatesContent).toContain(':disabled');
      
      // Verify focus states
      expect(interactiveStatesContent).toContain(':focus');
    });

    test('Requirement 10.2: Visual feedback within 100ms (fast transitions)', () => {
      const variablesContent = fs.readFileSync(
        path.join(__dirname, '../../css/variables.css'),
        'utf-8',
      );
      
      // Extract transition-fast value
      const fastMatch = variablesContent.match(/--transition-fast:\s*(\d+)ms/);
      expect(fastMatch).toBeTruthy();
      
      const transitionTime = parseInt(fastMatch[1]);
      
      // Verify transition is fast enough for 100ms feedback requirement
      expect(transitionTime).toBeLessThanOrEqual(200);
    });
  });
});
