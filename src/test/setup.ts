import '@testing-library/jest-dom';
import { vi } from 'vitest';
import './mocks/docusaurus';

// Only run browser-specific mocks in jsdom environment
if (typeof window !== 'undefined') {
  // Mock clipboard API - make it configurable so userEvent can override it
  if (!(navigator as any).clipboard) {
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
  (window as any).location = { href: '' } as any;

  // Mock window.open
  (window as any).open = vi.fn();
}

// Mock ResizeObserver for react-tooltip
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

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
