import os

from dotenv import load_dotenv


load_dotenv()


class Settings:

    LMSTUDIO_BASE_URL: str = os.getenv(
        "LMSTUDIO_BASE_URL",
        "http://127.0.0.1:1234/v1"
    )

    LMSTUDIO_API_KEY: str = os.getenv(
        "LMSTUDIO_API_KEY",
        "lm-studio"
    )

    ROUTER_MODEL: str = os.getenv(
        "ROUTER_MODEL",
        "gemma4-12b"
    )

    AGENT_MODEL: str = os.getenv(
        "AGENT_MODEL",
        "gemma4-12b"
    )

    CONFIDENCE_THRESHOLD: float = float(
        os.getenv(
            "CONFIDENCE_THRESHOLD",
            "0.70"
        )
    )

    DB_HOST: str = os.getenv(
        "DB_HOST",
        "localhost"
    )

    DB_PORT: str = os.getenv(
        "DB_PORT",
        "5432"
    )

    DB_NAME: str = os.getenv(
        "DB_NAME",
        "cinq"
    )

    DB_USER: str = os.getenv(
        "DB_USER",
        "postgres"
    )

    DB_PASSWORD: str = os.getenv(
        "DB_PASSWORD",
        ""
    )

    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-secret-key"
    )

    TAVILY_API_KEY: str = os.getenv(
    "TAVILY_API_KEY",
    ""
)

    JWT_ALGORITHM: str = "HS256"

    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


settings = Settings()