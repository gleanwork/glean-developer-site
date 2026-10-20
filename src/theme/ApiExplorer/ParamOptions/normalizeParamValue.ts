/**
 * The theme seeds each parameter's `value` from `schema.default` (then
 * `example`) without converting it to a string. The request builder
 * (postman-collection) drops non-string values when it serializes them:
 * a numeric query value renders as a bare key (`?page_size`), and a boolean
 * header renders with an empty value in cURL. Upstream only normalizes
 * booleans when ParamBooleanFormItem mounts, which never happens for the
 * hidden X-Glean-Include-Experimental header.
 *
 * Returns the parameter with a string value when it holds a number or
 * boolean, or `undefined` when it needs no change.
 */
export function normalizeParamValue<T extends { value?: unknown }>(
  param: T,
): (T & { value: string }) | undefined {
  const { value } = param;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return { ...param, value: String(value) };
  }
  return undefined;
}
