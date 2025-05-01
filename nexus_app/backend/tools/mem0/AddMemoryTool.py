import os
from typing import Dict, List

from tools import BaseTool
from mem0 import Memory, MemoryClient
from mem0.configs.base import MemoryConfig
from pydantic import Field


class AddMemoryTool(BaseTool):
    """Store a message into long-term memory.
    """

    message: str = Field(
        ...,
        description="Message string to store in memory.",

    )

    def run(self) -> str:
        """Store the message in memory and return a confirmation."""
        if api_key := os.getenv("MEM0_API_KEY"):
            client = MemoryClient(api_key=api_key)
        else:
            client = None
        user_id = self._shared_state.get("user_id", "user_123")

        if client:
            try:
                response = client.add(
                    messages=self.message, user_id=user_id, output_format="v1.1"
                )
                return f"Successfully stored message for user {user_id}. Response: {response}"
            except Exception as e:
                print(f"Warning: Failed to use mem0 API: {str(e)}")

        # Local storage fallback using Memory()
        local_memory = Memory(config=MemoryConfig(version="v1.1"))
        if not local_memory:
            return "Error: Could not initialize local memory storage"

        try:
            local_memory.add(messages=self.message, user_id=user_id, output_format="v1.1")
            return f"Successfully stored message locally for user {user_id}"
        except Exception as e:
            return f"Error: Could not store message: {str(e)}"


if __name__ == "__main__":
    tool = AddMemoryTool(
        message="Attempted refund for dairy product (Order ID: 127584) failed due to non-refundable item policy."
    )
    print(tool.run())