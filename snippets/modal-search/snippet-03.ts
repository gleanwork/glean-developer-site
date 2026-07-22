import { attach } from '@gleanwork/web-sdk';

attach(document.getElementById('search-box'), {
  backend: 'https://{your}-be.glean.com/',
});
