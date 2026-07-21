import express from 'express';
import { Glean } from '@gleanwork/api-client';

const app = express();
app.use(express.json());

const client = new Glean({
  apiToken: process.env.GLEAN_API_TOKEN!,
  serverURL: process.env.GLEAN_SERVER_URL!,
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  const response = await client.client.chat.create({
    messages: [{ fragments: [{ text: message }] }]
  });

  const answer = response.messages
    ?.flatMap((m) => m.fragments ?? [])
    .map((f) => f.text ?? '')
    .join('') ?? '';

  res.json({ answer });
});
