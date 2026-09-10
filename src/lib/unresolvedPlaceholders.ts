export function parameterPlaceholder(
  name: string,
  value: unknown,
): string | undefined {
  return value === `{${name}}` ? value : undefined;
}

interface ParameterValue {
  example?: unknown;
  in: string;
  name: string;
  value?: unknown;
}

function decodedValue(parameter: ParameterValue): unknown {
  if (typeof parameter.value !== 'string') {
    return parameter.example;
  }
  if (parameter.in !== 'path' && parameter.in !== 'query') {
    return parameter.value;
  }
  try {
    return decodeURIComponent(parameter.value);
  } catch {
    return parameter.value;
  }
}

export function firstParameterPlaceholder(
  parameters: ParameterValue[],
): { name: string; value: string } | undefined {
  for (const parameter of parameters) {
    const authored = parameterPlaceholder(
      parameter.name,
      parameter.example,
    );
    if (authored && decodedValue(parameter) === authored) {
      return { name: parameter.name, value: authored };
    }
  }
  return undefined;
}

function findInValue(
  value: unknown,
  propertyName?: string,
): string | undefined {
  if (typeof value === 'string') {
    return propertyName && value === `{${propertyName}}`
      ? value
      : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const placeholder = findInValue(item, propertyName);
      if (placeholder) {
        return placeholder;
      }
    }
    return undefined;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const placeholder = findInValue(child, key);
      if (placeholder) {
        return placeholder;
      }
    }
  }

  return undefined;
}

export function bodyPlaceholder(source: string): string | undefined {
  try {
    return findInValue(JSON.parse(source));
  } catch {
    return undefined;
  }
}
