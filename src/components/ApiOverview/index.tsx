import React from 'react';
import Link from '@docusaurus/Link';
import CardGroup from '@theme/CardGroup';
import Card from '@theme/Card';
import styles from './styles.module.css';
import { getEndpointsForApi } from '../../utils/apiData';

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  description?: string;
  operationId: string;
}

interface UseCase {
  title: string;
  description: string;
  icon?: string;
  iconSet?: 'feather' | 'glean';
}

interface ApiOverviewProps {
  title: string;
  description: string;
  useCases: UseCase[];
  apiFamily: string;
  apiType?: 'client-api' | 'indexing-api';
}

function MethodBadge({ method }: { method: string }) {
  const methodClass = method.toLowerCase();
  const badgeClass = `${styles.methodBadge} ${styles[methodClass] || styles.default}`;

  return <span className={badgeClass}>{method}</span>;
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function getDocLinkForEndpoint(
  apiType: string,
  apiFamily: string,
  operationId: string,
): string {
  if (apiType === 'indexing-api') {
    const kebabCaseId = camelToKebab(operationId);
    return `/api/indexing-api/${kebabCaseId}`;
  }

  const kebabCaseId = camelToKebab(operationId);
  return `/api/client-api/${apiFamily.toLowerCase()}/${kebabCaseId}`;
}

function getIndexingApiEndpoints(apiFamily: string): Endpoint[] {
  // For indexing API, we'll extract endpoints from the sidebar structure
  // This is a simplified approach since the indexing API endpoints are auto-generated
  const indexingEndpoints: { [key: string]: Endpoint[] } = {
    authentication: [
      {
        method: 'POST',
        path: '/api/index/v1/rotatetoken',
        summary: 'Rotate token',
        operationId: 'rotate-token',
      },
    ],
    datasources: [
      {
        method: 'POST',
        path: '/api/index/v1/adddatasource',
        summary: 'Add or update datasource',
        operationId: 'add-or-update-datasource',
      },
      {
        method: 'POST',
        path: '/api/index/v1/getdatasourceconfig',
        summary: 'Get datasource config',
        operationId: 'get-datasource-config',
      },
    ],
    documents: [
      {
        method: 'POST',
        path: '/api/index/v1/indexdocument',
        summary: 'Index document',
        operationId: 'index-document',
      },
      {
        method: 'POST',
        path: '/api/index/v1/indexdocuments',
        summary: 'Index documents',
        operationId: 'index-documents',
      },
      {
        method: 'POST',
        path: '/api/index/v1/bulkindexdocuments',
        summary: 'Bulk index documents',
        operationId: 'bulk-index-documents',
      },
      {
        method: 'POST',
        path: '/api/index/v1/updatedocumentpermissions',
        summary: 'Update document permissions',
        operationId: 'update-document-permissions',
      },
      {
        method: 'POST',
        path: '/api/index/v1/uploaddocuments',
        summary: 'Schedules the processing of uploaded documents',
        operationId: 'schedules-the-processing-of-uploaded-documents',
      },
      {
        method: 'POST',
        path: '/api/index/v1/deletedocument',
        summary: 'Delete document',
        operationId: 'delete-document',
      },
    ],
    people: [
      {
        method: 'POST',
        path: '/api/index/v1/indexemployee',
        summary: 'Index employee',
        operationId: 'index-employee',
      },
      {
        method: 'POST',
        path: '/api/index/v1/bulkindexemployees',
        summary: 'Bulk index employees',
        operationId: 'bulk-index-employees',
      },
      {
        method: 'POST',
        path: '/api/index/v1/uploademployees',
        summary: 'Schedules the processing of uploaded employees and teams',
        operationId: 'schedules-the-processing-of-uploaded-employees-and-teams',
      },
      {
        method: 'POST',
        path: '/api/index/v1/deleteemployee',
        summary: 'Delete employee',
        operationId: 'delete-employee',
      },
      {
        method: 'POST',
        path: '/api/index/v1/indexteam',
        summary: 'Index team',
        operationId: 'index-team',
      },
      {
        method: 'POST',
        path: '/api/index/v1/deleteteam',
        summary: 'Delete team',
        operationId: 'delete-team',
      },
      {
        method: 'POST',
        path: '/api/index/v1/bulkindexteams',
        summary: 'Bulk index teams',
        operationId: 'bulk-index-teams',
      },
    ],
    permissions: [
      {
        method: 'POST',
        path: '/api/index/v1/indexuser',
        summary: 'Index user',
        operationId: 'index-user',
      },
      {
        method: 'POST',
        path: '/api/index/v1/bulkindexusers',
        summary: 'Bulk index users',
        operationId: 'bulk-index-users',
      },
      {
        method: 'POST',
        path: '/api/index/v1/indexgroup',
        summary: 'Index group',
        operationId: 'index-group',
      },
      {
        method: 'POST',
        path: '/api/index/v1/bulkindexgroups',
        summary: 'Bulk index groups',
        operationId: 'bulk-index-groups',
      },
      {
        method: 'POST',
        path: '/api/index/v1/indexmembership',
        summary: 'Index membership',
        operationId: 'index-membership',
      },
      {
        method: 'POST',
        path: '/api/index/v1/bulkindexmemberships',
        summary: 'Bulk index memberships for a group',
        operationId: 'bulk-index-memberships-for-a-group',
      },
      {
        method: 'POST',
        path: '/api/index/v1/uploadmemberships',
        summary: 'Schedules the processing of group memberships',
        operationId: 'schedules-the-processing-of-group-memberships',
      },
      {
        method: 'POST',
        path: '/api/index/v1/deleteuser',
        summary: 'Delete user',
        operationId: 'delete-user',
      },
      {
        method: 'POST',
        path: '/api/index/v1/deletegroup',
        summary: 'Delete group',
        operationId: 'delete-group',
      },
      {
        method: 'POST',
        path: '/api/index/v1/deletemembership',
        summary: 'Delete membership',
        operationId: 'delete-membership',
      },
      {
        method: 'POST',
        path: '/api/index/v1/betausers',
        summary: 'Beta users',
        operationId: 'beta-users',
      },
    ],
    shortcuts: [
      {
        method: 'POST',
        path: '/api/index/v1/bulkindexshortcuts',
        summary: 'Bulk index external shortcuts',
        operationId: 'bulk-index-external-shortcuts',
      },
      {
        method: 'POST',
        path: '/api/index/v1/uploadshortcuts',
        summary: 'Upload shortcuts',
        operationId: 'upload-shortcuts',
      },
    ],
    troubleshooting: [
      {
        method: 'POST',
        path: '/api/index/v1/getdatasourcestatus',
        summary: 'Beta: Get datasource status',
        operationId: 'beta-get-datasource-status',
      },
      {
        method: 'POST',
        path: '/api/index/v1/getdocumentinfo',
        summary: 'Beta: Get document information',
        operationId: 'beta-get-document-information',
      },
      {
        method: 'POST',
        path: '/api/index/v1/getdocumentsinfo',
        summary: 'Beta: Get information of a batch of documents',
        operationId: 'beta-get-information-of-a-batch-of-documents',
      },
      {
        method: 'POST',
        path: '/api/index/v1/getuserinfo',
        summary: 'Beta: Get user information',
        operationId: 'beta-get-user-information',
      },
      {
        method: 'POST',
        path: '/api/index/v1/checkdocumentaccess',
        summary: 'Check document access',
        operationId: 'check-document-access',
      },
      {
        method: 'POST',
        path: '/api/index/v1/getdocumentuploadstatus',
        summary: 'Get document upload and indexing status',
        operationId: 'get-document-upload-and-indexing-status',
      },
      {
        method: 'POST',
        path: '/api/index/v1/getdocumentcount',
        summary: 'Get document count',
        operationId: 'get-document-count',
      },
      {
        method: 'POST',
        path: '/api/index/v1/getusercount',
        summary: 'Get user count',
        operationId: 'get-user-count',
      },
    ],
  };

  return indexingEndpoints[apiFamily] || [];
}

export default function ApiOverview({
  title,
  description,
  useCases,
  apiFamily,
  apiType = 'client-api',
}: ApiOverviewProps) {
  const endpoints =
    apiType === 'indexing-api'
      ? getIndexingApiEndpoints(apiFamily)
      : getEndpointsForApi(apiFamily);

  return (
    <div>
      <p className="margin-bottom--lg">{description}</p>

      <div className="margin-bottom--xl">
        <h2>Use Cases</h2>
        <CardGroup>
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              title={useCase.title}
              icon={useCase.icon}
              iconSet={useCase.iconSet}
            >
              {useCase.description}
            </Card>
          ))}
        </CardGroup>
      </div>

      {endpoints.length > 0 && (
        <div className="margin-bottom--xl">
          <h2>API Endpoints</h2>
          <div className="table-responsive">
            <table className={`table table--striped ${styles.endpointsTable}`}>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Endpoint</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint, index) => {
                  const docLink = getDocLinkForEndpoint(
                    apiType,
                    apiFamily,
                    endpoint.operationId,
                  );
                  return (
                    <tr key={index}>
                      <td className="text--center">
                        <MethodBadge method={endpoint.method} />
                      </td>
                      <td>
                        <Link to={docLink} className="text--no-decoration">
                          <code>{endpoint.path}</code>
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={docLink}
                          className="text--no-decoration text--bold"
                        >
                          {endpoint.summary}
                        </Link>
                        {endpoint.description && (
                          <div>{endpoint.description}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
