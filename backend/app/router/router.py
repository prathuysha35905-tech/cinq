from app.agents.registry import AgentRegistry
from app.router.classifier import RuleClassifier


class AgentRouter:

    def __init__(self, registry: AgentRegistry):
        self.registry = registry
        self.classifier = RuleClassifier()

    def route(self, query: str):

        result = self.classifier.classify(query)

        selected_agent = self.registry.get_agent(
            result["agent"]
        )

        return {
            "agent": selected_agent,
            "agent_id": result["agent"],
            "confidence": result["confidence"],
            "scores": result["scores"],
            "matched_keywords": result["matched_keywords"],
        }