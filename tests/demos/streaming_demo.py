import time

from nexus import Agent, BaseTool
from nexus.agency.agency import Agency
from nexus.constants import DEFAULT_MODEL_MINI


class TestTool(BaseTool):
    def run(self):
        time.sleep(10)
        print("done")
        return "Test Successful"


def main():
    ceo = Agent(
        name="ceo",
        instructions="You are a CEO of an agency made for testing purposes.",
        model=DEFAULT_MODEL_MINI,
    )
    test_agent1 = Agent(name="test_agent1", tools=[TestTool], model=DEFAULT_MODEL_MINI)
    test_agent2 = Agent(name="test_agent2", model=DEFAULT_MODEL_MINI)

    agency = Agency(
        [
            ceo,
            [ceo, test_agent1, test_agent2],
            [ceo, test_agent2],
        ]
    )

    agency.demo_gradio()


if __name__ == "__main__":
    main()
