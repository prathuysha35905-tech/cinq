from openai import OpenAI

from app.core.config import settings


class ModelAdapter:

    def __init__(self):
        self.client = OpenAI(
            base_url=settings.LMSTUDIO_BASE_URL,
            api_key=settings.LMSTUDIO_API_KEY,
        )

    def generate(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
    ) -> str:

        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
            temperature=0.7,
        )

        if not response.choices:
            raise RuntimeError(
                "LM Studio returned no choices."
            )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError(
                "LM Studio returned an empty response."
            )

        return content.strip()