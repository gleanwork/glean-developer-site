import { Glean } from "@gleanwork/api-client";

const client = new Glean({
  apiToken: process.env.GLEAN_API_TOKEN,
  serverURL: process.env.GLEAN_SERVER_URL,
});

const result = await client.client.chat.create({
  messages: [{
    fragments: [{ text: "What are our company values?" }]
  }]
});
