import React from 'react';
import { vi } from 'vitest';

// Mock Docusaurus Tabs components
vi.mock('@theme/Tabs', () => ({
  default: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@theme/TabItem', () => ({
  default: ({ children, value, label }: any) => (
    <div data-tab={value} aria-label={label}>
      {label && <button>{label}</button>}
      {children}
    </div>
  ),
}));

// Mock Admonition
vi.mock('@theme/Admonition', () => ({
  default: ({ children, type, title }: any) => (
    <div className={`admonition admonition-${type}`}>
      {title && <div className="admonition-title">{title}</div>}
      {children}
    </div>
  ),
}));
