from sqlalchemy import text

from app.core.database import engine


try:
    with engine.connect() as connection:

        result = connection.execute(
            text("SELECT current_database();")
        )

        database_name = result.scalar()

        print(
            f"Database connection successful: "
            f"{database_name}"
        )

except Exception as error:

    print(
        "Database connection failed:"
    )

    print(error)