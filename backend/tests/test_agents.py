from app.models.adapter import ModelAdapter
from app.agents.code_agent import CodeAgent
from app.agents.math_agent import MathAgent
from app.agents.writer_agent import WriterAgent
from app.agents.research_agent import ResearchAgent
from app.agents.chat_agent import ChatAgent


def test_code_agent():
    agent = CodeAgent(ModelAdapter())

    response = agent.run("Write a Python function to reverse a string.")

    assert response
    assert isinstance(response, str)


def test_math_agent():
    agent = MathAgent(ModelAdapter())

    response = agent.run("What is 25 * 4?")

    assert response
    assert isinstance(response, str)


def test_writer_agent():
    agent = WriterAgent(ModelAdapter())

    response = agent.run("Write a short paragraph about artificial intelligence.")

    assert response
    assert isinstance(response, str)


def test_research_agent():
    agent = ResearchAgent(ModelAdapter())

    response = agent.run("What is the purpose of the Python programming language?")

    assert response
    assert isinstance(response, str)


def test_chat_agent():
    agent = ChatAgent(ModelAdapter())

    response = agent.run("Hello, how are you?")

    assert response
    assert isinstance(response, str)