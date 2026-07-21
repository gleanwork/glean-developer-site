import streamlit as st
from glean.api_client import Glean

st.title("Company Knowledge Assistant")

user_input = st.text_input("Ask a question:")

if user_input:
    with Glean(
        api_token=os.getenv("GLEAN_API_TOKEN"),
        server_url=os.getenv("GLEAN_SERVER_URL"),
    ) as client:
        response = client.client.chat.create(
            messages=[{"fragments": [{"text": user_input}]}]
        )
        st.write(response)
