let currentQuery;

function renderSearchResults() {
  const resultsElement = this.template.querySelector('search-results');
  window.GleanWebSDK.renderSearchResults(resultsElement, {
    onSearch: (query) => {
      currentQuery = query;
      renderSearchBox();
    },
    query: currentQuery
  });
}

function renderSearchBox() {
  const autocompleteElement = this.template.querySelector('search-box');
  window.GleanWebSDK.renderSearchBox(autocompleteElement, {
    onSearch: (query) => {
      currentQuery = query;
      renderSearchResults();
    },
    query: currentQuery
  });
}

renderSearchBox();
