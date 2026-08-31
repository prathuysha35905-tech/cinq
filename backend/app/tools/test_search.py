from app.tools.web_search import WebSearchTool


tool = WebSearchTool()

results = tool.search(
    "latest developments in artificial intelligence",
    max_results=3,
)

for result in results:
    print("\nTITLE:", result["title"])
    print("URL:", result["url"])
    print("CONTENT:", result["content"])
    print("SCORE:", result["score"])