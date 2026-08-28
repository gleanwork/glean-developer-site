import React, { useState } from 'react';
import { Glean } from '@gleanwork/api-client';

type ChatComponentProps = {
  apiToken: string;
  serverURL: string;
};

export function ChatComponent({
  apiToken,
  serverURL,
}: ChatComponentProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  const client = new Glean({ apiToken, serverURL });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await client.client.chat.create({
      messages: [{ fragments: [{ text: input }] }],
    });
    const answer =
      result.messages
        ?.flatMap((m) => m.fragments ?? [])
        .map((f) => f.text ?? '')
        .join('') ?? '';
    setResponse(answer);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setInput(e.target.value)
        }
        placeholder="Ask a question..."
      />
      <button type="submit">Send</button>
      {response && <div>{response}</div>}
    </form>
  );
}
