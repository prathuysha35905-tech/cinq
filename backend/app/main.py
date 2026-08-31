import time

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.adapter import ModelAdapter
from app.agents.code_agent import CodeAgent
from app.agents.registry import AgentRegistry

from app.router.router import AgentRouter
from app.router.semantic import SemanticRouter
from app.router.llm_router import LLMRouter

from app.schemas.chat import ChatRequest, ChatResponse

from app.core.config import settings
from app.core.logger import logger


from app.core.database import get_db
from app.core.auth_dependencies import get_current_user
from app.core.database import Base, engine
from app.models.user import User

from app.models.conversation import Session, Message
from app.services.conversation_service import ConversationService

from app.router.sessions import router as sessions_router

from app.router.auth import router as auth_router

from app.router.test_auth import router as test_auth_router

Base.metadata.create_all(bind=engine)

adapter = ModelAdapter()
registry = AgentRegistry(adapter)
router = LLMRouter(adapter)



def build_context(
    conversation_service: ConversationService,
    session_id: str,
    user_id: int,
    current_message: str,
) -> str:

    MAX_CONTEXT_CHARS = 6000
    MAX_CURRENT_MESSAGE_CHARS = 2500

    # Prevent one extremely large user message
    current_message = current_message.strip()

    if len(current_message) > MAX_CURRENT_MESSAGE_CHARS:
        current_message = current_message[
            :MAX_CURRENT_MESSAGE_CHARS
        ]

    history = conversation_service.get_history(
        session_id,
        user_id,
    )

    if not history:
        return current_message

    # Build history from newest messages backwards.
    # This keeps the most relevant recent context.
    selected_messages = []
    used_chars = len(current_message)

    for item in reversed(history):

        role = item["role"]
        content = item["content"]

        message_text = (
            f"{role}: {content}"
        )

        message_length = len(message_text)

        if (
            used_chars + message_length
            > MAX_CONTEXT_CHARS
        ):
            break

        selected_messages.append(
            message_text
        )

        used_chars += message_length

    # Restore chronological order
    selected_messages.reverse()

    history_text = "\n".join(
        selected_messages
    )

    if not history_text:
        return current_message

    return (
        "Previous conversation:\n\n"
        f"{history_text}\n\n"
        "Current user message:\n\n"
        f"{current_message}"
    )

app = FastAPI(
    title="CINQ",
    description="Intelligent Multi-Agent LLM Router",
    version="1.0.0",
)
app.include_router(sessions_router)
app.include_router(auth_router)
app.include_router(test_auth_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "CINQ API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/test-model")
def test_model():

    response = adapter.generate(
        model=settings.ROUTER_MODEL,
        system_prompt=(
            "You are CINQ, a helpful AI assistant. "
            "Answer clearly and briefly."
        ),
        user_message=(
            "Explain what an API is in one paragraph."
        ),
    )

    return {
        "model": settings.ROUTER_MODEL,
        "response": response,
    }

@app.get("/test-code-agent")
def test_code_agent():

    adapter = ModelAdapter()

    agent = CodeAgent(adapter)

    response = agent.run(
        "What is the difference between a Python list and tuple?"
    )

    return {
        "agent": agent.name,
        "description": agent.description,
        "capabilities": agent.get_capabilities(),
        "response": response,
    }


@app.get("/test-agents")
def test_agents():

    adapter = ModelAdapter()
    registry = AgentRegistry(adapter)

    agents = registry.get_all_agents()

    return {
        "count": len(agents),
        "agents": [
            {
                "id": agent_id,
                "name": agent.name,
                "description": agent.description,
                "capabilities": agent.get_capabilities(),
            }
            for agent_id, agent in agents.items()
        ],
    }


@app.get("/test-router")
def test_router(query: str):

    adapter = ModelAdapter()

    registry = AgentRegistry(adapter)

    router = AgentRouter(registry)

    result = router.route(query)

    return {
        "query": query,
        "agent": result["agent"].name,
        "agent_id": result["agent_id"],
        "confidence": result["confidence"],
        "scores": result["scores"],
        "matched_keywords": result["matched_keywords"],
    }

@app.get("/test-semantic-router")
def test_semantic_router(query: str):

    adapter = ModelAdapter()

    registry = AgentRegistry(adapter)

    router = SemanticRouter(registry)

    result = router.route(query)

    return {
        "query": query,
        "agent": result["agent"].name,
        "agent_id": result["agent_id"],
        "confidence": result["confidence"],
        "scores": result["scores"],
    }

