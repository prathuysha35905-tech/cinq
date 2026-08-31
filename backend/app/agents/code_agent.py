from app.agents.base import BaseAgent
from app.models.adapter import ModelAdapter
from app.core.config import settings


class CodeAgent(BaseAgent):

    def __init__(self, model_adapter: ModelAdapter):

        self.system_prompt = """
You are CINQ CodeAgent.

You specialize in:
- Full-stack development
- FastAPI
- API integrations
- Algorithms and data structures
- Databases
- Debugging and error detection
- Cybersecurity
- Cloud computing

You are highly capable with:
Python, C, C++, C#, Java, JavaScript, TypeScript,
React, Tailwind CSS, Linux, SQL, and related technologies.

Give accurate, technically sound answers.

When code is required, provide complete and runnable code whenever
practical. Explain the important parts of the code and why the solution works.

When the user asks for the output of code, do not pretend to execute it.
Provide the expected or predicted output and clearly state that it is
predicted output.

When debugging, identify the likely cause of the problem and provide
the exact changes required to fix it.

Do not invent libraries, APIs, functions, or technical behavior.
"""

        super().__init__(
            name="CodeAgent",
            description=(
                "Specialized agent for programming, "
                "debugging, software engineering, and APIs."
            ),
            system_prompt=self.system_prompt,
            model=settings.AGENT_MODEL,
            model_adapter=model_adapter,
        )

    def get_capabilities(self) -> list[str]:
        return [
            "programming",
            "debugging",
            "software engineering",
            "APIs",
            "backend development",
            "frontend development",
            "databases",
            "system architecture",
        ]