from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Callable, Awaitable

class MCPRequest(BaseModel):
    tool_name: str
    args: Dict[str, Any]

class MCPClient:
    """
    Client for invoking registered MCP tools (Model Context Protocol v1.6).
    """
    async def call_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a registered tool by name with arguments.
        """
        server = MCPServer()
        return await server.handle_request(tool_name, args)

class MCPServer:
    """
    Server managing tool registration and invocation.
    """
    def __init__(self):
        self._registry: Dict[str, Callable[..., Awaitable[Dict[str, Any]]]] = {}

    def register_tool(self, name: str, handler: Callable[..., Awaitable[Dict[str, Any]]]) -> None:
        """
        Register a tool handler for a given name.
        """
        self._registry[name] = handler

    async def handle_request(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle an incoming MCP tool call request.
        """
        if tool_name not in self._registry:
            raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not registered")
        handler = self._registry[tool_name]
        return await handler(args)

router = APIRouter()

@router.post("/", response_model=Dict[str, Any])
async def chat_mcp(request: MCPRequest):
    """
    Endpoint to invoke a registered MCP tool call.
    """
    server = MCPServer()
    return await server.handle_request(request.tool_name, request.args)