-- SQL Schema for Nexus Core Entities

-- Extension for JSONB indexing (optional but recommended)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Agencies Table
CREATE TABLE agencies (
    agency_pk SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE, -- Optional: Enforce uniqueness if agency names/folders should be unique
    shared_instructions_path VARCHAR(1024),
    shared_instructions_content TEXT,
    shared_files TEXT[],
    async_mode VARCHAR(50), -- e.g., 'threading', 'tools_threading'
    send_message_tool_class_name VARCHAR(255),
    settings_path VARCHAR(1024) DEFAULT './settings.json',
    temperature FLOAT DEFAULT 1.0,
    top_p FLOAT DEFAULT 1.0,
    max_prompt_tokens INTEGER,
    max_completion_tokens INTEGER,
    truncation_strategy JSONB,
    entry_point_agent_id INTEGER, -- FK added later to avoid circular dependency during creation
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Agents Table
CREATE TABLE agents (
    agent_pk SERIAL PRIMARY KEY,
    agency_id INTEGER NOT NULL REFERENCES agencies(agency_pk) ON DELETE CASCADE,
    agent_id_str VARCHAR(255) UNIQUE, -- The optional 'id' parameter from Agent init
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions_path VARCHAR(1024),
    instructions_content TEXT,
    temperature FLOAT,
    top_p FLOAT DEFAULT 1.0,
    response_format VARCHAR(255) DEFAULT 'auto', -- Can store simple types or reference more complex JSON if needed
    tools_folder VARCHAR(1024),
    files_folder TEXT[],
    schemas_folder TEXT[],
    api_headers JSONB,
    api_params JSONB,
    file_ids TEXT[],
    metadata JSONB,
    model VARCHAR(255),
    reasoning_effort VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
    validation_attempts INTEGER DEFAULT 1,
    max_prompt_tokens INTEGER,
    max_completion_tokens INTEGER,
    truncation_strategy JSONB,
    examples JSONB, -- Store as JSON array of objects
    file_search_config JSONB,
    parallel_tool_calls BOOLEAN DEFAULT TRUE,
    refresh_from_id BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add the foreign key constraint from agencies to agents now that agents table exists
ALTER TABLE agencies ADD CONSTRAINT fk_entry_point_agent FOREIGN KEY (entry_point_agent_id) REFERENCES agents(agent_pk) ON DELETE SET NULL;

-- Tools Table
CREATE TABLE tools (
    tool_pk SERIAL PRIMARY KEY,
    tool_class_name VARCHAR(255) UNIQUE NOT NULL,
    file_path VARCHAR(1024) UNIQUE NOT NULL,
    description TEXT,
    fields_definition JSONB, -- Store Pydantic field schema {name: {type:..., description:...}}
    code_content TEXT NOT NULL,
    test_case TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Agent-Tools Junction Table (Many-to-Many)
CREATE TABLE agent_tools (
    agent_tool_pk SERIAL PRIMARY KEY,
    agent_pk INTEGER NOT NULL REFERENCES agents(agent_pk) ON DELETE CASCADE,
    tool_pk INTEGER NOT NULL REFERENCES tools(tool_pk) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (agent_pk, tool_pk) -- Ensure an agent doesn't have the same tool twice
);

-- Agency Communication Chart Table
CREATE TABLE agency_communication_chart (
    relation_pk SERIAL PRIMARY KEY,
    agency_id INTEGER NOT NULL REFERENCES agencies(agency_pk) ON DELETE CASCADE,
    sender_agent_id INTEGER NOT NULL REFERENCES agents(agent_pk) ON DELETE CASCADE,
    receiver_agent_id INTEGER NOT NULL REFERENCES agents(agent_pk) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (agency_id, sender_agent_id, receiver_agent_id)
);

-- Optional: Indexes for performance
CREATE INDEX idx_agents_agency_id ON agents(agency_id);
CREATE INDEX idx_agent_tools_agent_pk ON agent_tools(agent_pk);
CREATE INDEX idx_agent_tools_tool_pk ON agent_tools(tool_pk);
CREATE INDEX idx_agency_comm_chart_agency_id ON agency_communication_chart(agency_id);
CREATE INDEX idx_agency_comm_chart_sender ON agency_communication_chart(sender_agent_id);
CREATE INDEX idx_agency_comm_chart_receiver ON agency_communication_chart(receiver_agent_id);

-- Trigger function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 