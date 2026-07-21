import { renderSearchBox, renderSearchResults } from '@gleanwork/web-sdk';

renderSearchBox(searchBoxElement, {
  backend: 'https://{your}-be.glean.com',
  onSearch: (query) => {
    renderSearchResults(resultsElement, { query });
  },
});
