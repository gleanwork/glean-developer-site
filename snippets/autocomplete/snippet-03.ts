import { renderSearchBox, renderSearchResults } from '@gleanwork/web-sdk';

const boxElement = document.getElementById('search-box');
const resultsElement = document.getElementById('search-results');

let currentQuery = '';

function onSearch(query) {
  currentQuery = query;
  renderAll();
}

function renderAll() {
  renderSearchBox(boxElement, { onSearch, query: currentQuery });
  renderSearchResults(resultsElement, { onSearch, query: currentQuery });
}

renderAll();
