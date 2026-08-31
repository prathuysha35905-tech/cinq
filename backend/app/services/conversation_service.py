from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Session as ConversationSession
from app.models.conversation import Message
from app.models.adapter import ModelAdapter

from app.core.config import settings


class ConversationService:

    # ==========================================
    # INITIALIZE
    # ==========================================

    def __init__(
        self,
        db: Session,
        model_adapter: ModelAdapter,
    ):
        self.db = db
        self.model_adapter = model_adapter


    # ==========================================
    # CREATE SESSION
    # ==========================================

    def create_session(
        self,
        session_id: str,
        user_id: int,
    ) -> ConversationSession:

        session = ConversationSession(
            id=session_id,
            user_id=user_id,
        )

        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return session


    # ==========================================
    # GET SESSION
    # ==========================================

    def get_session(
        self,
        session_id: str,
        user_id: int | None = None,
    ) -> ConversationSession | None:

        session = self.db.get(
            ConversationSession,
            session_id,
        )

        if session is None:
            return None

        # Verify ownership when user_id is provided
        if user_id is not None:
            if session.user_id != user_id:
                return None

        return session


    # ==========================================
    # GET OR CREATE SESSION
    # ==========================================

    def get_or_create_session(
        self,
        session_id: str,
        user_id: int,
    ) -> ConversationSession:

        session = self.get_session(
            session_id,
            user_id,
        )

        if session is not None:
            return session

        # Check whether the session exists
        # but belongs to another user.
        existing_session = self.db.get(
            ConversationSession,
            session_id,
        )

        if existing_session is not None:
            raise PermissionError(
                "You do not have access to this session."
            )

        # Session does not exist, so create it.
        return self.create_session(
            session_id,
            user_id,
        )


    # ==========================================
    # ADD MESSAGE
    # ==========================================

    def add_message(
        self,
        session_id: str,
        user_id: int,
        role: str,
        content: str,
        agent: str | None = None,
    ) -> Message:

        session = self.get_or_create_session(
            session_id,
            user_id,
        )

        # ======================================
        # GENERATE TITLE FOR FIRST USER MESSAGE
        # ======================================

        if (
            role == "user"
            and session.title == "New Conversation"
        ):

            try:

                title_response = self.model_adapter.generate(
                    model=settings.ROUTER_MODEL,
                    system_prompt=(
                        "You generate concise conversation titles. "
                        "Return ONLY the title and nothing else. "
                        "Use between 3 and 7 words. "
                        "Do not use quotation marks. "
                        "Do not end the title with a period."
                    ),
                    user_message=(
                        "Generate a short, descriptive title "
                        "for this user message:\n\n"
                        f"{content}"
                    ),
                )

                title = title_response.strip()

                # Remove accidental quotation marks
                title = title.strip('"').strip("'")

                if title:
                    session.title = title[:200]

                    print(
                        "Conversation title generated:",
                        session.title,
                    )

            except Exception as exc:

                # Do not stop the chat if title
                # generation fails.
                print(
                    "Conversation title generation failed:",
                    str(exc),
                )


        # ======================================
        # CREATE MESSAGE
        # ======================================

        message = Message(
            session_id=session_id,
            role=role,
            content=content,
            agent=agent,
        )

        self.db.add(message)


        # ======================================
        # UPDATE SESSION TIMESTAMP
        # ======================================

        session.updated_at = datetime.now(
            timezone.utc
        )


        # ======================================
        # SAVE DATABASE CHANGES
        # ======================================

        self.db.commit()

        self.db.refresh(message)

        return message


    # ==========================================
    # GET HISTORY
    # ==========================================

    def get_history(
        self,
        session_id: str,
        user_id: int,
    ) -> list[dict]:

        # Verify session belongs to user
        session = self.get_session(
            session_id,
            user_id,
        )

        if session is None:
            return []

        statement = (
            select(Message)
            .where(
                Message.session_id == session_id
            )
            .order_by(
                Message.created_at.asc()
            )
        )

        messages = self.db.scalars(
            statement
        ).all()

        return [
            {
                "role": message.role,
                "content": message.content,
                "agent": message.agent,
                "timestamp": (
                    message.created_at.isoformat()
                    if message.created_at
                    else None
                ),
            }
            for message in messages
        ]


    # ==========================================
    # CLEAR SESSION
    # ==========================================

    def clear_session(
        self,
        session_id: str,
        user_id: int,
    ) -> bool:

        session = self.get_session(
            session_id,
            user_id,
        )

        if session is None:
            return False

        self.db.delete(session)

        self.db.commit()

        return True