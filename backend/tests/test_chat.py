from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest

from app.main import app
from app.schemas.chat import ChatRequest


client = TestClient(app)


def test_chat_endpoint_exists():
    response = client.post(
        "/api/v1/chat",
        json={
            "session_id": "test-session",
            "message": "What is 2 + 2?",
            "agent": "math",
        },
    )

    assert response.status_code != 404


def test_empty_session_id_validation():
    with pytest.raises(ValidationError):
        ChatRequest(
            session_id="",
            message="Hello",
            agent="chat",
        )


def test_empty_message_validation():
    with pytest.raises(ValidationError):
        ChatRequest(
            session_id="test-session",
            message="",
            agent="chat",
        )


def test_invalid_agent_validation():
    with pytest.raises(ValidationError):
        ChatRequest(
            session_id="test-session",
            message="Hello",
            agent="invalid-agent",
        )


def test_chat_requires_authentication():
    response = client.post(
        "/api/v1/chat",
        json={
            "session_id": "test-session",
            "message": "Hello",
            "agent": "chat",
        },
    )

    assert response.status_code == 401