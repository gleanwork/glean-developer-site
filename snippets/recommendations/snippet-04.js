addEventListener('DOMContentLoaded', () => {
  const recommendationsContainer = document.getElementById('recommendations');
  GleanWebSDK.renderRecommendations(recommendationsContainer, {
    height: 700,
    customizations: {
      border: '1px solid grey',
      borderRadius: 4,
      boxShadow: '2px 2px grey',
      horizontalMargin: 3,
      verticalMargin: 3,
      searchBox: {
        placeholderText: 'Search for anything...',
        searchIconUrl: 'https://picsum.photos/18',
      },
    },
  });
});
