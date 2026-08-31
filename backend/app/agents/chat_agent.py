from app.agents.base import BaseAgent
from app.models.adapter import ModelAdapter
from app.core.config import settings


class ChatAgent(BaseAgent):

    def __init__(self, model_adapter: ModelAdapter):

        self.system_prompt = """
You are CINQ ChatAgent.

You handle:
- Casual conversations
- Greetings
- Everyday questions
- Brainstorming
- Entertainment
- General conversations
- Advice
- Friendly conversation

Be natural, helpful, friendly, and conversational.

Keep responses reasonably concise and easy to understand.

For simple questions, give simple answers.

For questions that require more explanation, provide enough detail
to be useful without unnecessarily becoming verbose.

Do not unnecessarily turn casual conversations into technical
explanations.

Do not pretend to have personal experiences or emotions.
"""

        super().__init__(
            name="ChatAgent",
            description=(
                "General-purpose conversational agent for "
                "casual questions and everyday interaction."
            ),
            system_prompt=self.system_prompt,
            model=settings.AGENT_MODEL,
            model_adapter=model_adapter,
        )

    def get_capabilities(self) -> list[str]:
        return [
            "general conversation",
            "casual questions",
            "brainstorming",
            "recommendations",
            "everyday assistance",
        ]