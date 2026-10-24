"""Smoke/integration tests for the core API and administrator access checks."""

import base64
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

TEST_DB = Path("/tmp/cloudinventory-python-tests.sqlite3")
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["AUTO_SEED"] = "true"
os.environ["ADMIN_USERNAME"] = "test-admin"
os.environ["ADMIN_PASSWORD"] = "test-admin-password"
os.environ["VIEWER_USERNAME"] = "test-viewer"
os.environ["VIEWER_PASSWORD"] = "test-viewer-password"
os.environ["JWT_SECRET"] = base64.b64encode(b"cloudinventory-unit-test-secret-32-bytes").decode()

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


client = TestClient(app)


def admin_headers() -> dict[str, str]:
    response = client.post(
        "/api/auth/login",
        json={"username": "test-admin", "password": "test-admin-password"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_health_and_public_reads() -> None:
    with client:
        assert client.get("/api/health").json()["status"] == "UP"
        assert client.get("/api/products").status_code == 200
        assert client.get("/api/orders").status_code == 200


def test_writes_require_admin() -> None:
    response = client.post(
        "/api/products",
        json={"name": "Unauthorized", "sku": "NO-001", "category": "Test", "price": 1, "stock": 1},
    )
    assert response.status_code == 401


def test_admin_can_create_order_and_reduce_stock() -> None:
    with client:
        headers = admin_headers()
        product_response = client.post(
            "/api/products",
            headers=headers,
            json={"name": "Test Cable", "sku": "TST-CBL-1", "category": "Accessories", "price": 25, "stock": 10},
        )
        assert product_response.status_code == 201
        product = product_response.json()

        order_response = client.post(
            "/api/orders",
            headers=headers,
            json={"customerName": "Test Customer", "productId": product["id"], "quantity": 2},
        )
        assert order_response.status_code == 201
        assert order_response.json()["amount"] == 50
        assert order_response.json()["customerName"] == "Test Customer"
        assert client.get(f"/api/products/{product['id']}").json()["stock"] == 8


def test_viewer_cannot_write() -> None:
    response = client.post(
        "/api/auth/login",
        json={"username": "test-viewer", "password": "test-viewer-password"},
    )
    assert response.status_code == 200
    headers = {"Authorization": f"Bearer {response.json()['token']}"}
    denied = client.post(
        "/api/products",
        headers=headers,
        json={"name": "Viewer Product", "sku": "VIEW-001", "category": "Test", "price": 1, "stock": 1},
    )
    assert denied.status_code == 403
