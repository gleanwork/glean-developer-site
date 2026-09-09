import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Param } from '@theme/ApiExplorer/ParamOptions/slice';

import { PlaceholderValidationProvider } from '../../placeholderValidation';

const dispatchState = vi.hoisted(() => ({
  apply: (_action: { payload: Param }) => {},
}));

vi.mock('@theme/ApiItem/hooks', () => ({
  useTypedDispatch: () => (action: { payload: Param }) =>
    dispatchState.apply(action),
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

vi.mock('@theme-original/ApiExplorer/FormTextInput', () => ({
  default: ({
    label,
    onChange,
    value,
  }: {
    label: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    value: string;
  }) => (
    <>
      <label htmlFor={label}>{label}</label>
      <input id={label} name={label} onChange={onChange} value={value} />
    </>
  ),
}));

import ParamTextFormItem from './ParamTextFormItem';

function Harness({
  initialParam,
  parameterErrors = {},
}: {
  initialParam: Param;
  parameterErrors?: Record<string, string>;
}): React.ReactElement {
  const [param, setParam] = useState(initialParam);
  dispatchState.apply = (action) => setParam(action.payload);

  return (
    <PlaceholderValidationProvider
      value={{
        clearBodyError: () => {},
        clearParameterError: () => {},
        parameterErrors,
      }}
    >
      <ParamTextFormItem
        param={param}
        label={param.name}
        type={param.in}
        required={param.required}
      />
    </PlaceholderValidationProvider>
  );
}

describe('ParamTextFormItem', () => {
  beforeEach(() => {
    dispatchState.apply = () => {};
  });

  it('prefills a caller placeholder and renders its help', () => {
    render(
      <Harness
        initialParam={{
          in: 'path',
          name: 'agent_id',
          required: true,
          example: '{agent_id}',
          schema: { type: 'string' },
        }}
      />,
    );

    expect(screen.getByLabelText('agent_id')).toHaveValue('{agent_id}');
    expect(
      screen.getByText(
        'Replace {agent_id} with a value from your Glean instance.',
      ),
    ).toBeInTheDocument();
  });

  it('removes placeholder help after the value changes', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initialParam={{
          in: 'path',
          name: 'agent_id',
          required: true,
          example: '{agent_id}',
          schema: { type: 'string' },
        }}
      />,
    );

    await user.clear(screen.getByLabelText('agent_id'));
    await user.type(screen.getByLabelText('agent_id'), 'real-agent');

    expect(screen.getByLabelText('agent_id')).toHaveValue('real-agent');
    expect(screen.queryByText(/Replace/)).not.toBeInTheDocument();
  });

  it('renders an external validation error', () => {
    render(
      <Harness
        initialParam={{
          in: 'path',
          name: 'agent_id',
          example: '{agent_id}',
          schema: { type: 'string' },
        }}
        parameterErrors={{
          agent_id: 'Replace {agent_id} before sending.',
        }}
      />,
    );

    expect(
      screen.getByText('Replace {agent_id} before sending.'),
    ).toHaveAttribute('role', 'alert');
  });

  it('prefills a concrete numeric example without help', () => {
    render(
      <Harness
        initialParam={{
          in: 'path',
          name: 'version',
          required: true,
          example: 1,
          schema: { type: 'integer' },
        }}
      />,
    );

    expect(screen.getByLabelText('version')).toHaveValue('1');
    expect(screen.queryByText(/Replace/)).not.toBeInTheDocument();
  });

  it('does not prefill schema examples', () => {
    render(
      <Harness
        initialParam={{
          in: 'path',
          name: 'agent_id',
          required: true,
          schema: { type: 'string', example: '{agent_id}' },
        }}
      />,
    );

    expect(screen.getByLabelText('agent_id')).toHaveValue('');
  });
});
