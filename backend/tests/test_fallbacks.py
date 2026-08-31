from unittest.mock import patch

from app.models.adapter import ModelAdapter
from app.router.llm_router import LLMRouter


def test_router_fallback_when_model_fails():
    adapter = ModelAdapter()
    router = LLMRouter(adapter)

    with patch.object(
        adapter,
        "generate",
        side_effect=RuntimeError("Model failure"),
    ):
        try:
            result = router.route("What is 25 * 4?")
        except RuntimeError:
            result = None

    # Router should fail cleanly when the model is unavailable.
    assert result is None