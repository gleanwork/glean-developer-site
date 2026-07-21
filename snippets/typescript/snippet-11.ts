const response = await client.client.chat.create(
  { messages: [{ fragments: [{ text: "Hello" }] }] },
  undefined,
  undefined,
  { fetchOptions: { headers: { "X-Glean-ActAs": "user@company.com" } } }
);
