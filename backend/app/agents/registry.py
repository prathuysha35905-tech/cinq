from app.models.adapter import ModelAdapter

from app.agents.base import BaseAgent
from app.agents.code_agent import CodeAgent
from app.agents.writer_agent import WriterAgent
from app.agents.math_agent import MathAgent
from app.agents.research_agent import ResearchAgent
from app.agents.chat_agent import ChatAgent


class AgentRegistry:
    def __init__(self, model_adapter: ModelAdapter):
        self.model_adapter = model_adapter

        self.agents: dict[str, BaseAgent] = {
            "code": CodeAgent(model_adapter),
            "writer": WriterAgent(model_adapter),
            "math": MathAgent(model_adapter),
            "research": ResearchAgent(model_adapter),
            "chat": ChatAgent(model_adapter),
        }

    def get_agent(self, agent_name: str) -> BaseAgent:
        if agent_name not in self.agents:
            raise ValueError(
                f"Unknown agent: {agent_name}"
            )

        return self.agents[agent_name]

    def get_all_agents(self) -> dict[str, BaseAgent]:
        return self.agents