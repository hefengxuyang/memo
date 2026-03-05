/**
 * Performance Utilities
 * 
 * Utilities for optimizing application performance
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last invocation
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeoutId;
  
  return function debounced(...args) {
    const context = this;
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, wait) {
  let timeoutId;
  let lastRan;
  
  return function throttled(...args) {
    const context = this;
    
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        if (Date.now() - lastRan >= wait) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, wait - (Date.now() - lastRan));
    }
  };
}

/**
 * Request Deduplicator - prevents duplicate concurrent requests
 */
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Execute a request with deduplication
   * @param {string} key - Unique key for the request
   * @param {Function} requestFn - Function that returns a Promise
   * @returns {Promise} The request promise
   */
  async dedupe(key, requestFn) {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request promise
    const promise = requestFn()
      .finally(() => {
        // Remove from pending requests when complete
        this.pendingRequests.delete(key);
      });

    // Store the pending request
    this.pendingRequests.set(key, promise);

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Check if a request is pending
   * @param {string} key - Request key
   * @returns {boolean} True if request is pending
   */
  isPending(key) {
    return this.pendingRequests.has(key);
  }
}

/**
 * Batch DOM Updates - uses requestAnimationFrame to batch DOM operations
 */
export class DOMBatcher {
  constructor() {
    this.pendingUpdates = [];
    this.rafId = null;
  }

  /**
   * Schedule a DOM update
   * @param {Function} updateFn - Function that performs DOM updates
   */
  schedule(updateFn) {
    this.pendingUpdates.push(updateFn);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  /**
   * Execute all pending updates
   * @private
   */
  flush() {
    const updates = this.pendingUpdates;
    this.pendingUpdates = [];
    this.rafId = null;

    // Execute all updates in a single frame
    updates.forEach(updateFn => {
      try {
        updateFn();
      } catch (error) {
        console.error('Error executing DOM update:', error);
      }
    });
  }

  /**
   * Cancel all pending updates
   */
  cancel() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdates = [];
  }
}

/**
 * Performance Monitor - tracks performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Mark a performance point
   * @param {string} name - Mark name
   */
  mark(name) {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    
    // Also use native Performance API if available
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name (optional, defaults to now)
   * @returns {number} Duration in milliseconds
   */
  measure(name, startMark, endMark = null) {
    const startTime = this.marks.get(startMark);
    
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    
    if (endMark && !endTime) {
      console.warn(`End mark "${endMark}" not found`);
      return 0;
    }

    const duration = endTime - startTime;
    
    this.measures.push({
      name,
      startMark,
      endMark,
      duration,
      timestamp: Date.now(),
    });

    // Also use native Performance API if available
    if (performance.measure && endMark) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        // Ignore errors from native API
      }
    }

    return duration;
  }

  /**
   * Get all measures
   * @returns {Array} Array of measure objects
   */
  getMeasures() {
    return [...this.measures];
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    this.marks.clear();
    this.measures = [];
    
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  /**
   * Log performance summary
   */
  logSummary() {
    console.group('Performance Summary');
    this.measures.forEach(measure => {
      console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}
