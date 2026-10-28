from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_favourite_service, require_authenticated_user
from services.favourite_service import FavouriteService

router = APIRouter(prefix="/api/favourites", tags=["favourites"])


@router.get("/ids", response_model=list[int])
def list_favourite_ids(
    user_email: str = Depends(require_authenticated_user),
    service: FavouriteService = Depends(get_favourite_service),
):
    return service.list_favourite_ids(user_email)


@router.put("/{catalog_item_id}", status_code=204)
def save_favourite(
    catalog_item_id: int,
    user_email: str = Depends(require_authenticated_user),
    service: FavouriteService = Depends(get_favourite_service),
):
    try:
        service.save_favourite(user_email, catalog_item_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{catalog_item_id}", status_code=204)
def remove_favourite(
    catalog_item_id: int,
    user_email: str = Depends(require_authenticated_user),
    service: FavouriteService = Depends(get_favourite_service),
):
    service.remove_favourite(user_email, catalog_item_id)
