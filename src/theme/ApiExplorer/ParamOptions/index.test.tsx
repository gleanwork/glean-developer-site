import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const explorerState = {
  params: {
    path: [] as Array<Record<string, unknown>>,
    query: [] as Array<Record<string, unknown>>,
    cookie: [] as Array<Record<string, unknown>>,
    header: [] as Array<Record<string, unknown>>,
  },
};

const dispatchSpy = vi.hoisted(() => vi.fn());

vi.mock('@theme/ApiItem/hooks', () => ({
  useTypedDispatch: () => dispatchSpy,
  useTypedSelector: (selector: (state: typeof explorerState) => unknown) =>
    selector(explorerState),
}));

vi.mock('@docusaurus/Translate', () => ({
  translate: ({ message }: { message: string }) => message,
}));

vi.mock('@theme/translationIds', () => ({
  OPENAPI_PARAM_OPTIONS: {
    HIDE_OPTIONAL: 'hide-optional',
    SHOW_OPTIONAL: 'show-optional',
  },
}));

vi.mock('@theme/ApiExplorer/FormItem', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const booleanSpy = vi.fn(({ param }: { param: { name: string } }) => (
  <select aria-label={param.name} data-testid={`ctrl-${param.name}`} />
));

vi.mock(
  '@theme/ApiExplorer/ParamOptions/ParamFormItems/ParamBooleanFormItem',
  () => ({
    default: (props: { param: { name: string } }) => booleanSpy(props),
  }),
);

vi.mock(
  '@theme/ApiExplorer/ParamOptions/ParamFormItems/ParamTextFormItem',
  () => ({
    default: ({ param }: { param: { name: string } }) => (
      <input aria-label={param.name} data-testid={`ctrl-${param.name}`} />
    ),
  }),
);

vi.mock(
  '@theme/ApiExplorer/ParamOptions/ParamFormItems/ParamArrayFormItem',
  () => ({
    default: ({ param }: { param: { name: string } }) => (
      <input aria-label={param.name} data-testid={`ctrl-${param.name}`} />
    ),
  }),
);

vi.mock(
  '@theme/ApiExplorer/ParamOptions/ParamFormItems/ParamSelectFormItem',
  () => ({
    default: ({ param }: { param: { name: string } }) => (
      <select aria-label={param.name} data-testid={`ctrl-${param.name}`} />
    ),
  }),
);

vi.mock(
  '@theme/ApiExplorer/ParamOptions/ParamFormItems/ParamMultiSelectFormItem',
  () => ({
    default: ({ param }: { param: { name: string } }) => (
      <select aria-label={param.name} data-testid={`ctrl-${param.name}`} />
    ),
  }),
);

describe('ParamOptions explorer visibility', () => {
  beforeEach(() => {
    booleanSpy.mockClear();
    dispatchSpy.mockClear();
    explorerState.params = {
      path: [],
      query: [],
      cookie: [],
      header: [],
    };
  });

  it('does not mount a form controller for the experimental header', async () => {
    explorerState.params.header = [
      {
        in: 'header',
        name: 'X-Glean-Include-Experimental',
        required: true,
        schema: { type: 'boolean', default: true },
        value: 'true',
      },
    ];

    const { default: ParamOptions } = await import('./index');
    const { container } = render(<ParamOptions />);

    expect(container).toBeEmptyDOMElement();
    expect(booleanSpy).not.toHaveBeenCalled();
    expect(
      screen.queryByLabelText('X-Glean-Include-Experimental'),
    ).not.toBeInTheDocument();
  });

  it('still renders unrelated parameter controls', async () => {
    explorerState.params.query = [
      {
        in: 'query',
        name: 'q',
        required: true,
        schema: { type: 'string' },
      },
    ];
    explorerState.params.header = [
      {
        in: 'header',
        name: 'X-Glean-Include-Experimental',
        required: true,
        schema: { type: 'boolean', default: true },
        value: 'true',
      },
      {
        in: 'header',
        name: 'Accept',
        required: true,
        schema: { type: 'string' },
      },
    ];

    const { default: ParamOptions } = await import('./index');
    render(<ParamOptions />);

    expect(screen.getByTestId('ctrl-q')).toBeInTheDocument();
    expect(screen.getByTestId('ctrl-Accept')).toBeInTheDocument();
    expect(
      screen.queryByTestId('ctrl-X-Glean-Include-Experimental'),
    ).not.toBeInTheDocument();
    expect(booleanSpy).not.toHaveBeenCalled();
  });

  it('stores number and boolean defaults as strings', async () => {
    const pageSize = {
      in: 'query',
      name: 'page_size',
      required: false,
      schema: { type: 'integer', default: 50 },
      value: 50,
    };
    const experimental = {
      in: 'header',
      name: 'X-Glean-Include-Experimental',
      required: true,
      schema: { type: 'boolean', default: true },
      value: true,
    };
    const cursor = {
      in: 'query',
      name: 'cursor',
      required: false,
      schema: { type: 'string' },
    };
    explorerState.params.query = [pageSize, cursor];
    explorerState.params.header = [experimental];

    const { default: ParamOptions } = await import('./index');
    render(<ParamOptions />);

    const payloads = dispatchSpy.mock.calls.map(([action]) => action.payload);
    expect(payloads).toEqual([
      { ...pageSize, value: '50' },
      { ...experimental, value: 'true' },
    ]);
  });
});
