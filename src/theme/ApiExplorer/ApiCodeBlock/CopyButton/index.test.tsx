import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const trackSpy = vi.hoisted(() => vi.fn());

vi.mock('@site/src/lib/analytics', () => ({ trackCodeCopy: trackSpy }));
vi.mock('@theme-original/ApiExplorer/ApiCodeBlock/CopyButton', () => ({
  default: () => <button type="button">Copy</button>,
}));

import CopyButton, { codeBlockLanguage } from './index';

describe('ApiCodeBlock CopyButton analytics', () => {
  beforeEach(() => {
    trackSpy.mockClear();
  });

  it('reports a copy with the language of the enclosing code block', () => {
    render(
      <div className="theme-code-block language-curl openapi-explorer__code-block-container">
        <div className="openapi-explorer__code-block-btn-group">
          <CopyButton code="curl …" />
        </div>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(trackSpy).toHaveBeenCalledExactlyOnceWith('curl');
  });

  it('has no language outside a code block', () => {
    const element = document.createElement('button');
    expect(codeBlockLanguage(element)).toBeUndefined();
  });
});
