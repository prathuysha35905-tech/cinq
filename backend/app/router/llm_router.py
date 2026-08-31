import json

from app.models.adapter import ModelAdapter
from app.core.config import settings


class LLMRouter:

    def __init__(self, model_adapter: ModelAdapter):

        self.model_adapter = model_adapter

        self.system_prompt = """
You are CINQ's routing engine.

Your ONLY job is to determine which specialized agent
should answer the user's request.

Available agents:

1. code
   - Programming
   - Debugging
   - Software engineering
   - APIs
   - Databases
   - Algorithms
   - Frontend and backend development

2. math
   - Mathematics
   - Calculations
   - Algebra
   - Calculus
   - Probability
   - Statistics
   - Logical and quantitative problems

3. writer
   - Creative writing
   - Stories
   - Essays
   - Articles
   - Rewriting
   - Editing
   - Emails
   - Content creation

4. research
   - Factual information
   - Research
   - Current events
   - History
   - Scientific information
   - Comparisons
   - Evidence-based questions

5. chat
   - Casual conversation
   - Greetings
   - General questions
   - Brainstorming
   - Entertainment
   - Everyday conversation

Choose EXACTLY ONE agent.

Return ONLY valid JSON.

The JSON must have exactly these fields:

{
    "agent": "code | math | writer | research | chat",
    "confidence": 0.0,
    "reason": "short explanation"
}

Confidence must be a number between 0.0 and 1.0.

Do not answer the user's question.

Only classify it.
"""

    def route(self, query: str) -> dict:

        response = self.model_adapter.generate(
            model=settings.ROUTER_MODEL,
            system_prompt=self.system_prompt,
            user_message=query,
        )

        return self._parse_response(response)

    def _parse_response(self, response: str) -> dict:

        response = response.strip()

        # Remove Markdown code fences if Gemma adds them
        if response.startswith("```"):

            lines = response.splitlines()

            if lines:
                lines = lines[1:]

            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]

            response = "\n".join(lines).strip()

        # Find the JSON object if Gemma adds extra text
        start = response.find("{")
        end = response.rfind("}")

        if start == -1 or end == -1 or end <= start:
            raise ValueError(
                f"Router returned invalid JSON: {response}"
            )

        json_text = response[start:end + 1]

        try:

            result = json.loads(json_text)

        except json.JSONDecodeError as exc:

            raise ValueError(
                f"Router returned invalid JSON: {response}"
            ) from exc

        required_fields = {
            "agent",
            "confidence",
            "reason",
        }

        if not required_fields.issubset(result.keys()):

            raise ValueError(
                "Router response is missing required fields."
            )

        valid_agents = {
            "code",
            "math",
            "writer",
            "research",
            "chat",
        }

        if result["agent"] not in valid_agents:

            raise ValueError(
                f"Invalid agent selected: {result['agent']}"
            )

        try:

            confidence = float(
                result["confidence"]
            )

        except (TypeError, ValueError) as exc:

            raise ValueError(
                "Confidence must be a number."
            ) from exc

        if not 0.0 <= confidence <= 1.0:

            raise ValueError(
                "Confidence must be between 0.0 and 1.0."
            )

        return {
            "agent": result["agent"],
            "confidence": confidence,
            "reason": str(result["reason"]),
        }