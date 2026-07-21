// Simple chat
const response = await client.client.chat.create({
  messages: [{ fragments: [{ text: "Explain our Q4 strategy" }] }]
});

// Streaming responses
const stream = await client.client.chat.createStream({
  messages: [{ fragments: [{ text: "What are our priorities?" }] }]
});

console.log(stream);
