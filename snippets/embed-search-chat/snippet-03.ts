import { renderChat } from '@gleanwork/web-sdk';

renderChat(containerElement, {
  backend: 'https://{your}-be.glean.com',
  initialMessage: "What's our PTO policy?",
});
