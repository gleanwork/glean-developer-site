export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ExperimentalEndpoint {
  method: HttpMethod;
  path: string;
  operationId?: string;
  /**
   * Kebab-cased id derived from the operation id, matching the last segment of
   * the sidebar doc id (e.g. "api/platform-api/platform-agents-search").
   */
  baseId: string;
  id?: string;
  introduced?: string;
}

export interface ExperimentalData {
  endpoints: ExperimentalEndpoint[];
  generatedAt: string;
  totalCount: number;
}
