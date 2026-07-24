@app.route("/file_incident_ticket", methods=["POST"])
def file_incident_ticket():
    user_email = request.headers.get("Glean-User-Email")
    if user_email not in ENGINEERING_EMAILS:
        return jsonify({"error": "Not authorized"}), 403

    # ...file the ticket...
    return jsonify({"resultURL": ticket_url}), 200
