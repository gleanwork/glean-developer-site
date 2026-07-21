const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

app.post("/api/get-glean-token", async (req, res) => {
  const { userEmail } = req.body;

  // Your backend URL (find at https://app.glean.com/admin/about-glean)
  const backend = process.env.GLEAN_BACKEND_URL;
  const apiKey = process.env.GLEAN_API_KEY;

  const tokenApiPath = backend.endsWith("/")
    ? `${backend}rest/api/v1/createauthtoken`
    : `${backend}/rest/api/v1/createauthtoken`;

  try {
    const response = await axios({
      method: "POST",
      url: tokenApiPath,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Scio-ActAs": userEmail,
        accept: "application/json",
      },
    });

    // Response contains: { token: "GLEAN_AUTH_TOKEN_...", expirationTime: 1234567890 }
    res.json(response.data);
  } catch (error) {
    console.error("Failed to fetch Glean token:", error);
    res.status(500).json({ error: "Failed to generate auth token" });
  }
});

app.listen(3000);
