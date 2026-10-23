import { translate } from '@docusaurus/Translate';
import OriginalRequest from '@theme-original/ApiExplorer/Request';
import type { Param } from '@theme/ApiExplorer/ParamOptions/slice';
import { useTypedSelector } from '@theme/ApiItem/hooks';
import type { ComponentProps, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { statusClass, trackEvent } from '@site/src/lib/analytics';
import {
  bodyPlaceholder,
  firstParameterPlaceholder,
} from '@site/src/lib/unresolvedPlaceholders';

import { PlaceholderValidationProvider } from '../placeholderValidation';

/** The spec's operationId, or `METHOD /path` when it has none. */
function operationName(item: unknown): string {
  const operation = item as
    { operationId?: unknown; method?: unknown; path?: unknown } | undefined;
  if (typeof operation?.operationId === 'string') return operation.operationId;
  if (
    typeof operation?.method === 'string' &&
    typeof operation?.path === 'string'
  ) {
    return `${operation.method.toUpperCase()} ${operation.path}`;
  }
  return 'unknown';
}

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
  const response = useTypedSelector((state: any) => state.response);
  // Set when a request passes placeholder validation, cleared once its
  // outcome reaches the response panel.
  const awaitingResponse = useRef(false);
  const fetchingMessage = translate({
    id: 'theme.openapi.request.fetchingMessage',
    message: 'Fetching...',
  });

  // The theme reports the outcome only through the response slice: a status
  // code on a response, or no code and an error message when the request
  // never got one. While the request runs, the panel shows the fetching
  // message and still holds the previous request's code, so skip it.
  const responseValue = response?.value;
  const responseCode = response?.code;
  useEffect(() => {
    if (!awaitingResponse.current) return;
    if (responseValue === undefined || responseValue === fetchingMessage) {
      return;
    }
    awaitingResponse.current = false;
    trackEvent('api_request_sent', {
      operation: operationName(props.item),
      status_class: statusClass(responseCode),
    });
  }, [fetchingMessage, props.item, responseCode, responseValue]);

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
      awaitingResponse.current = true;
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
