from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User

from passlib.context import CryptContext

from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings
from app.core.auth_dependencies import get_current_user


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


@router.post("/register")
def register(
    username: str,
    email: str,
    password: str,
    db: Session = Depends(get_db),
):

    existing_user = (
        db.query(User)
        .filter(
            (User.username == username)
            | (User.email == email)
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists.",
        )

    password_hash = pwd_context.hash(
        password
    )

    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully.",
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
    }


def create_access_token(
    user_id: int,
    username: str
) -> str:

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


@router.post("/login")
def login(
    username: str,
    password: str,
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password.",
        )

    if not pwd_context.verify(
        password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password.",
        )

    access_token = create_access_token(
        user_id=user.id,
        username=user.username,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,



    }



@router.patch("/username")
def update_username(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    new_username = username.strip()

    if not new_username:
        raise HTTPException(
            status_code=400,
            detail="Username cannot be empty.",
        )

    if new_username == current_user.username:
        return {
            "message": "Username is unchanged.",
            "username": current_user.username,
        }

    existing_user = (
        db.query(User)
        .filter(User.username == new_username)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username is already taken.",
        )

    current_user.username = new_username

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Username updated successfully.",
        "username": current_user.username,
    }


@router.post("/change-password")
def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not pwd_context.verify(
        current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    if len(new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters long.",
        )

    if pwd_context.verify(
        new_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New password must be different "
                "from your current password."
            ),
        )

    current_user.password_hash = pwd_context.hash(
        new_password
    )

    db.commit()

    return {
        "message": "Password updated successfully."
    }