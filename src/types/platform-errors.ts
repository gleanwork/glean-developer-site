export interface RelatedDoc {
  title: string;
  href: string;
}

export interface PlatformErrorRemediation {
  meaning: string;
  commonCauses: string[];
  clientRemediation: string[];
  adminRemediation?: string[];
  retryGuidance: string;
  relatedDocs?: RelatedDoc[];
}

export interface PlatformProblemDetailExample {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  documentation_url: string;
  request_id: string;
}

export interface PlatformErrorPage {
  code: string;
  slug: string;
  status: number;
  title: string;
  canonicalUrl: string;
  docPath: string;
  example: PlatformProblemDetailExample;
  remediation: PlatformErrorRemediation;
}

export interface PlatformErrorsData {
  generatedAt: string;
  totalCount: number;
  errors: PlatformErrorPage[];
}
