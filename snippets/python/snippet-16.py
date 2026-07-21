import os
from flask import Flask, jsonify, url_for
from authlib.integrations.flask_client import OAuth
from glean.api_client import Glean

app = Flask(__name__)
app.secret_key = os.urandom(24)

oauth = OAuth(app)
oauth.register(
    name="glean",
    client_id=os.environ["OAUTH_CLIENT_ID"],
    client_secret=os.environ.get("OAUTH_CLIENT_SECRET"),  # omit for a public client
    server_metadata_url=os.environ["OAUTH_METADATA_URL"],
    client_kwargs={
        "scope": "openid offline_access SEARCH",  # SEARCH lets the token call /search (a Glean scope); offline_access requests a refresh token
        "code_challenge_method": "S256",   # enable PKCE
    },
)

@app.route("/login")
def login():
    return oauth.glean.authorize_redirect(url_for("callback", _external=True))

@app.route("/callback")
def callback():
    token = oauth.glean.authorize_access_token()  # verifies state + PKCE, exchanges code

    with Glean(
        api_token=token["access_token"],
        server_url=os.environ["GLEAN_SERVER_URL"],
    ) as glean:
        results = glean.client.search.query(
            query="quarterly reports",
            page_size=10,
            # Omit this header when the token is from the Glean Authorization Server.
            http_headers={"X-Glean-Auth-Type": "OAUTH"},
        )
        titles = [r.title for r in (results.results or [])]

    return jsonify({"titles": titles})

if __name__ == "__main__":
    app.run(port=5000)
