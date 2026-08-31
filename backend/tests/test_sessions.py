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


def test_create_session():
    token = get_token()

    response = client.post(
        "/api/v1/sessions",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "session_id" in data
    assert data["session_id"]
    assert "created_at" in data


def test_get_all_sessions():
    token = get_token()

    # Create a session first
    create_response = client.post(
        "/api/v1/sessions",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert create_response.status_code == 200

    response = client.get(
        "/api/v1/sessions",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "count" in data
    assert "sessions" in data
    assert isinstance(data["sessions"], list)
    assert data["count"] >= 1


def test_get_session():
    token = get_token()

    create_response = client.post(
        "/api/v1/sessions",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert create_response.status_code == 200

    session_id = create_response.json()["session_id"]

    response = client.get(
        f"/api/v1/sessions/{session_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["session_id"] == session_id
    assert "title" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "messages" in data
    assert isinstance(data["messages"], list)


def test_delete_session():
    token = get_token()

    create_response = client.post(
        "/api/v1/sessions",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert create_response.status_code == 200

    session_id = create_response.json()["session_id"]

    delete_response = client.delete(
        f"/api/v1/sessions/{session_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert delete_response.status_code == 200

    data = delete_response.json()

    assert data["session_id"] == session_id

    # Confirm it no longer exists
    get_response = client.get(
        f"/api/v1/sessions/{session_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert get_response.status_code == 404


def test_session_requires_authentication():
    response = client.get(
        "/api/v1/sessions"
    )

    assert response.status_code == 401



def test_user_cannot_access_another_users_session():
    # Login as the first user
    token_a = get_token()

    create_response = client.post(
        "/api/v1/sessions",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
    )

    assert create_response.status_code == 200

    session_id = create_response.json()["session_id"]

    # Create/login a second user
    username_b = "test_isolation_user"
    password_b = "IsolationPassword123!"

    register_response = client.post(
        "/api/v1/auth/register",
        params={
            "username": username_b,
            "email": "test_isolation_user@example.com",
            "password": password_b,
        },
    )

    # The user may already exist from a previous test run
    assert register_response.status_code in [200, 400]

    login_response = client.post(
        "/api/v1/auth/login",
        params={
            "username": username_b,
            "password": password_b,
        },
    )

    assert login_response.status_code == 200

    token_b = login_response.json()["access_token"]

    # User B attempts to access User A's session
    response = client.get(
        f"/api/v1/sessions/{session_id}",
        headers={
            "Authorization": f"Bearer {token_b}"
        },
    )

    assert response.status_code == 404    