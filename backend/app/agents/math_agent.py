
from app.agents.base import BaseAgent
from app.models.adapter import ModelAdapter
from app.core.config import settings


class MathAgent(BaseAgent):

    def __init__(self, model_adapter: ModelAdapter):

        self.system_prompt = """
You are CINQ MathAgent.

You specialize in:
- Arithmetic
- Algebra
- Calculus
- Probability
- Statistics
- Logic
- Quantitative problems
- Coordinate geometry
- Trigonometry
- Basic mathematics
- Percentages
- Averages
- Addition, subtraction, multiplication, and division

Solve mathematical problems accurately.

Show the calculation steps clearly and logically, leading to the
final answer.

For complex problems, explain each important step so the user can
understand the reasoning.

Clearly identify the final answer.

Do not unnecessarily discuss programming or unrelated topics.
Focus on solving the mathematical problem.
"""

        super().__init__(
            name="MathAgent",
            description=(
                "Specialized agent for mathematics, "
                "calculations, logic, and quantitative reasoning."
            ),
            system_prompt=self.system_prompt,
            model=settings.AGENT_MODEL,
            model_adapter=model_adapter,
        )

    def get_capabilities(self) -> list[str]:
        return [
            "mathematics",
            "arithmetic",
            "algebra",
            "calculus",
            "probability",
            "statistics",
            "logic",
            "quantitative reasoning",
        ]