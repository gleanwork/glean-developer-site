import { translate } from '@docusaurus/Translate';
import OriginalRequest from '@theme-original/ApiExplorer/Request';
import type { Param } from '@theme/ApiExplorer/ParamOptions/slice';
import { useTypedSelector } from '@theme/ApiItem/hooks';
import type { ComponentProps, FormEvent } from 'react';
import { useMemo, useState } from 'react';

import {
  bodyPlaceholder,
  firstParameterPlaceholder,
} from '@site/src/lib/unresolvedPlaceholders';

import { PlaceholderValidationProvider } from '../placeholderValidation';

export default function Request(
  props: ComponentProps<typeof OriginalRequest>,
): React.ReactElement {
  const pathParams = useTypedSelector((state: any) => state.params.path);
  const queryParams = useTypedSelector((state: any) => state.params.query);
  const cookieParams = useTypedSelector((state: any) => state.params.cookie);
  const headerParams = useTypedSelector((state: any) => state.params.header);
  const body = useTypedSelector((state: any) => state.body);
  const [parameterErrors, setParameterErrors] = useState<
    Record<string, string>
  >({});
  const [bodyError, setBodyError] = useState<string>();

  const parameters = useMemo(
    () =>
      [
        ...pathParams,
        ...queryParams,
        ...cookieParams,
        ...headerParams,
      ] as Param[],
    [cookieParams, headerParams, pathParams, queryParams],
  );

  const onSubmitCapture = (event: FormEvent<HTMLDivElement>) => {
    const parameter = firstParameterPlaceholder(parameters);
    const source =
      body?.type === 'raw' &&
      body.content?.type === 'string' &&
      typeof body.content.value === 'string'
        ? body.content.value
        : undefined;
    const bodyValue = source ? bodyPlaceholder(source) : undefined;
    if (!parameter && !bodyValue) {
      setParameterErrors({});
      setBodyError(undefined);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setParameterErrors(
      parameter
        ? {
            [parameter.name]: translate(
              {
                id: 'theme.openapi.placeholder.error',
                message: 'Replace {placeholder} before sending.',
              },
              { placeholder: parameter.value },
            ),
          }
        : {},
    );
    setBodyError(
      bodyValue
        ? translate(
            {
              id: 'theme.openapi.bodyPlaceholder.error',
              message:
                'Replace {placeholder} in the request body before sending.',
            },
            { placeholder: bodyValue },
          )
        : undefined,
    );

    if (parameter && event.target instanceof HTMLFormElement) {
      const input = event.target.elements.namedItem(parameter.name);
      if (input instanceof HTMLElement) {
        input.focus();
      }
    }
  };

  return (
    <PlaceholderValidationProvider
      value={{
        bodyError,
        clearBodyError: () => setBodyError(undefined),
        clearParameterError: (name) =>
          setParameterErrors((current) => {
            if (!current[name]) {
              return current;
            }
            const next = { ...current };
            delete next[name];
            return next;
          }),
        parameterErrors,
      }}
    >
      <div onSubmitCapture={onSubmitCapture}>
        <OriginalRequest {...props} />
      </div>
    </PlaceholderValidationProvider>
  );
}
