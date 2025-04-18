import os
from typing import Dict, List

from nexus.tools import BaseTool
from mem0 import Memory, MemoryClient
from mem0.configs.base import MemoryConfig
from pydantic import Field


class SearchMemoryTool(BaseTool):
    """Search for relevant memories based on a query."""

    query: str = Field(..., description="The search query to find relevant memories.")
    top_k: int = Field(default=5, description="Maximum number of memories to return.")

    def run(self) -> List[Dict[str, str]]:
        """Search memory and return relevant messages."""
        if api_key := os.getenv("MEM0_API_KEY"):
            client = MemoryClient(api_key=api_key)
        else:
            client = None
        user_id = self._shared_state.get("user_id", "user_123")

        if client:
            try:
                return client.search(
                    query=self.query,
                    user_id=user_id,
                    output_format="v1.1",
                    top_k=self.top_k,
                )
            except Exception as e:
                print(f"Warning: Failed to use mem0 API: {str(e)}")

        # Local storage fallback using Memory()
        local_memory = Memory(config=MemoryConfig(version="v1.1"))
        if not local_memory:
            return []

        try:
            memories = local_memory.search(
                query=self.query,
                user_id=user_id,
                limit=self.top_k,
            )

            # Convert memories to expected format
            formatted_memories = []
            for memory in memories:
                formatted_memories.append(
                    {
                        "text": memory["memory"],
                        "role": memory.get("metadata", {}).get("role", "unknown"),
                        "score": memory.get("score", 1.0),
                        "id": memory.get("id", "unknown"),
                    }
                )

            return formatted_memories
        except Exception as e:
            print(f"Error searching memory: {str(e)}")
            return []


if __name__ == "__main__":
    tool = SearchMemoryTool(query="can I refund dairy?", top_k=3)
    results = tool.run()
    print("Found memories:", results)