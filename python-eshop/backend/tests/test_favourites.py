import pytest

from tests.conftest import sign_in


@pytest.mark.parametrize(
    "method, path",
    [
        ("PUT", "/api/favourites/1"),
        ("DELETE", "/api/favourites/1"),
        ("GET", "/api/favourites/ids"),
    ],
)
def test_favourites_require_sign_in(client, method, path):
    response = client.request(method, path)
    assert response.status_code == 401


def test_saved_favourite_appears_in_ids(client):
    headers = sign_in(client)

    assert client.put("/api/favourites/3", headers=headers).status_code == 204

    assert client.get("/api/favourites/ids", headers=headers).json() == [3]


def test_saving_twice_succeeds_and_keeps_one_favourite(client):
    headers = sign_in(client)

    assert client.put("/api/favourites/3", headers=headers).status_code == 204
    assert client.put("/api/favourites/3", headers=headers).status_code == 204

    assert client.get("/api/favourites/ids", headers=headers).json() == [3]


def test_saving_unknown_catalog_item_returns_404(client):
    headers = sign_in(client)

    response = client.put("/api/favourites/9999", headers=headers)

    assert response.status_code == 404
    assert client.get("/api/favourites/ids", headers=headers).json() == []


def test_removed_favourite_disappears_from_ids(client):
    headers = sign_in(client)
    client.put("/api/favourites/3", headers=headers)
    client.put("/api/favourites/5", headers=headers)

    assert client.delete("/api/favourites/3", headers=headers).status_code == 204

    assert client.get("/api/favourites/ids", headers=headers).json() == [5]


def test_removing_a_favourite_that_is_not_saved_succeeds(client):
    headers = sign_in(client)

    assert client.delete("/api/favourites/3", headers=headers).status_code == 204


def test_one_users_favourites_never_appear_for_another(client):
    alice = sign_in(client)
    bob = sign_in(client)
    client.put("/api/favourites/3", headers=alice)
    client.put("/api/favourites/5", headers=bob)

    client.delete("/api/favourites/5", headers=alice)

    assert client.get("/api/favourites/ids", headers=alice).json() == [3]
    assert client.get("/api/favourites/ids", headers=bob).json() == [5]


def test_catalog_items_carry_no_user_specific_fields(client):
    headers = sign_in(client)
    client.put("/api/favourites/1", headers=headers)

    items = client.get("/api/catalog/items", headers=headers).json()["items"]

    assert set(items[0]) == {
        "id",
        "name",
        "description",
        "price",
        "picture_uri",
        "catalog_brand_id",
        "catalog_type_id",
        "brand_name",
        "type_name",
    }
