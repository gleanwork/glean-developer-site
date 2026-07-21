/** Setup Glean search **/
function initializeGleanSearch () {
  // Note: This should match the backend URL for your Glean setup
  const backend = '<CHANGEME>';

  // See available customizations here: https://developers.glean.com/libraries/web-sdk/reference/interfaces/SearchBoxCustomizations
  const customizations = {
    boxShadow: 'none',
    borderRadius: 8,
    placeholderText: 'Search...', // Change me to a placeholder of your choice
  };

  // Initialize GleanForZendesk
  GleanForZendeskGuide.init({
    // This should match the search page used by your theme -- this usually matches /hc/search
    searchUrl: '/hc/search',
    // If your Glean setup supports guest users, mark this as true.
    // Note: If your Glean setup is internal users only, this option will be ignored.
    anonymous: false,
    backend,
  }).then((instance) => {
    // Attach hero search box
    instance.renderSearchBox('.glean-search-box', {
      searchBoxCustomizations: Object.assign({}, customizations, {
        fontSize: 20,
        // Additional customizations can be added here
      }),
      backend,
    });

    // Attach compact search box
    instance.renderSearchBox('.glean-search-box--compact', {
      searchBoxCustomizations: Object.assign({}, customizations, {
        fontSize: 16,
        // Additional customizations can be added here
      }),
      backend,
    });

    // Attach search results
    instance.renderSearchResults('.glean-search-results', { backend, showInlineSearchBox: true });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGleanSearch);
} else {
  initializeGleanSearch();
}
