from db.client import DatabaseClient


class FavouriteService:
    def __init__(self, db: DatabaseClient):
        self.db = db

    def save_favourite(self, user_email: str, catalog_item_id: int) -> None:
        if not self.db.get_catalog_item_by_id(catalog_item_id):
            raise ValueError("Catalog item not found")
        self.db.save_favourite(user_email, catalog_item_id)

    def remove_favourite(self, user_email: str, catalog_item_id: int) -> None:
        self.db.remove_favourite(user_email, catalog_item_id)

    def list_favourite_ids(self, user_email: str) -> list[int]:
        return self.db.list_favourite_ids(user_email)
