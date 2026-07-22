import GleanWebSDK from '@gleanwork/web-sdk';

GleanWebSDK.renderSettings(document.getElementById('settings'), {
  backend: 'https://{your}-be.glean.com/',
});
