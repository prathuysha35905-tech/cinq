from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):

    session_id: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    message: str = Field(
        ...,
        min_length=1,
        max_length=10000
    )

    agent: Literal[
        "auto",
        "code",
        "math",
        "writer",
        "research",
        "chat"
    ] = "auto"


class ChatResponse(BaseModel):

    session_id: str
    response: str
    agent: str
    confidence: float
    reason: str
    model: str
    routing_method: str