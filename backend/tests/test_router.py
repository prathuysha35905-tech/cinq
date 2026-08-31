from app.router.llm_router import LLMRouter
from app.models.adapter import ModelAdapter


def test_router_returns_valid_agent():
    adapter = ModelAdapter()
    router = LLMRouter(adapter)

    result = router.route("What is 25 * 4?")

    assert result["agent"] in {
        "code",
        "math",
        "writer",
        "research",
        "chat",
    }

    assert 0.0 <= result["confidence"] <= 1.0
    assert isinstance(result["reason"], str)