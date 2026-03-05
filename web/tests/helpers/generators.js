/**
 * fast-check Generators
 * 
 * Custom generators for property-based testing
 */

import fc from 'fast-check';

/**
 * Generates a valid task object
 */
export const taskGenerator = () => fc.record({
  id: fc.integer({ min: 1 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.string({ maxLength: 1000 }),
  completed: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString()),
});

/**
 * Generates a valid task object with non-whitespace title
 */
export const validTaskGenerator = () => fc.record({
  id: fc.integer({ min: 1 }),
  title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  description: fc.string({ maxLength: 1000 }),
  completed: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString()),
});

/**
 * Generates whitespace-only strings for validation testing
 */
export const whitespaceStringGenerator = () => fc.oneof(
  fc.constant(''),
  fc.constant(' '),
  fc.constant('  '),
  fc.constant('\t'),
  fc.constant('\n'),
  fc.constant('   \t\n  '),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
);

/**
 * Generates API error responses
 */
export const apiErrorGenerator = () => fc.record({
  error: fc.constantFrom('validation_error', 'not_found', 'server_error'),
  message: fc.string({ minLength: 1, maxLength: 100 }),
});

/**
 * Generates HTTP status codes
 */
export const httpStatusCodeGenerator = () => fc.integer({ min: 200, max: 599 });

/**
 * Generates valid task creation data
 */
export const createTaskDataGenerator = () => fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  description: fc.string({ maxLength: 1000 }),
});
