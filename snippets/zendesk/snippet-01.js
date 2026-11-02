const gleanScript = document.createElement("script");
gleanScript.src = "https://{YOUR_GLEAN_DOMAIN}/glean-web-sdk-latest.min.js";
gleanScript.defer = true;
gleanScript.addEventListener("load", function () {
  GleanWebSDK.attach(document.querySelector("input[type=search]"));
});
document.head.append(gleanScript);
