/**
 * Performance Utilities Tests
 */

import { 
  debounce, 
  throttle, 
  RequestDeduplicator, 
  DOMBatcher,
  PerformanceMonitor 
} from '../../../js/utils/performance.js';

describe('Performance Utilities', () => {
  describe('debounce', () => {
    test('should create a debounced function', () => {
      const func = () => {};
      const debounced = debounce(func, 100);
      
      expect(typeof debounced).toBe('function');
    });
  });

  describe('throttle', () => {
    test('should create a throttled function', () => {
      const func = () => {};
      const throttled = throttle(func, 100);
      
      expect(typeof throttled).toBe('function');
    });
  });

  describe('RequestDeduplicator', () => {
    test('should deduplicate concurrent requests', async () => {
      const deduplicator = new RequestDeduplicator();
      let callCount = 0;
      const requestFn = () => {
        callCount++;
        return Promise.resolve('result');
      };

      const promise1 = deduplicator.dedupe('key1', requestFn);
      const promise2 = deduplicator.dedupe('key1', requestFn);
      const promise3 = deduplicator.dedupe('key1', requestFn);

      // Should only call requestFn once
      expect(callCount).toBe(1);

      // All promises should resolve to the same result
      const results = await Promise.all([promise1, promise2, promise3]);
      expect(results).toEqual(['result', 'result', 'result']);
    });

    test('should allow different keys to execute separately', async () => {
      const deduplicator = new RequestDeduplicator();
      let callCount1 = 0;
      let callCount2 = 0;
      
      const requestFn1 = () => {
        callCount1++;
        return Promise.resolve('result1');
      };
      const requestFn2 = () => {
        callCount2++;
        return Promise.resolve('result2');
      };

      const promise1 = deduplicator.dedupe('key1', requestFn1);
      const promise2 = deduplicator.dedupe('key2', requestFn2);

      expect(callCount1).toBe(1);
      expect(callCount2).toBe(1);

      const results = await Promise.all([promise1, promise2]);
      expect(results).toEqual(['result1', 'result2']);
    });

    test('should remove request from pending after completion', async () => {
      const deduplicator = new RequestDeduplicator();
      let callCount = 0;
      const requestFn = () => {
        callCount++;
        return Promise.resolve('result');
      };

      await deduplicator.dedupe('key1', requestFn);
      expect(deduplicator.isPending('key1')).toBe(false);

      // Should allow new request with same key
      await deduplicator.dedupe('key1', requestFn);
      expect(callCount).toBe(2);
    });

    test('should handle request failures', async () => {
      const deduplicator = new RequestDeduplicator();
      const error = new Error('Request failed');
      const requestFn = () => Promise.reject(error);

      await expect(deduplicator.dedupe('key1', requestFn)).rejects.toThrow('Request failed');
      
      // Should remove from pending even on failure
      expect(deduplicator.isPending('key1')).toBe(false);
    });

    test('should check if request is pending', () => {
      const deduplicator = new RequestDeduplicator();
      const requestFn = () => new Promise(() => {}); // Never resolves

      deduplicator.dedupe('key1', requestFn);
      expect(deduplicator.isPending('key1')).toBe(true);
      expect(deduplicator.isPending('key2')).toBe(false);
    });

    test('should clear all pending requests', () => {
      const deduplicator = new RequestDeduplicator();
      const requestFn = () => new Promise(() => {});

      deduplicator.dedupe('key1', requestFn);
      deduplicator.dedupe('key2', requestFn);
      
      expect(deduplicator.isPending('key1')).toBe(true);
      expect(deduplicator.isPending('key2')).toBe(true);

      deduplicator.clear();
      
      expect(deduplicator.isPending('key1')).toBe(false);
      expect(deduplicator.isPending('key2')).toBe(false);
    });
  });

  describe('DOMBatcher', () => {
    test('should create a DOM batcher', () => {
      const batcher = new DOMBatcher();
      expect(batcher).toBeDefined();
      expect(typeof batcher.schedule).toBe('function');
    });

    test('should schedule updates', () => {
      const batcher = new DOMBatcher();
      const update = () => {};
      
      expect(() => {
        batcher.schedule(update);
      }).not.toThrow();
    });

    test('should cancel pending updates', () => {
      const batcher = new DOMBatcher();
      const update = () => {};
      
      batcher.schedule(update);
      expect(() => {
        batcher.cancel();
      }).not.toThrow();
    });
  });

  describe('PerformanceMonitor', () => {
    test('should mark performance points', () => {
      const monitor = new PerformanceMonitor();
      
      monitor.mark('start');
      monitor.mark('end');

      expect(monitor.marks.has('start')).toBe(true);
      expect(monitor.marks.has('end')).toBe(true);
    });

    test('should measure time between marks', () => {
      const monitor = new PerformanceMonitor();
      
      monitor.mark('start');
      // Small delay
      const startTime = performance.now();
      while (performance.now() - startTime < 10) {
        // Busy wait
      }
      monitor.mark('end');

      const duration = monitor.measure('test', 'start', 'end');
      expect(duration).toBeGreaterThan(0);
    });

    test('should handle missing start mark', () => {
      const monitor = new PerformanceMonitor();

      const duration = monitor.measure('test', 'nonexistent');
      expect(duration).toBe(0);
    });

    test('should store measures', () => {
      const monitor = new PerformanceMonitor();
      
      monitor.mark('start');
      monitor.mark('end');
      
      monitor.measure('test1', 'start', 'end');
      monitor.measure('test2', 'start', 'end');

      const measures = monitor.getMeasures();
      expect(measures).toHaveLength(2);
      expect(measures[0].name).toBe('test1');
      expect(measures[1].name).toBe('test2');
    });

    test('should clear marks and measures', () => {
      const monitor = new PerformanceMonitor();
      
      monitor.mark('start');
      monitor.mark('end');
      monitor.measure('test', 'start', 'end');

      monitor.clear();

      expect(monitor.marks.size).toBe(0);
      expect(monitor.measures).toHaveLength(0);
    });
  });
});
