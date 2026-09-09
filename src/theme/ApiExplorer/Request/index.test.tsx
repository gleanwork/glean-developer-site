import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const explorerState = vi.hoisted(() => ({
  body: {
    type: 'raw',
    content: { type: 'string', value: '{}' },
  },
  params: {
    cookie: [] as Array<Record<string, unknown>>,
    header: [] as Array<Record<string, unknown>>,
    path: [] as Array<Record<string, unknown>>,
    query: [] as Array<Record<string, unknown>>,
  },
}));

const submitSpy = vi.hoisted(() => vi.fn());

vi.mock('@theme/ApiItem/hooks', () => ({
  useTypedSelector: (selector: (state: typeof explorerState) => unknown) =>
    selector(explorerState),
}));

vi.mock('@docusaurus/Translate', () => ({
  translate: (
    { message }: { message: string },
    values?: Record<string, string>,
  ) =>
    Object.entries(values ?? {}).reduce(
      (result, [key, value]) => result.replace(`{${key}}`, value),
      message,
    ),
}));

vi.mock('@theme-original/ApiExplorer/Request', async () => {
  const { usePlaceholderValidation } =
    await import('@site/src/theme/ApiExplorer/placeholderValidation');
  return {
    default: () => {
      const { bodyError, parameterErrors } = usePlaceholderValidation();
      return (
        <form aria-label="request" onSubmit={submitSpy}>
          <input name="agent_id" />
          {Object.values(parameterErrors).map((error) => (
            <div key={error} role="alert">
              {error}
            </div>
          ))}
          {bodyError && <div role="alert">{bodyError}</div>}
          <button type="submit">Send</button>
        </form>
      );
    },
  };
});

import Request from './index';

describe('Request placeholder validation', () => {
  beforeEach(() => {
    submitSpy.mockClear();
    explorerState.params = {
      cookie: [],
      header: [],
      path: [],
      query: [],
    };
    explorerState.body = {
      type: 'raw',
      content: { type: 'string', value: '{}' },
    };
  });

  it('blocks and focuses an unresolved parameter', () => {
    explorerState.params.path = [
      {
        example: '{agent_id}',
        in: 'path',
        name: 'agent_id',
        value: '{agent_id}',
      },
    ];
    render(<Request item={{} as never} />);

    fireEvent.submit(screen.getByRole('form', { name: 'request' }));

    expect(submitSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Replace {agent_id} before sending.',
    );
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('blocks an unresolved JSON body value', () => {
    explorerState.body = {
      type: 'raw',
      content: {
        type: 'string',
        value: '{"inputs":{"repository":"{repository}"}}',
      },
    };
    render(<Request item={{} as never} />);

    fireEvent.submit(screen.getByRole('form', { name: 'request' }));

    expect(submitSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Replace {repository} in the request body before sending.',
    );
  });

  it('allows braces inside a longer body string', () => {
    explorerState.body = {
      type: 'raw',
      content: {
        type: 'string',
        value: '{"input":"summarize {topic}"}',
      },
    };
    render(<Request item={{} as never} />);

    fireEvent.submit(screen.getByRole('form', { name: 'request' }));

    expect(submitSpy).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
