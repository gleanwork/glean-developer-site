import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_glean_client():
    with patch('your_app.Glean') as mock:
        client_instance = MagicMock()
        mock.return_value.__enter__.return_value = client_instance
        yield client_instance

def test_chat_service(mock_glean_client):
    mock_response = MagicMock()
    mock_response.text = "Test response"
    mock_glean_client.client.chat.create.return_value = mock_response
    
    result = send_message("Hello")
    assert result == "Test response"
