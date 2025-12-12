export type DeprecationType = 'endpoint' | 'field' | 'parameter' | 'enum-value';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface DeprecationItem {
  id: string;
  type: DeprecationType;
  name: string;
  message: string;
  introduced: string;
  removal: string;
  docs?: string;
  /**
   * For enum-value deprecations, the specific enum value being deprecated
   */
  enumValue?: string;
}

export interface EndpointGroup {
  method: HttpMethod;
  path: string;
  deprecations: DeprecationItem[];
}

export function getLocationFromPath(path: string): string {
  if (path.startsWith('/indexing/')) {
    return 'Indexing API';
  }
  return 'Client API';
}

export interface DeprecationsData {
  endpoints: EndpointGroup[];
  generatedAt: string;
  totalCount: number;
}

export const TYPE_LABELS: Record<DeprecationType, string> = {
  endpoint: 'Endpoint',
  field: 'Field',
  parameter: 'Parameter',
  'enum-value': 'Enum Value',
};

export const TYPE_COLORS: Record<DeprecationType, string> = {
  endpoint: 'danger',
  field: 'warning',
  parameter: 'info',
  'enum-value': 'secondary',
};

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'success',
  POST: 'primary',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};
