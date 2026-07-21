import { renderRecommendations } from '@gleanwork/web-sdk';

renderRecommendations(document.getElementById('recommendations'), {
  backend: 'https://{your}-be.glean.com/',
  height: 700,
  customizations: {
    border: '1px solid grey',
    borderRadius: 4,
    horizontalMargin: 3,
    verticalMargin: 3,
    searchBox: {
      placeholderText: 'Search for anything...',
    },
  },
});
