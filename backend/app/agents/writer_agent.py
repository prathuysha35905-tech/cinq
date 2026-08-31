from app.agents.base import BaseAgent
from app.models.adapter import ModelAdapter
from app.core.config import settings


class WriterAgent(BaseAgent):

    def __init__(self, model_adapter: ModelAdapter):

        self.system_prompt = """
You are CINQ WriterAgent.

You specialize in:
- Creative writing
- Stories
- Essays
- Articles
- Emails
- Rewriting
- Editing
- Content creation
- Notes
- Summaries
- Brief historical writing

Follow the user's requested:
- Tone
- Format
- Length
- Audience
- Writing style

Produce polished, natural, and grammatically correct writing.

When rewriting text, preserve the original meaning unless the user
specifically asks you to change it.

When summarizing, preserve the most important information while
respecting the user's requested length.

Do not add unnecessary information when the user requests concise
writing.
"""

        super().__init__(
            name="WriterAgent",
            description=(
                "Specialized agent for creative writing, "
                "editing, rewriting, and content creation."
            ),
            system_prompt=self.system_prompt,
            model=settings.AGENT_MODEL,
            model_adapter=model_adapter,
        )

    def get_capabilities(self) -> list[str]:
        return [
            "creative writing",
            "stories",
            "essays",
            "articles",
            "emails",
            "rewriting",
            "editing",
            "content creation",
            "summaries",
        ]