import os

from dotenv import load_dotenv


load_dotenv()


class Settings:

    # =========================
    # AI CONFIGURATION
    # =========================

    AI_BASE_URL: str = os.getenv(
        "AI_BASE_URL",
        "http://127.0.0.1:1234/v1",
    )

    AI_API_KEY: str = os.getenv(
        "AI_API_KEY",
        "lm-studio",
    )

    ROUTER_MODEL: str = os.getenv(
        "ROUTER_MODEL",
        "",
    )

    AGENT_MODEL: str = os.getenv(
        "AGENT_MODEL",
        "",
    )

    CONFIDENCE_THRESHOLD: float = float(
        os.getenv(
            "CONFIDENCE_THRESHOLD",
            "0.70",
        )
    )

    # =========================
    # DATABASE CONFIGURATION
    # =========================

    DB_HOST: str = os.getenv(
        "DB_HOST",
        "localhost",
    )

    DB_PORT: str = os.getenv(
        "DB_PORT",
        "5432",
    )

    DB_NAME: str = os.getenv(
        "DB_NAME",
        "cinq",
    )

    DB_USER: str = os.getenv(
        "DB_USER",
        "postgres",
    )

    DB_PASSWORD: str = os.getenv(
        "DB_PASSWORD",
        "",
    )

    # Optional full database URL
    # Useful later when deploying
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "",
    )

    # =========================
    # SECURITY
    # =========================

    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-secret-key",
    )

    JWT_ALGORITHM: str = "HS256"

    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # =========================
    # OTHER SERVICES
    # =========================

    TAVILY_API_KEY: str = os.getenv(
        "TAVILY_API_KEY",
        "",
    )


settings = Settings()