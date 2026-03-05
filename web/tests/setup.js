/**
 * Test Environment Setup
 * 
 * Configures the test environment and provides global utilities
 */

import { TextEncoder, TextDecoder } from 'util';
import fetch, { Headers, Request, Response } from 'node-fetch';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill fetch for Node.js environment (needed for integration tests)
global.fetch = fetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// Mock window.ENV for tests
global.window = global.window || {};
global.window.ENV = {
  API_BASE_URL: 'http://localhost:8080',
};

// Add custom matchers or global test utilities here if needed
