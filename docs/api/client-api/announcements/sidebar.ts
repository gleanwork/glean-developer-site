import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/client-api/announcements/glean-api-announcements",
    },
    {
      type: "category",
      label: "Announcements",
      items: [
        {
          type: "doc",
          id: "api/client-api/announcements/createannouncement",
          label: "Create Announcement",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/client-api/announcements/deleteannouncement",
          label: "Delete Announcement",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/client-api/announcements/updateannouncement",
          label: "Update Announcement",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
