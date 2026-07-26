import { renderChat } from '@gleanwork/web-sdk';

// #chat needs position: relative, display: block, and an explicit
// width/height (~480px tall reads as a proper panel) or nothing renders.
const container = document.getElementById('chat');
renderChat(container, {
  // backend: 'https://{your}-be.glean.com',
  initialMessage: "What's our PTO policy?",
});
