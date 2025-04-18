from fastapi import FastAPI
from nexus.protocols.a2a import router as a2a_router
from nexus.protocols.mcp import router as mcp_router

app = FastAPI(
    title="Nexus Nexus API",
    version="1.0.0",
)

# Register A2A and MCP endpoints
app.include_router(a2a_router, prefix="/api/chat/a2a", tags=["a2a"])
app.include_router(mcp_router, prefix="/api/chat/mcp", tags=["mcp"])

@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}