/**
 * Validators Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateTaskInput,
} from '../../../js/utils/validators.js';

describe('Validators', () => {
  describe('validateTaskTitle', () => {
    test('should accept valid title', () => {
      const result = validateTaskTitle('Valid task title');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject empty title', () => {
      const result = validateTaskTitle('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('任务标题不能为空');
    });

    test('should reject whitespace-only title', () => {
      const result = validateTaskTitle('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('任务标题不能为空');
    });

    test('should reject title with only tabs and spaces', () => {
      const result = validateTaskTitle('\t  \t');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('任务标题不能为空');
    });

    test('should accept title with leading/trailing whitespace', () => {
      const result = validateTaskTitle('  Valid title  ');
      expect(result.valid).toBe(true);
    });

    test('should reject title exceeding max length', () => {
      const longTitle = 'a'.repeat(201);
      const result = validateTaskTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能超过');
      expect(result.error).toContain('200');
    });

    test('should accept title at max length', () => {
      const maxTitle = 'a'.repeat(200);
      const result = validateTaskTitle(maxTitle);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTaskDescription', () => {
    test('should accept valid description', () => {
      const result = validateTaskDescription('Valid description');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept empty description', () => {
      const result = validateTaskDescription('');
      expect(result.valid).toBe(true);
    });

    test('should reject description exceeding max length', () => {
      const longDesc = 'a'.repeat(1001);
      const result = validateTaskDescription(longDesc);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不能超过');
      expect(result.error).toContain('1000');
    });

    test('should accept description at max length', () => {
      const maxDesc = 'a'.repeat(1000);
      const result = validateTaskDescription(maxDesc);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTaskInput', () => {
    test('should accept valid title and description', () => {
      const result = validateTaskInput('Valid title', 'Valid description');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should accept valid title with empty description', () => {
      const result = validateTaskInput('Valid title', '');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should accept valid title without description parameter', () => {
      const result = validateTaskInput('Valid title');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should reject empty title', () => {
      const result = validateTaskInput('', 'Valid description');
      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe('任务标题不能为空');
      expect(result.errors.description).toBeUndefined();
    });

    test('should reject whitespace-only title', () => {
      const result = validateTaskInput('   ', 'Valid description');
      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe('任务标题不能为空');
    });

    test('should reject too long description', () => {
      const longDesc = 'a'.repeat(1001);
      const result = validateTaskInput('Valid title', longDesc);
      expect(result.valid).toBe(false);
      expect(result.errors.description).toContain('不能超过');
      expect(result.errors.title).toBeUndefined();
    });

    test('should reject both invalid title and description', () => {
      const longDesc = 'a'.repeat(1001);
      const result = validateTaskInput('', longDesc);
      expect(result.valid).toBe(false);
      expect(result.errors.title).toBe('任务标题不能为空');
      expect(result.errors.description).toContain('不能超过');
    });

    test('should reject too long title', () => {
      const longTitle = 'a'.repeat(201);
      const result = validateTaskInput(longTitle, 'Valid description');
      expect(result.valid).toBe(false);
      expect(result.errors.title).toContain('不能超过');
      expect(result.errors.description).toBeUndefined();
    });
  });
});
