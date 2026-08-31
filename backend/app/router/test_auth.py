from fastapi import APIRouter, Depends

from app.core.auth_dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/api/v1/test",
    tags=["Authentication Test"],
)


@router.get("/me")
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }