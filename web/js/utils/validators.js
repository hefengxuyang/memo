/**
 * Validation Utilities
 * 
 * Functions for validating user input
 */

import { config } from '../config.js';

export function validateTaskTitle(title) {
  const trimmed = title.trim();
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: '任务标题不能为空',
    };
  }
  
  if (trimmed.length > config.maxTitleLength) {
    return {
      valid: false,
      error: `任务标题不能超过 ${config.maxTitleLength} 个字符`,
    };
  }
  
  return { valid: true };
}

export function validateTaskDescription(description) {
  if (description.length > config.maxDescriptionLength) {
    return {
      valid: false,
      error: `任务描述不能超过 ${config.maxDescriptionLength} 个字符`,
    };
  }
  
  return { valid: true };
}

/**
 * Validates complete task input (title and description)
 * @param {string} title - Task title
 * @param {string} description - Task description (optional)
 * @returns {Object} Validation result with valid flag and errors object
 */
export function validateTaskInput(title, description = '') {
  const errors = {};
  let valid = true;
  
  const titleValidation = validateTaskTitle(title);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error;
    valid = false;
  }
  
  const descriptionValidation = validateTaskDescription(description);
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.error;
    valid = false;
  }
  
  return { valid, errors };
}
