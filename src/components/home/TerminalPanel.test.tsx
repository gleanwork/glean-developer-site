import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TerminalPanel from './TerminalPanel';

describe('TerminalPanel', () => {
  it('calls onCopy after the code is on the clipboard', async () => {
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
  });
});
