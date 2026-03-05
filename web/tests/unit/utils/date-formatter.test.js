/**
 * Date Formatter Unit Tests
 */

import { describe, test, expect } from '@jest/globals';
import { formatDate, formatRelativeTime } from '../../../js/utils/date-formatter.js';

describe('Date Formatter', () => {
  describe('formatDate', () => {
    test('should format valid ISO date string', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      // The result will depend on the local timezone
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    test('should format date with milliseconds', () => {
      const result = formatDate('2024-01-15T10:30:00.123Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    test('should handle invalid date string', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('无效日期');
    });

    test('should handle empty string', () => {
      const result = formatDate('');
      expect(result).toBe('无效日期');
    });

    test('should pad single digit months and days', () => {
      const result = formatDate('2024-01-05T08:05:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      // Check that it contains properly padded values
      const parts = result.split(/[-\s:]/);
      expect(parts[1]).toHaveLength(2); // month
      expect(parts[2]).toHaveLength(2); // day
      expect(parts[3]).toHaveLength(2); // hour
      expect(parts[4]).toHaveLength(2); // minute
    });
  });

  describe('formatRelativeTime', () => {
    test('should return "刚刚" for very recent dates', () => {
      const now = new Date();
      const result = formatRelativeTime(now.toISOString());
      expect(result).toBe('刚刚');
    });

    test('should return minutes for dates within an hour', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/^\d+ 分钟前$/);
    });

    test('should return hours for dates within a day', () => {
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/^\d+ 小时前$/);
    });

    test('should return days for dates within a week', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/^\d+ 天前$/);
    });

    test('should return formatted date for dates older than a week', () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    test('should handle edge case of exactly 1 minute', () => {
      const date = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/^1 分钟前$/);
    });

    test('should handle edge case of exactly 1 hour', () => {
      const date = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/^1 小时前$/);
    });

    test('should handle edge case of exactly 1 day', () => {
      const date = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/^1 天前$/);
    });
  });
});
