import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TerminalPanel, { panelLanguage } from './TerminalPanel';

const trackSpy = vi.hoisted(() => vi.fn());
vi.mock('@site/src/lib/analytics', () => ({ trackCodeCopy: trackSpy }));

describe('panelLanguage', () => {
  it.each([
    ['tools.py', 'py'],
    ['index.TS', 'ts'],
    ['.gitignore', 'gitignore'],
    ['terminal', 'shell'],
    ['Claude Code', 'shell'],
  ])('%s -> %s', (filename, expected) => {
    expect(panelLanguage(filename)).toBe(expected);
  });
});

describe('TerminalPanel', () => {
  beforeEach(() => {
    trackSpy.mockClear();
  });

  it('reports the copy and calls onCopy after the code is on the clipboard', async () => {
    const onCopy = vi.fn();
    render(
      <TerminalPanel
        code="npx glean"
        copy
        filename="terminal"
        onCopy={onCopy}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => expect(onCopy).toHaveBeenCalledOnce());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('npx glean');
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('shell');
  });

  it('does not call onCopy when the clipboard is unavailable', async () => {
    const onCopy = vi.fn();
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
      new Error('denied'),
    );
    render(
      <TerminalPanel
        code="npx glean"
        copy
        filename="terminal"
        onCopy={onCopy}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalled(),
    );
    expect(onCopy).not.toHaveBeenCalled();
    expect(trackSpy).not.toHaveBeenCalled();
  });
});
