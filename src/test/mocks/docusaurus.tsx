import React from 'react';
import { vi } from 'vitest';

vi.mock('@site/src/theme/Root', () => ({
  FeatureFlagsContext: React.createContext({
    isEnabled: () => false,
    flagConfigs: {},
  }),
}));

// Mock Docusaurus Link (the real export fails to transform under vitest)
vi.mock('@docusaurus/Link', () => ({
  default: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock useBaseUrl (pulls raw-JSX Docusaurus internals under vitest)
vi.mock('@docusaurus/useBaseUrl', () => ({
  default: (url: string) => url,
}));

// Mock BrowserOnly (the real export needs the Docusaurus browser context);
// tests run in jsdom, so render the browser branch directly
vi.mock('@docusaurus/BrowserOnly', () => ({
  default: ({ children }: any) => <>{children()}</>,
}));

// Mock theme icons (react-feather bundles its own React copy, which
// React 19 rejects under vitest; the real build dedupes it fine)
vi.mock('@gleanwork/docusaurus-theme-glean/Icons', () => ({
  getIcon: (name: string) => <span data-icon={name} />,
}));

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
