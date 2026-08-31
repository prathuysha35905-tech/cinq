import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth_dependencies import get_current_user
from app.core.database import get_db
from app.models.conversation import Session as ConversationSession
from app.models.conversation import Message
from app.models.user import User


router = APIRouter(
    prefix="/api/v1/sessions",
    tags=["Sessions"],
)


# ==========================================
# GET ALL USER SESSIONS
# ==========================================

@router.get("")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    statement = (
        select(ConversationSession)
        .where(
            ConversationSession.user_id
            == current_user.id
        )
        .order_by(
            ConversationSession.updated_at.desc()
        )
    )

    sessions = db.scalars(
        statement
    ).all()

    return {
        "count": len(sessions),
        "sessions": [
            {
                "session_id": session.id,
                "title": session.title,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
            }
            for session in sessions
        ],
    }


# ==========================================
# CREATE SESSION
# ==========================================

@router.post("")
def create_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    session_id = str(uuid.uuid4())

    session = ConversationSession(
        id=session_id,
        user_id=current_user.id,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "title": session.title,
        "created_at": session.created_at,
    }


# ==========================================
# GET SESSION
# ==========================================

@router.get("/{session_id}")
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    statement = (
        select(ConversationSession)
        .where(
            ConversationSession.id == session_id,
            ConversationSession.user_id
            == current_user.id,
        )
    )

    session = db.scalars(
        statement
    ).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    statement = (
        select(Message)
        .where(
            Message.session_id == session_id
        )
        .order_by(
            Message.created_at.asc()
        )
    )

    messages = db.scalars(
        statement
    ).all()

    return {
        "session_id": session.id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "agent": message.agent,
                "created_at": message.created_at,
            }
            for message in messages
        ],
    }


# ==========================================
# DELETE SESSION
# ==========================================

@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    statement = (
        select(ConversationSession)
        .where(
            ConversationSession.id == session_id,
            ConversationSession.user_id
            == current_user.id,
        )
    )

    session = db.scalars(
        statement
    ).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    db.delete(session)
    db.commit()

    return {
        "message": "Session deleted successfully",
        "session_id": session_id,
    }