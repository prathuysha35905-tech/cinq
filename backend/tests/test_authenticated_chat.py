from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


USERNAME = "test_auth_user"
PASSWORD = "TestPassword123!"


def get_token():
    response = client.post(
        "/api/v1/auth/login",
        params={
            "username": USERNAME,
            "password": PASSWORD,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_authenticated_chat():
    token = get_token()

    response = client.post(
        "/api/v1/chat",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "session_id": "authenticated-chat-test",
            "message": "Hello, how are you?",
            "agent": "chat",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["session_id"] == "authenticated-chat-test"
    assert data["response"]
    assert data["agent"] == "ChatAgent"
    assert data["routing_method"] == "manual"
    assert data["confidence"] == 1.0
    assert data["model"]


def test_authenticated_math_agent():
    token = get_token()

    response = client.post(
        "/api/v1/chat",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "session_id": "math-agent-test",
            "message": "What is 25 * 4?",
            "agent": "math",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["agent"] == "MathAgent"
    assert data["routing_method"] == "manual"
    assert data["response"]


def test_authenticated_auto_routing():
    token = get_token()

    response = client.post(
        "/api/v1/chat",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "session_id": "auto-routing-test",
            "message": "What is 25 * 4?",
            "agent": "auto",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["session_id"] == "auto-routing-test"
    assert data["response"]
    assert data["agent"]
    assert data["confidence"] >= 0.0
    assert data["reason"]
    assert data["model"]
    assert data["routing_method"] in [
        "automatic",
        "confidence_fallback",
        "fallback",
    ]