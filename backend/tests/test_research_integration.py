from app.models.adapter import ModelAdapter
from app.agents.research_agent import ResearchAgent


def test_research_agent_with_tavily():
    adapter = ModelAdapter()
    agent = ResearchAgent(adapter)

    response = agent.run(
        "What are the main applications of artificial intelligence?"
    )

    assert response
    assert len(response.strip()) > 0
    assert "Sources" in response