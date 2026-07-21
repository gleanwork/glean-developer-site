import { GleanError, GleanDataError } from "@gleanwork/api-client/models/errors";

try {
  const response = await client.client.chat.create({
    messages: [{ fragments: [{ text: "Hello" }] }]
  });
} catch (error) {
  if (error instanceof GleanError) {
    console.error(error.message);
    console.error(error.statusCode);
    console.error(error.body);
  }

  if (error instanceof GleanDataError) {
    console.error(error.errorMessages);
  }

  throw error;
}
