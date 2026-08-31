from tavily import TavilyClient

from app.core.config import settings


class WebSearchTool:

    def __init__(self):
        if not settings.TAVILY_API_KEY:
            raise RuntimeError(
                "TAVILY_API_KEY is not configured."
            )

        self.client = TavilyClient(
            api_key=settings.TAVILY_API_KEY
        )

    def search(
        self,
        query: str,
        max_results: int = 5,
    ) -> list[dict]:

        response = self.client.search(
            query=query,
            search_depth="basic",
            max_results=max_results,
            include_answer=False,
        )

        results = []

        for item in response.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", ""),
                "score": item.get("score", 0.0),
            })

        return results