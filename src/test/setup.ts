import '@testing-library/jest-dom';
import { vi } from 'vitest';
import './mocks/docusaurus';

// Mock clipboard API - make it configurable so userEvent can override it
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('')),
    },
    configurable: true,
    writable: true,
  });
}

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

// Mock window.open
window.open = vi.fn();

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
