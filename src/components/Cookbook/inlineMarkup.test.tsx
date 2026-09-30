import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInlineMarkup, stripInlineMarkup } from './inlineMarkup';

const html = (text: string) =>
  render(<p>{renderInlineMarkup(text)}</p>).container.firstElementChild
    ?.innerHTML;

describe('renderInlineMarkup', () => {
  it('renders `code` and **bold** spans', () => {
    expect(html('Click **Publish**, then run `npm start`.')).toBe(
      'Click <strong>Publish</strong>, then run <code>npm start</code>.',
    );
  });

  it('renders code inside bold', () => {
    expect(html('Set **`--agent-id`** first.')).toBe(
      'Set <strong><code>--agent-id</code></strong> first.',
    );
  });

  it('leaves asterisks inside code literal', () => {
    expect(html('Match `**/*.ts` files.')).toBe(
      'Match <code>**/*.ts</code> files.',
    );
  });

  it('leaves unpaired marks as text', () => {
    expect(html('2 ** 3 and a stray ` tick')).toBe('2 ** 3 and a stray ` tick');
  });
});

describe('stripInlineMarkup', () => {
  it('drops both marks for plain-text contexts', () => {
    expect(
      stripInlineMarkup(
        'Click **Publish** with **`--show-json`**; match `**/*.ts`.',
      ),
    ).toBe('Click Publish with --show-json; match **/*.ts.');
  });
});
