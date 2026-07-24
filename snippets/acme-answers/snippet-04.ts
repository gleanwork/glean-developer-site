import { Glean } from '@gleanwork/api-client';

const glean = new Glean({
  apiToken: process.env.GLEAN_API_TOKEN,
  instance: process.env.GLEAN_INSTANCE,
});

const response = await glean.client.chat.create({
  messages: [{ author: 'USER', fragments: [{ text: question }] }],
});

const messages = response.messages ?? [];

const answer = messages
  .flatMap((message) => message.fragments ?? [])
  .map((fragment) => fragment.text ?? '')
  .join('');

const citations = messages
  .flatMap((message) => message.citations ?? [])
  .map((citation) => citation.sourceDocument)
  .filter((document) => document?.title && document?.url);
