import React, { useEffect, useMemo, useRef } from 'react';
import OriginalServer from '@theme-original/ApiExplorer/Server';
import TenantProfileControl from '@site/src/components/TenantProfile';
import { useTenantApiPersonalizationEnabled } from '@site/src/lib/tenantPersonalizationFlag';
import {
  API_URL_PLACEHOLDERS,
  normalizeOpenApiServerOption,
  resolveOpenApiServerUrl,
  tenantApiUrlFromState,
  useTenantProfile,
} from '@site/src/lib/tenantProfile';
import { useTypedDispatch, useTypedSelector } from '@theme/ApiItem/hooks';
import { setAuthData } from '@theme/ApiExplorer/Authorization/slice';
import {
  setCustomServer,
  setServer,
  setServerVariable,
} from '@theme/ApiExplorer/Server/slice';

const DEFAULT_API_URL = API_URL_PLACEHOLDERS[0];

function PersonalizedServer({
  serverBeforeActivation,
}: {
  serverBeforeActivation: any;
}): React.ReactElement | null {
  const dispatch = useTypedDispatch();
  const tenant = useTenantProfile();
  const value = useTypedSelector((state: any) => state.server.value);
  const options = useTypedSelector((state: any) => state.server.options);
  const auth = useTypedSelector((state: any) => state.auth);
  const apiUrl = tenantApiUrlFromState(tenant);
  const effectiveServerUrl = useMemo(
    () => resolveOpenApiServerUrl(value),
    [value],
  );
  const previousTarget = useRef(
    resolveOpenApiServerUrl(serverBeforeActivation) ??
      effectiveServerUrl ??
      apiUrl ??
      DEFAULT_API_URL,
  );

  useEffect(() => {
    if (options.length === 0) return;
    const target = apiUrl ?? DEFAULT_API_URL;
    const defaultOption = normalizeOpenApiServerOption(options[0], target);
    if (!value || value.url !== defaultOption.url) {
      const isOriginalOption = options.some(
        (option: any) => option.url === defaultOption.url,
      );
      dispatch(
        isOriginalOption
          ? setServer(JSON.stringify(defaultOption))
          : setCustomServer(JSON.stringify(defaultOption)),
      );
      return;
    }

    const variableKey = value.variables?.serverUrl
      ? 'serverUrl'
      : value.variables?.instance
        ? 'instance'
        : undefined;
    if (!variableKey) return;

    const current = value.variables?.[variableKey]?.default;
    if (current !== target) {
      dispatch(
        setServerVariable(
          JSON.stringify({
            key: variableKey,
            value:
              variableKey === 'instance'
                ? new URL(target).hostname.replace(/-be\.glean\.com$/, '')
                : target,
          }),
        ),
      );
    }
  }, [apiUrl, dispatch, options, value]);

  useEffect(() => {
    const target = apiUrl ?? DEFAULT_API_URL;
    if (previousTarget.current !== target) {
      const token = auth?.data?.APIToken?.token;
      if (token) {
        dispatch(
          setAuthData({ scheme: 'APIToken', key: 'token', value: undefined }),
        );
      }
      previousTarget.current = target;
    }
  }, [apiUrl, auth?.data?.APIToken?.token, dispatch]);

  if (options.length === 0) return null;

  return (
    <div className="openapi-explorer__server-container">
      <TenantProfileControl compact />
      <small className="openapi-explorer__server-description">
        Request URL: {apiUrl ?? effectiveServerUrl ?? DEFAULT_API_URL}
      </small>
    </div>
  );
}

export default function Server(
  props: React.ComponentProps<typeof OriginalServer>,
): React.ReactElement | null {
  const currentServer = useTypedSelector((state: any) => state.server.value);
  const enabled = useTenantApiPersonalizationEnabled();
  const serverBeforeActivation = useRef(currentServer);
  if (!enabled && currentServer) {
    serverBeforeActivation.current = currentServer;
  }
  return enabled ? (
    <PersonalizedServer
      serverBeforeActivation={serverBeforeActivation.current}
    />
  ) : (
    <OriginalServer {...props} />
  );
}
