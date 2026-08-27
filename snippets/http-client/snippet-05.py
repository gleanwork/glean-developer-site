content, content_type = http.get_bytes("/attachments/42", max_bytes=10 * 1024 * 1024)