@app.get("/test-llm-router")
def test_llm_router(query: str):

    adapter = ModelAdapter()

    router = LLMRouter(adapter)

    result = router.route(query)

    return {
        "query": query,
        "agent": result["agent"],
        "confidence": result["confidence"],
        "reason": result["reason"],
    }

@app.post(
    "/api/v1/chat",
    response_model=ChatResponse,
)
def chat(
    request: ChatRequest,
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request_start = time.perf_counter()

    conversation_service = ConversationService(
        db,
        adapter,
    )

    context = build_context(
        conversation_service,
        request.session_id,
        current_user.id,
        request.message,
    )

    # Save the current user message exactly once.
    conversation_service.add_message(
        session_id=request.session_id,
        user_id=current_user.id,
        role="user",
        content=request.message,
    )

    # =================================
    # MANUAL AGENT SELECTION
    # =================================
    if request.agent != "auto":
        try:
            agent = registry.get_agent(
                request.agent
            )

            generation_start = time.perf_counter()

            agent_input = context

            if agent.name.lower() == "research":
                agent_input = request.message.strip()[:1500]

            response = agent.run(
                agent_input
            )

            generation_time = (
                time.perf_counter()
                - generation_start
            )

            total_time = (
                time.perf_counter()
                - request_start
            )

            conversation_service.add_message(
                session_id=request.session_id,
                user_id=current_user.id,
                role="assistant",
                content=response,
                agent=agent.name,
            )

            logger.info(
                "Manual request completed | "
                "agent=%s | "
                "generation_time=%.3fs | "
                "total_latency=%.3fs",
                agent.name,
                generation_time,
                total_time,
            )

            return ChatResponse(
                session_id=request.session_id,
                response=response,
                agent=agent.name,
                confidence=1.0,
                reason=(
                    "Agent selected manually "
                    "by the user."
                ),
                model=agent.model,
                routing_method="manual",
            )

        except Exception as exc:
            logger.error(
                "Manual agent failed | "
                "agent=%s | error=%s",
                request.agent,
                str(exc),
                exc_info=True,
            )

            fallback_agent = registry.get_agent(
                "chat"
            )

            generation_start = time.perf_counter()

            fallback_context = context[:6000]

            response = fallback_agent.run(
                fallback_context
            )

            generation_time = (
                time.perf_counter()
                - generation_start
            )

            total_time = (
                time.perf_counter()
                - request_start
            )

            conversation_service.add_message(
                session_id=request.session_id,
                user_id=current_user.id,
                role="assistant",
                content=response,
                agent=fallback_agent.name,
            )

            logger.warning(
                "Manual fallback completed | "
                "agent=ChatAgent | "
                "generation_time=%.3fs | "
                "total_latency=%.3fs",
                generation_time,
                total_time,
            )

            return ChatResponse(
                session_id=request.session_id,
                response=response,
                agent=fallback_agent.name,
                confidence=0.0,
                reason=(
                    "The selected agent failed, "
                    "so CINQ used the ChatAgent "
                    "fallback."
                ),
                model=fallback_agent.model,
                routing_method="fallback",
            )

    # =================================
    # AUTOMATIC ROUTING
    # =================================
    try:
        routing_start = time.perf_counter()

        routing_result = router.route(
            request.message
        )

        routing_time = (
            time.perf_counter()
            - routing_start
        )

        logger.info(
            "Routing completed | "
            "agent=%s | "
            "confidence=%.2f | "
            "routing_time=%.3fs",
            routing_result["agent"],
            routing_result["confidence"],
            routing_time,
        )

    except Exception as exc:
        logger.error(
            "Router failed | error=%s",
            str(exc),
            exc_info=True,
        )

        fallback_agent = registry.get_agent(
            "chat"
        )

        generation_start = time.perf_counter()

        fallback_context = context[:6000]

        response = fallback_agent.run(
            fallback_context
        )

        generation_time = (
            time.perf_counter()
            - generation_start
        )

        total_time = (
            time.perf_counter()
            - request_start
        )

        conversation_service.add_message(
            session_id=request.session_id,
            user_id=current_user.id,
            role="assistant",
            content=response,
            agent=fallback_agent.name,
        )

        logger.warning(
            "Router fallback completed | "
            "agent=ChatAgent | "
            "generation_time=%.3fs | "
            "total_latency=%.3fs",
            generation_time,
            total_time,
        )

        return ChatResponse(
            session_id=request.session_id,
            response=response,
            agent=fallback_agent.name,
            confidence=0.0,
            reason=(
                "The router failed, "
                "so CINQ used the ChatAgent "
                "fallback."
            ),
            model=fallback_agent.model,
            routing_method="fallback",
        )

    # =================================
    # CONFIDENCE CHECK
    # =================================
    if (
        routing_result["confidence"]
        < settings.CONFIDENCE_THRESHOLD
    ):
        logger.warning(
            "Confidence fallback | "
            "agent=%s | "
            "confidence=%.2f | "
            "threshold=%.2f",
            routing_result["agent"],
            routing_result["confidence"],
            settings.CONFIDENCE_THRESHOLD,
        )

        fallback_agent = registry.get_agent(
            "chat"
        )

        generation_start = time.perf_counter()

        fallback_context = context[:6000]

        response = fallback_agent.run(
            fallback_context
        )

        generation_time = (
            time.perf_counter()
            - generation_start
        )

        total_time = (
            time.perf_counter()
            - request_start
        )

        conversation_service.add_message(
            session_id=request.session_id,
            user_id=current_user.id,
            role="assistant",
            content=response,
            agent=fallback_agent.name,
        )

        logger.info(
            "Confidence fallback completed | "
            "generation_time=%.3fs | "
            "total_latency=%.3fs",
            generation_time,
            total_time,
        )

        return ChatResponse(
            session_id=request.session_id,
            response=response,
            agent=fallback_agent.name,
            confidence=routing_result["confidence"],
            reason=(
                "Router confidence was below "
                f"the {settings.CONFIDENCE_THRESHOLD} "
                "threshold, so CINQ used the "
                "ChatAgent fallback."
            ),
            model=fallback_agent.model,
            routing_method="confidence_fallback",
        )

    # =================================
    # SELECTED AGENT
    # =================================
    try:
        agent = registry.get_agent(
            routing_result["agent"]
        )

        generation_start = time.perf_counter()

        agent_input = context

        if agent.name.lower() == "research":
            agent_input = request.message.strip()[:1500]

        response = agent.run(
            agent_input
        )

        generation_time = (
            time.perf_counter()
            - generation_start
        )

        total_time = (
            time.perf_counter()
            - request_start
        )

        conversation_service.add_message(
            session_id=request.session_id,
            user_id=current_user.id,
            role="assistant",
            content=response,
            agent=agent.name,
        )

        logger.info(
            "Agent generation completed | "
            "agent=%s | "
            "generation_time=%.3fs",
            agent.name,
            generation_time,
        )

        logger.info(
            "Request completed | "
            "agent=%s | "
            "total_latency=%.3fs",
            agent.name,
            total_time,
        )

        return ChatResponse(
            session_id=request.session_id,
            response=response,
            agent=agent.name,
            confidence=routing_result["confidence"],
            reason=routing_result["reason"],
            model=agent.model,
            routing_method="automatic",
        )

    except Exception as exc:
        logger.error(
            "Selected agent failed | "
            "agent=%s | error=%s",
            routing_result["agent"],
            str(exc),
            exc_info=True,
        )

        fallback_agent = registry.get_agent(
            "chat"
        )

        generation_start = time.perf_counter()

        fallback_context = context[:6000]

        response = fallback_agent.run(
            fallback_context
        )

        generation_time = (
            time.perf_counter()
            - generation_start
        )

        total_time = (
            time.perf_counter()
            - request_start
        )

        conversation_service.add_message(
            session_id=request.session_id,
            user_id=current_user.id,
            role="assistant",
            content=response,
            agent=fallback_agent.name,
        )

        logger.warning(
            "Agent fallback completed | "
            "agent=ChatAgent | "
            "generation_time=%.3fs | "
            "total_latency=%.3fs",
            generation_time,
            total_time,
        )

        return ChatResponse(
            session_id=request.session_id,
            response=response,
            agent=fallback_agent.name,
            confidence=0.0,
            reason=(
                "The selected agent failed, "
                "so CINQ used the ChatAgent "
                "fallback."
            ),
            model=fallback_agent.model,
            routing_method="fallback",
        )
