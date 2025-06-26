---
title: Token Rotation
icon: key-skeleton-left-right
---

This guide covers token rotation for the indexing API. You'll learn how to exchange your rotatable access token for a new access token.

With token rotation, you'll provide an extra layer of security for your access tokens.

To use the rotate token endpoint, you must first create a rotatable token from the admin console by specifying a rotation period in minutes. Please refer to [Managing API Tokens](https://developers.glean.com/docs/indexing_api_tokens/) documentation on how to create a rotatable token.

## Rotate token endpoint `/rotatetoken`

Here is a sample request to the `/rotatetoken` endpoint.

```bash
 curl -X POST  https://customer-be.glean.com/api/index/v1/rotatetoken \
  -H 'Authorization: Bearer <token>'
```

To rotate a token using the `/rotatetoken` endpoint, you must send the token you want to rotate as the bearer token in the request. This will create and return a new token with the same properties as the parent token, including the rotation period minutes property, which cannot be changed. The response will include the new token's raw secret, creation time, and rotation period in minutes.

### Sample response

```json
{
  "rawSecret": "new-secret",
  "createdAt": 16400000,
  "rotationPeriodMinutes": 3600
}
```

## Rotation period

After creating a rotatable token in the admin console, it is important to regularly rotate the token using the /rotatetoken endpoint to prevent it from expiring. The rotation period is specified when the token is created and cannot be changed. To ensure the token is rotated within the specified period, we recommend setting up a cron job that runs at a frequency less than the rotation period.

Following is a sample structure of how the cron job might look like -:

```python Python
def rotate_token():
  # Make a POST request to the /rotatetoken endpoint
  response = requests.post('http://domain-be.glean.com/api/index/v1/rotatetoken')

  # Extract the new token and rotation period from the response
  data = response.json()
  new_secret = data['rawSecret']
  rotation_period_minutes = data['rotationPeriodMinutes']
  created_at = data['createdAt']

  # Store the new token and rotation period in the database
  store_in_db(new_secret, rotation_period_minutes, created_at)

  # Start using the new token for all future API calls
  set_api_token(new_secret)

# Set up the cron job to run the rotate_token function every rotationPeriodMinutes minutes
def create_cron_job(rotationPeriodMinutes):
  cron = CronTab(user='username')
  job = cron.new(command='/path/to/script.py')
  job.minute.every(rotationPeriodMinutes)
  cron.write()
```

## Some things to note

- When a token is rotated, it cannot be used to make any requests after a buffer period of 10 minutes. This buffer period is not configurable.
- If the token expires, it cannot be used to make indexing API requests. You would need to create a new token from the admin console.
- It is recommended that tokens are stored in an encrypted form.
- It is important to note that the token will still expire at the expiry time specified during token creation, even if it is being rotated regularly.
