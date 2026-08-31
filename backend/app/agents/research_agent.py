from app.agents.base import BaseAgent
from app.models.adapter import ModelAdapter
from app.core.config import settings
from app.tools.web_search import WebSearchTool


class ResearchAgent(BaseAgent):

    def __init__(self, model_adapter: ModelAdapter):

        self.search_tool = WebSearchTool()

        self.system_prompt = """
You are CINQ ResearchAgent.

You specialize in:
- Factual questions
- Scientific information
- History
- Technology
- Comparisons
- Explanations
- Evidence-based questions

You are given information retrieved from web search.

Use the provided search results to answer the user's question.

Rules:
- Prefer information from the provided sources.
- Do not invent facts, statistics, sources, or quotations.
- Clearly distinguish established facts from uncertainty.
- If the sources do not contain enough information, say so.
- Do not claim to have searched the internet yourself.
- Explain information clearly and accurately.
- Keep the answer appropriate to the user's requested length.
- Include relevant source URLs when provided.
"""

        super().__init__(
            name="ResearchAgent",
            description=(
                "Specialized agent for factual questions, "
                "research, analysis, and evidence-based responses."
            ),
            system_prompt=self.system_prompt,
            model=settings.AGENT_MODEL,
            model_adapter=model_adapter,
        )

    def run(self, user_message: str) -> str:

        search_results = self.search_tool.search(
            query=user_message,
            max_results=5,
        )

        if not search_results:
            return self.model_adapter.generate(
                model=self.model,
                system_prompt=self.system_prompt,
                user_message=user_message,
            )

        sources_text = "\n\n".join(
            [
                f"""
SOURCE {index}
Title: {result["title"]}
URL: {result["url"]}
Relevance Score: {result["score"]}

Content:
{result["content"]}
"""
                for index, result in enumerate(search_results, start=1)
            ]
        )

        research_prompt = f"""
User question:
{user_message}

Retrieved web sources:

{sources_text}

Instructions:

1. Answer the user's question using the retrieved sources.
2. Do not invent information that is not supported by the sources.
3. If sources disagree, clearly mention the disagreement.
4. If the sources are insufficient, say so.
5. Do not cite a source that you did not use.
6. At the end, provide a Sources section.
7. List only sources that contributed information to the answer.

Use this format:

Sources:
[1] Source title - URL
[2] Source title - URL

Do not include irrelevant sources.
"""

        response = self.model_adapter.generate(
            model=self.model,
            system_prompt=self.system_prompt,
            user_message=research_prompt,
        )

        return response

    def get_capabilities(self) -> list[str]:
        return [
            "research",
            "factual analysis",
            "technical research",
            "academic analysis",
            "comparison",
            "evidence-based reasoning",
            "current events",
        ]