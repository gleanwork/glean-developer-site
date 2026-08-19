import base64, hashlib, hmac, time

TOLERANCE_SECONDS = 300

def verify(headers, raw_body: bytes, signing_secret: str) -> bool:
    webhook_id = headers["webhook-id"]
    timestamp = headers["webhook-timestamp"]

    if abs(time.time() - int(timestamp)) > TOLERANCE_SECONDS:
        return False

    key = base64.b64decode(signing_secret.removeprefix("whsec_"))
    signed = f"{webhook_id}.{timestamp}.".encode() + raw_body
    expected = base64.b64encode(hmac.new(key, signed, hashlib.sha256).digest()).decode()

    # The header may carry several space-delimited "v1,<sig>" pairs.
    for part in headers["webhook-signature"].split():
        version, _, candidate = part.partition(",")
        if version == "v1" and hmac.compare_digest(candidate, expected):
            return True
    return False
