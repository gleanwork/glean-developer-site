import { jest } from '@jest/globals';
import { Glean } from '@gleanwork/api-client';

jest.mock('@gleanwork/api-client');

const MockedGlean = Glean as jest.MockedClass<typeof Glean>;

test('chat service', async () => {
  const mockCreate = jest.fn().mockResolvedValue({
    messages: [{ fragments: [{ text: 'Test response' }] }]
  });

  MockedGlean.mockImplementation(() => ({
    client: { chat: { create: mockCreate } }
  } as any));

  // Test your code here
});
