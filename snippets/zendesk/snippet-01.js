const gleanScript = document.createElement("script");
gleanScript.src = "https://{YOUR_GLEAN_DOMAIN}/browser-api/embedded-search-latest.min.js";
gleanScript.defer = true;
gleanScript.addEventListener("load", function () {
  EmbeddedSearch.attach(document.querySelector("input[type=search]"));
});
document.head.append(gleanScript);
