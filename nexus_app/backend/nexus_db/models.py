# nexus_db/models.py
import datetime
import os
from sqlalchemy import (
    create_engine, String, ForeignKey, DateTime, Text, JSON, UniqueConstraint, Index, MetaData
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any

# Define a naming convention for constraints and indexes
# https://alembic.sqlalchemy.org/en/latest/naming.html
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata_obj = MetaData(naming_convention=convention)

class Base(DeclarativeBase):
    metadata = metadata_obj
    # Add default timestamp columns
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


# ----- Core Nexus Component Tables -----

class Agency(Base):
    __tablename__ = "agencies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    shared_instructions: Mapped[Optional[str]] = mapped_column(Text)
    # Store config as JSON (temperature, top_p, max_tokens etc.)
    config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)

    # Relationships
    agents: Mapped[List["Agent"]] = relationship(
        secondary="agency_agents", back_populates="agencies"
    )
    communication_paths: Mapped[List["AgencyCommunication"]] = relationship(back_populates="agency")

    def __repr__(self) -> str:
        return f"<Agency(id={self.id}, name='{self.name}')>"


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Name should be unique, agents might be shared across agencies later?
    # Let's make it unique for now. Can relax later if needed.
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    instructions: Mapped[Optional[str]] = mapped_column(Text) # Store MD content directly
    # Store agent-specific config (model, temp, max_tokens, files_folder, etc.)
    config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    # Potentially store OAI assistant ID if managed externally
    openai_assistant_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)

    # Relationships
    agencies: Mapped[List["Agency"]] = relationship(
        secondary="agency_agents", back_populates="agents"
    )
    tools: Mapped[List["Tool"]] = relationship(
        secondary="agent_tools", back_populates="agents"
    )
    source_communications: Mapped[List["AgencyCommunication"]] = relationship(
        back_populates="source_agent", foreign_keys="AgencyCommunication.source_agent_id"
    )
    target_communications: Mapped[List["AgencyCommunication"]] = relationship(
        back_populates="target_agent", foreign_keys="AgencyCommunication.target_agent_id"
    )

    def __repr__(self) -> str:
        return f"<Agent(id={self.id}, name='{self.name}')>"


class Tool(Base):
    __tablename__ = "tools"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Tool name (class name) should be unique
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text) # Docstring
    code_content: Mapped[Optional[str]] = mapped_column(Text) # Store python code
    # List of pip requirements? Maybe JSON?
    requirements: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)

    # Relationships
    agents: Mapped[List["Agent"]] = relationship(
        secondary="agent_tools", back_populates="tools"
    )

    def __repr__(self) -> str:
        return f"<Tool(id={self.id}, name='{self.name}')>"


# ----- Association Tables -----

class AgencyAgent(Base):
    __tablename__ = "agency_agents"
    __table_args__ = (
        UniqueConstraint('agency_id', 'agent_id', name='uq_agency_agent'),
        Index('ix_agency_agent_agency_id', 'agency_id'),
        Index('ix_agency_agent_agent_id', 'agent_id'),
    )

    agency_id: Mapped[int] = mapped_column(ForeignKey("agencies.id", ondelete="CASCADE"), primary_key=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True)
    # Could add role info here if needed (e.g., 'ceo', 'member')
    # role: Mapped[str] = mapped_column(String(50))


class AgentTool(Base):
    __tablename__ = "agent_tools"
    __table_args__ = (
        UniqueConstraint('agent_id', 'tool_id', name='uq_agent_tool'),
        Index('ix_agent_tool_agent_id', 'agent_id'),
        Index('ix_agent_tool_tool_id', 'tool_id'),
     )

    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True)


class AgencyCommunication(Base):
    __tablename__ = "agency_communications"
    __table_args__ = (
        UniqueConstraint('agency_id', 'source_agent_id', 'target_agent_id', name='uq_agency_communication_path'),
        Index('ix_agency_communication_agency_id', 'agency_id'),
        Index('ix_agency_communication_source_agent_id', 'source_agent_id'),
        Index('ix_agency_communication_target_agent_id', 'target_agent_id'),
     )

    id: Mapped[int] = mapped_column(primary_key=True) # Explicit PK for easier reference if needed
    agency_id: Mapped[int] = mapped_column(ForeignKey("agencies.id", ondelete="CASCADE"))
    source_agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id", ondelete="CASCADE"))
    target_agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id", ondelete="CASCADE"))

    # Relationships
    agency: Mapped["Agency"] = relationship(back_populates="communication_paths")
    source_agent: Mapped["Agent"] = relationship(foreign_keys=[source_agent_id], back_populates="source_communications")
    target_agent: Mapped["Agent"] = relationship(foreign_keys=[target_agent_id], back_populates="target_communications")

# ----- Operational/Mutable Data Table -----
# Placeholder - Needs refinement based on specific needs (logs, shared_state, user_settings, etc.)
# This structure is very generic. Consider separate tables for logs, conversations, etc. if needed.

class OperationalData(Base):
    __tablename__ = "operational_data"
    __table_args__ = (
        Index('ix_operational_data_scope_key', 'data_scope', 'data_key', unique=True), # Ensure key is unique within scope
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Scope could be 'global', 'agency:<id>', 'agent:<id>', 'user:<id>', 'thread:<id>' etc.
    data_scope: Mapped[str] = mapped_column(String(255), index=True)
    data_key: Mapped[str] = mapped_column(String(255), index=True)
    data_value: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON) # Store arbitrary data as JSON
    # Could add owner_id/type if needed for finer-grained access control

    def __repr__(self) -> str:
        return f"<OperationalData(id={self.id}, scope='{self.data_scope}', key='{self.data_key}')>"

# ----- Database Setup Function -----

def get_engine(db_url: str = "postgresql+psycopg2://user:password@host:port/database"):
    """Creates a SQLAlchemy engine."""
    # Example URL: "postgresql+psycopg2://nexus_user:your_password@localhost:5432/nexus_db"
    # Ensure the database (e.g., 'nexus_db') exists before running.
    # Use echo=True for debugging SQL statements
    return create_engine(db_url, echo=False)

def create_tables(engine):
    """Creates all tables defined in the Base metadata."""
    Base.metadata.create_all(engine)

if __name__ == "__main__":
    # Example usage:
    # 1. Make sure PostgreSQL server is running.
    # 2. Manually create the database 'nexus_db' and a user 'nexus_user'.
    #    CREATE DATABASE nexus_db;
    #    CREATE USER nexus_user WITH PASSWORD 'your_password';
    #    GRANT ALL PRIVILEGES ON DATABASE nexus_db TO nexus_user;
    # 3. Set the DB URL (consider using environment variables).
    DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://nexus_user:your_password@localhost:5432/nexus_db")

    print(f"Connecting to database: {DATABASE_URL.replace('your_password', '********')}") # Mask password in output
    try:
        engine = get_engine(DATABASE_URL)
        print("Creating tables...")
        create_tables(engine)
        print("Tables created successfully (if they didn't exist).")
    except Exception as e:
        print(f"An error occurred during database setup: {e}")
        print("Please ensure the PostgreSQL server is running, the database and user exist,")
        print("and the DATABASE_URL is correctly configured (e.g., via environment variable).")
        print("You might need to install the db driver: pip install psycopg2-binary") 