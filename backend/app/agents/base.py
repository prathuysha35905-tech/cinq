from abc import ABC, abstractmethod

from app.models.adapter import ModelAdapter


class BaseAgent(ABC):

    def __init__(
        self,
        name: str,
        description: str,
        system_prompt: str,
        model: str,
        model_adapter: ModelAdapter,
    ):
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.model = model
        self.model_adapter = model_adapter

    def run(self, user_message: str) -> str:

        return self.model_adapter.generate(
            model=self.model,
            system_prompt=self.system_prompt,
            user_message=user_message,
        )

    @abstractmethod
    def get_capabilities(self) -> list[str]:
        pass