addEventListener('DOMContentLoaded', () => {
  // If you've customized the page header, you'll need to adjust these selectors.
  GleanWebSDK.attach(document.querySelector('.Page-header-search-open'));
  GleanWebSDK.attach(document.querySelector('.Page-header-search-input'));
})
