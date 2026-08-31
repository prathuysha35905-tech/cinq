from sqlalchemy import text

from app.core.database import engine


with engine.begin() as connection:

    connection.execute(
        text(
            """
            ALTER TABLE sessions
            ADD COLUMN IF NOT EXISTS title
            VARCHAR(200)
            NOT NULL
            DEFAULT 'New Conversation';
            """
        )
    )

print("Session title column added successfully.")