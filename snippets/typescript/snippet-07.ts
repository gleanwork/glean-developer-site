// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Glean } from '@gleanwork/api-client';

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  
  const client = new Glean({
    apiToken: process.env.GLEAN_API_TOKEN!,
    serverURL: process.env.GLEAN_SERVER_URL!,
  });

  const response = await client.client.chat.create({
    messages: [{ fragments: [{ text: message }] }]
  });

  const answer = response.messages
    ?.flatMap((m) => m.fragments ?? [])
    .map((f) => f.text ?? '')
    .join('') ?? '';

  return NextResponse.json({ answer });
}
