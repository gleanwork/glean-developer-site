import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/indexing-api/glean-api",
    },
    {
      type: "category",
      label: "Datasources",
      link: {
        type: "doc",
        id: "api/indexing-api/datasources",
      },
      items: [
        {
          type: "doc",
          id: "api/indexing-api/add-or-update-datasource",
          label: "Add or update datasource",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/get-datasource-config",
          label: "Get datasource config",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Documents",
      link: {
        type: "doc",
        id: "api/indexing-api/documents",
      },
      items: [
        {
          type: "doc",
          id: "api/indexing-api/index-document",
          label: "Index document",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/index-documents",
          label: "Index documents",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/bulk-index-documents",
          label: "Bulk index documents",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/update-document-permissions",
          label: "Update document permissions",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/schedules-the-processing-of-uploaded-documents",
          label: "Schedules the processing of uploaded documents",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/delete-document",
          label: "Delete document",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "People",
      link: {
        type: "doc",
        id: "api/indexing-api/people",
      },
      items: [
        {
          type: "doc",
          id: "api/indexing-api/index-employee",
          label: "Index employee",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/bulk-index-employees",
          label: "Bulk index employees",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/schedules-the-processing-of-uploaded-employees-and-teams",
          label: "Schedules the processing of uploaded employees and teams",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/delete-employee",
          label: "Delete employee",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/index-team",
          label: "Index team",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/delete-team",
          label: "Delete team",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/bulk-index-teams",
          label: "Bulk index teams",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Permissions",
      link: {
        type: "doc",
        id: "api/indexing-api/permissions",
      },
      items: [
        {
          type: "doc",
          id: "api/indexing-api/index-user",
          label: "Index user",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/bulk-index-users",
          label: "Bulk index users",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/index-group",
          label: "Index group",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/bulk-index-groups",
          label: "Bulk index groups",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/index-membership",
          label: "Index membership",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/bulk-index-memberships-for-a-group",
          label: "Bulk index memberships for a group",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/schedules-the-processing-of-group-memberships",
          label: "Schedules the processing of group memberships",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/delete-user",
          label: "Delete user",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/delete-group",
          label: "Delete group",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/delete-membership",
          label: "Delete membership",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/beta-users",
          label: "Beta users",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Authentication",
      link: {
        type: "doc",
        id: "api/indexing-api/authentication",
      },
      items: [
        {
          type: "doc",
          id: "api/indexing-api/rotate-token",
          label: "Rotate token",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Troubleshooting",
      items: [
        {
          type: "doc",
          id: "api/indexing-api/beta-get-datasource-status",
          label: "Beta: Get datasource status\n",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/beta-get-document-information",
          label: "Beta: Get document information\n",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/beta-get-information-of-a-batch-of-documents",
          label: "Beta: Get information of a batch of documents\n",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/beta-get-user-information",
          label: "Beta: Get user information\n",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/check-document-access",
          label: "Check document access",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/get-document-upload-and-indexing-status",
          label: "Get document upload and indexing status",
          className: "menu__list-item--deprecated api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/get-document-count",
          label: "Get document count",
          className: "menu__list-item--deprecated api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/get-user-count",
          label: "Get user count",
          className: "menu__list-item--deprecated api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Shortcuts",
      items: [
        {
          type: "doc",
          id: "api/indexing-api/bulk-index-external-shortcuts",
          label: "Bulk index external shortcuts",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/indexing-api/upload-shortcuts",
          label: "Upload shortcuts",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
