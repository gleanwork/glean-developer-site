import jwt
import json
import requests

# Fill your glean instance here.
YOUR_GLEAN_SERVER_URL=''
# Find your server URL at app.glean.com/admin/about-glean

# Use this function as is in your code (once you have filled out YOUR_GLEAN_SERVER_URL).
# Pass the header value for Glean-Actions-Signature as the 'token' in this function.

def verify_jwt(token):
    try:
        # First, we fetch the public key JSON response.
        response = requests.get(f"{YOUR_GLEAN_SERVER_URL}/api/tools/v1/verification_key")
        response.raise_for_status() # Raises an exception for 4XX/5XX responses
        public_key_str = response.json()['publicKey']

        # Second, we convert this into the PEM format.
        pem_key = f"-----BEGIN PUBLIC KEY-----\n{public_key_str}\n-----END PUBLIC KEY-----"

        # Finally, we attempt to decode the token using the public key.
        decoded = jwt.decode(token, pem_key, algorithms=['RS256'], issuer='glean')
        return True

    except jwt.PyJWTError as e:
        # Handle error (e.g., token expired, token tampered, etc.)
        print(f"JWT verification failed: {e}")
        return False
