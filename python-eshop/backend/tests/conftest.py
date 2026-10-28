import itertools

import pytest
from fastapi.testclient import TestClient

from config import settings
from main import app

_user_numbers = itertools.count(1)


@pytest.fixture
def client(tmp_path, monkeypatch):
    """The real app on a fresh, seeded SQLite database."""
    monkeypatch.setattr(settings, "database_path", str(tmp_path / "eshop.db"))
    with TestClient(app) as test_client:
        yield test_client


def sign_in(client: TestClient, email: str | None = None) -> dict[str, str]:
    """Register and log in a User, returning their auth headers."""
    email = email or f"user{next(_user_numbers)}@example.com"
    password = "Pass@word1"
    response = client.post(
        "/api/auth/register", json={"email": email, "password": password}
    )
    assert response.status_code == 200, response.text
    response = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
