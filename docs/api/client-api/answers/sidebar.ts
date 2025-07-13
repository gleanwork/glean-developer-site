import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/client-api/answers/glean-api-answers",
    },
    {
      type: "category",
      label: "Answers",
      items: [
        {
          type: "doc",
          id: "api/client-api/answers/createanswer",
          label: "Create Answer",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/client-api/answers/deleteanswer",
          label: "Delete Answer",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/client-api/answers/editanswer",
          label: "Update Answer",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/client-api/answers/getanswer",
          label: "Read Answer",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/client-api/answers/listanswers",
          label: "List Answers",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
