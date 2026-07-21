from flask import Flask, request, jsonify
import requests
import json

app = Flask(__name__)
cloud_id = "your_jira_cloud_id_here"
create_issue_url_format = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issue"
users_search_url = f"https://your-domain.atlassian.net/rest/api/3/users/search"

def get_reporter_id(email, auth_header):
    """
    Retrieves the Jira account ID for a given email address.
    This function supports proper user attribution in Jira issues.
    """
    start_at = 0
    max_results = 50
    while True:
        params = {'startAt': start_at, 'maxResults': max_results}
        headers = {'Accept': 'application/json', 'Authorization': auth_header}
        response = requests.get(users_search_url, params=params, headers=headers)
        users = json.loads(response.text)
        for user in users:
            if user['emailAddress'] == email:
                return user['accountId']
        if len(users) < max_results:
            break
        start_at += max_results
    return None

def transform_to_jira_request(input_payload, reporter_id):
    """
    Transforms the input payload into Jira's required format.
    Ensures all required fields are properly formatted.
    """
    jira_request = {
        "fields": {
            "project": {"id": input_payload['pid']},
            "issuetype": {"id": str(input_payload['issuetype'])},
            "priority": {"id": str(input_payload['priority'])},
            "summary": input_payload['summary'],
            "components": [{"id": input_payload['components']}],
            "description": {
                "type": "doc",
                "version": 1,
                "content": [{"type": "text", "text": input_payload['description']}]
            },
            "assignee": {"id": input_payload['assignee']},
            "reporter": {"id": reporter_id}
        }
    }
    return jira_request

@app.route('/create_issue', methods=['POST'])
def create_issue():
    """
    Endpoint handler for creating Jira issues.
    Includes authentication validation and error handling.
    """
    authorization_header = request.headers.get('Authorization')
    glean_user_email = request.headers.get('Glean-User-Email')

    if authorization_header is None or glean_user_email is None:
        return jsonify({"error": "Authorization header or Glean-User-Email not found"}), 401

    reporter_id = get_reporter_id(glean_user_email, authorization_header)
    if reporter_id is None:
        return jsonify({"error": "Reporter ID not found"}), 400

    input_payload = request.json
    jira_request = transform_to_jira_request(input_payload, reporter_id)

    headers = {
        "Content-Type": "application/json",
        "Authorization": authorization_header
    }

    response = requests.post(create_issue_url_format, headers=headers, json=jira_request)
    if response.status_code == 200:
        return jsonify({"resultURL": json.loads(response.text).get("key")}), 200
    else:
        return jsonify({"error": "Failed to create issue", "details": response.text}), response.status_code

if __name__ == '__main__':
    app.run(port=8080)
