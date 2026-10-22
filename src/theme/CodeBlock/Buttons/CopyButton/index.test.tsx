import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());
const context = vi.hoisted(() => ({ metadata: { language: 'python' } }));

vi.mock('@site/src/lib/analytics', () => ({ trackCodeCopy: trackSpy }));
vi.mock('@docusaurus/theme-common/internal', () => ({
  useCodeBlockContext: () => context,
}));
vi.mock('@theme-original/CodeBlock/Buttons/CopyButton', () => ({
  default: () => <button type="button">Copy</button>,
}));

import CopyButton from './index';

describe('CodeBlock CopyButton analytics', () => {
  beforeEach(() => {
    trackSpy.mockClear();
  });

  it('reports a copy with the code block language', () => {
    render(<CopyButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('python');
  });

  it('reports a fence without a language as undefined', () => {
    context.metadata = {} as { language: string };
    render(<CopyButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith(undefined);
  });
});
