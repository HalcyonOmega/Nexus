import os
from typing import Optional

from nexus.tools import BaseTool
from mem0 import Memory, MemoryClient
from mem0.configs.base import MemoryConfig
from pydantic import Field


class DeleteMemoryTool(BaseTool):
    """Delete stored memory - supports selective deletion by id or all memories for the current user."""

    memory_id: Optional[str] = Field(
        None,
        description="Optional specific memory ID to delete. If provided, only this memory will be deleted.",
    )
    confirm_delete_all: bool = Field(
        default=False,
        description="Set to true to confirm deletion of all memories for the current user. Required for deleting all memories.",
    )

    def run(self) -> str:
        """Delete memories based on provided parameters."""
        if api_key := os.getenv("MEM0_API_KEY"):
            client = MemoryClient(api_key=api_key)
        else:
            client = None
        user_id = self._shared_state.get("user_id", "user_123")

        if not user_id:
            return "Error: No user_id found in shared state"

        # Handle selective deletion by memory_id
        if self.memory_id:
            if client:
                try:
                    client.delete(memory_id=self.memory_id)
                    return f"Successfully deleted memory {self.memory_id}"
                except Exception as e:
                    print(f"Warning: Failed to use mem0 API: {str(e)}")

            local_memory = Memory(config=MemoryConfig(version="v1.1"))
            if local_memory:
                try:
                    local_memory.delete(memory_id=self.memory_id)
                    return f"Successfully deleted memory {self.memory_id}"
                except Exception as e:
                    return f"Error deleting memory: {str(e)}"

        # Handle deletion of all memories for a user
        if self.confirm_delete_all:
            if client:
                try:
                    response = client.delete_all(user_id=user_id)
                    return f"Successfully deleted all memories for user {user_id}. Response: {response}"
                except Exception as e:
                    print(f"Warning: Failed to use mem0 API: {str(e)}")

            if local_memory:
                try:
                    response = local_memory.delete_all(user_id=user_id)
                    return f"Successfully deleted all memories for user {user_id}. Response: {response}"
                except Exception as e:
                    return f"Error deleting memories: {str(e)}"

            return "Error: Memory deletion failed"

        return "Error: Must provide either memory_id or confirm_delete_all=True"


if __name__ == "__main__":
    # Test selective deletion
    memory_id = "b301cb0b-cce6-48b3-9421-ac7ae4b74d7b"
    # tool = DeleteMemoryTool(memory_id=memory_id)
    # print("Testing selective deletion:", tool.run())

    # Test deletion of all memories for a user
    tool = DeleteMemoryTool(confirm_delete_all=True)
    print("Testing user deletion:", tool.run())