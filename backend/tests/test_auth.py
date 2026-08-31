from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        params={
            "username": "test_auth_user",
            "email": "test_auth_user@example.com",
            "password": "TestPassword123!",
        },
    )

    # 200 = newly registered
    # 400 = user already exists from a previous test run
    assert response.status_code in [200, 400]

    if response.status_code == 200:
        data = response.json()

        assert data["username"] == "test_auth_user"
        assert data["email"] == "test_auth_user@example.com"
        assert "user_id" in data


def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        params={
            "username": "test_auth_user",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user_id" in data
    assert data["username"] == "test_auth_user"


def test_login_wrong_password():
    response = client.post(
        "/api/v1/auth/login",
        params={
            "username": "test_auth_user",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_login_nonexistent_user():
    response = client.post(
        "/api/v1/auth/login",
        params={
            "username": "user_that_does_not_exist",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 401


def test_chat_with_invalid_token():
    response = client.post(
        "/api/v1/chat",
        headers={
            "Authorization": "Bearer invalid-token"
        },
        json={
            "session_id": "auth-test-session",
            "message": "Hello",
            "agent": "chat",
        },
    )

    assert response.status_code == 401