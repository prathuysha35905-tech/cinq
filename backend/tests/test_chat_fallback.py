from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_selected_agent_failure_uses_chat_fallback():
    # Register a test user
    register_response = client.post(
        "/api/v1/auth/register",
        params={
            "username": "fallback_test_user",
            "email": "fallback_test@example.com",
            "password": "testpassword123",
        },
    )

    # User may already exist from a previous test run
    assert register_response.status_code in (200, 400)

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        params={
            "username": "fallback_test_user",
            "password": "testpassword123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    with patch(
        "app.main.registry.get_agent"
    ) as mock_get_agent:

        chat_agent = mock_get_agent.return_value

        chat_agent.name = "ChatAgent"
        chat_agent.model = "test-model"

        chat_agent.run.side_effect = [
            RuntimeError("Selected agent failed"),
            "Fallback response from ChatAgent",
        ]

        response = client.post(
            "/api/v1/chat",
            headers=headers,
            json={
                "session_id": "fallback-test-session",
                "message": "Hello",
                "agent": "math",
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["agent"] == "ChatAgent"
    assert data["response"] == "Fallback response from ChatAgent"
    assert data["routing_method"] == "fallback"


def test_low_confidence_uses_chat_fallback():
    # Register a test user
    register_response = client.post(
        "/api/v1/auth/register",
        params={
            "username": "confidence_test_user",
            "email": "confidence_test@example.com",
            "password": "testpassword123",
        },
    )

    assert register_response.status_code in (200, 400)

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        params={
            "username": "confidence_test_user",
            "password": "testpassword123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    with patch(
        "app.main.router.route"
    ) as mock_route, patch(
        "app.main.registry.get_agent"
    ) as mock_get_agent:

        # Force the router to return low confidence
        mock_route.return_value = {
            "agent": "math",
            "confidence": 0.20,
            "reason": "Low confidence test",
        }

        chat_agent = mock_get_agent.return_value

        chat_agent.name = "ChatAgent"
        chat_agent.model = "test-model"
        chat_agent.run.return_value = "Fallback response"

        response = client.post(
            "/api/v1/chat",
            headers=headers,
            json={
                "session_id": "confidence-fallback-session",
                "message": "Hello",
                "agent": "auto",
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["agent"] == "ChatAgent"
    assert data["response"] == "Fallback response"
    assert data["routing_method"] == "confidence_fallback"
    assert data["confidence"] == 0.20