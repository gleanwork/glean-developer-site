import { translate } from '@docusaurus/Translate';
import FormTextInput from '@theme-original/ApiExplorer/FormTextInput';
import { type Param, setParam } from '@theme/ApiExplorer/ParamOptions/slice';
import { useTypedDispatch } from '@theme/ApiItem/hooks';
import type { ChangeEvent } from 'react';
import { useEffect, useId } from 'react';

import { parameterPlaceholder } from '@site/src/lib/unresolvedPlaceholders';

import { usePlaceholderValidation } from '../../placeholderValidation';

interface ParamProps {
  param: Param;
  label?: string;
  type?: string;
  required?: boolean;
}

function encodeValue(param: Param, value: string): string {
  if (param.in === 'path') {
    return value.replace(/\s/g, '%20');
  }
  if (param.in === 'query') {
    return encodeURIComponent(value);
  }
  return value;
}

function decodeValue(param: Param, value: string): string {
  if (param.in !== 'path' && param.in !== 'query') {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function ParamTextFormItem({
  param,
  label,
  type,
  required,
}: ParamProps): React.ReactElement {
  const dispatch = useTypedDispatch();
  const helpId = useId();
  const { clearParameterError, parameterErrors } = usePlaceholderValidation();
  const example =
    typeof param.example === 'string' || typeof param.example === 'number'
      ? String(param.example)
      : undefined;
  const storedValue = typeof param.value === 'string' ? param.value : undefined;
  const displayValue =
    storedValue !== undefined
      ? decodeValue(param, storedValue)
      : (example ?? '');
  const placeholder = example
    ? parameterPlaceholder(param.name, example)
    : undefined;
  const unresolved =
    placeholder && parameterPlaceholder(param.name, displayValue);

  useEffect(() => {
    if (storedValue === undefined && example !== undefined) {
      dispatch(
        setParam({
          ...param,
          value: encodeValue(param, example),
        }),
      );
    }
  }, [dispatch, example, param, storedValue]);

  return (
    <div
      aria-describedby={
        parameterErrors[param.name] || unresolved ? helpId : undefined
      }
      role="group"
    >
      <FormTextInput
        label={label}
        type={type}
        required={required}
        isRequired={param.required}
        paramName={param.name}
        placeholder={param.description || param.name}
        value={displayValue}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          clearParameterError(param.name);
          dispatch(
            setParam({
              ...param,
              value: encodeValue(param, event.target.value),
            }),
          );
        }}
      />
      {parameterErrors[param.name] ? (
        <div className="openapi-explorer__input-error" id={helpId} role="alert">
          {parameterErrors[param.name]}
        </div>
      ) : (
        unresolved && (
          <div className="margin-top--xs text--secondary" id={helpId}>
            {translate(
              {
                id: 'theme.openapi.placeholder.help',
                message:
                  'Replace {placeholder} with a value from your Glean instance.',
              },
              { placeholder },
            )}
          </div>
        )
      )}
    </div>
  );
}
