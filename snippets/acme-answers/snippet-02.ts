import { renderChat } from '@gleanwork/web-sdk';

const container = document.getElementById('chat');
renderChat(container, {
  // backend: 'https://{your}-be.glean.com',
});
