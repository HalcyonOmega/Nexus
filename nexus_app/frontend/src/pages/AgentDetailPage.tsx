import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Assuming useNavigate might be needed later
import { useAgents } from '../contexts/AgentContext';
import { useTools } from '../contexts/ToolContext'; // Need Tool context
import { Agent, Tool } from '../types';
import * as api from '../services/api'; // For association calls

// Placeholder for a potential Tool Detail Modal component
import ToolDetailModal from '../components/ToolDetailModal'; // Import the actual modal

const AgentDetailPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { getAgentById, updateAgent, deleteAgent, assignToolToAgent, removeToolFromAgent, loading: agentLoading, error: agentError } = useAgents();
  const { tools, fetchTools, loading: toolLoading, error: toolError } = useTools();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [associatedTools, setAssociatedTools] = useState<Tool[]>([]); // State for associated tools
  const [associationLoading, setAssociationLoading] = useState<boolean>(false);
  const [associationError, setAssociationError] = useState<Error | null>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false); // State for Tool modal
  const [selectedToolForModal, setSelectedToolForModal] = useState<Tool | null>(null); // State for Tool modal


  // Fetch agent details
  useEffect(() => {
    if (agentId) {
      const fetchedAgent = getAgentById(agentId);
      if (fetchedAgent) {
        setAgent(fetchedAgent);
        setEditName(fetchedAgent.name);
        setEditRole(fetchedAgent.role || '');
      } else {
        console.warn(`Agent with ID ${agentId} not found in context.`);
        // Example: api.getAgent(agentId).then(setAgent).catch(console.error);
      }
    }
  }, [agentId, getAgentById]);

  // Fetch all tools (for selection dropdown)
  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Fetch tools specifically associated with this agentId
  useEffect(() => {
    const fetchAssociatedTools = async () => {
      if (!agentId) return;
      setAssociationLoading(true);
      setAssociationError(null);
      try {
        const toolsData = await api.getToolsForAgent(agentId);
        setAssociatedTools(toolsData);
      } catch (err) {
        console.error("Failed to fetch associated tools:", err);
        setAssociationError(err instanceof Error ? err : new Error('Failed to fetch associated tools'));
      } finally {
        setAssociationLoading(false);
      }
    };

    fetchAssociatedTools();
  }, [agentId]); // Re-fetch when agentId changes

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !editName.trim()) return;

    try {
      await updateAgent({ ...agent, name: editName, role: editRole });
      setIsEditing(false);
      // Optionally show success
    } catch (err) {
      console.error("Failed to update agent:", err);
      // Optionally show error
    }
  };

  const handleDelete = async () => {
    if (!agentId || !window.confirm(`Are you sure you want to delete agent "${agent?.name}"?`)) return;

    try {
      await deleteAgent(agentId);
      // navigate('/agents'); // Requires useNavigate hook
      console.log("Agent deleted, implement navigation");
    } catch (err) {
      console.error("Failed to delete agent:", err);
      // Optionally show error
    }
  };

  // --- Tool Association ---
  const handleAssignTool = async (toolId: string) => {
    if (!agentId || !toolId) return;
    setAssociationLoading(true);
    setAssociationError(null);
    console.log(`Assigning tool ${toolId} to agent ${agentId}`);
    try {
      // Use the API service function directly
      await api.assignToolToAgent(agentId, toolId);
      // Refetch associated tools after assigning
      const toolsData = await api.getToolsForAgent(agentId);
      setAssociatedTools(toolsData);
      // Optionally: Add success message/toast
    } catch (err) {
      console.error("Failed to assign tool:", err);
      setAssociationError(err instanceof Error ? err : new Error('Failed to assign tool'));
      // Optionally: Show error message to user
    } finally {
      setAssociationLoading(false);
    }
  };

  const handleRemoveTool = async (toolId: string) => {
    if (!agentId || !toolId) return;
    setAssociationLoading(true);
    setAssociationError(null);
    console.log(`Removing tool ${toolId} from agent ${agentId}`);
    try {
      // Use the API service function directly
      await api.removeToolFromAgent(agentId, toolId);
      // Refetch associated tools after removing
      const toolsData = await api.getToolsForAgent(agentId);
      setAssociatedTools(toolsData);
      // Optionally: Add success message/toast
    } catch (err) {
      console.error("Failed to remove tool:", err);
      setAssociationError(err instanceof Error ? err : new Error('Failed to remove tool'));
      // Optionally: Show error message to user
    } finally {
      setAssociationLoading(false);
    }
  };

  // --- Tool Modal ---
  const openCreateToolModal = () => {
    setSelectedToolForModal(null); // Ensure it's for creation
    setIsToolModalOpen(true);
    console.log("Opening Tool Create/Edit Modal (placeholder)");
  };

  const openEditToolModal = (tool: Tool) => {
    setSelectedToolForModal(tool);
    setIsToolModalOpen(true);
    console.log(`Opening Tool Create/Edit Modal for tool: ${tool.name} (placeholder)`);
  };

  const closeToolModal = () => {
    setIsToolModalOpen(false);
    setSelectedToolForModal(null);
  };

  // Callback to refetch associated tools after modal success
  const refetchAssociatedTools = async () => {
    if (!agentId) return;
    setAssociationLoading(true);
    setAssociationError(null);
    try {
      const toolsData = await api.getToolsForAgent(agentId);
      setAssociatedTools(toolsData);
    } catch (err) {
      console.error("Failed to refetch associated tools:", err);
      setAssociationError(err instanceof Error ? err : new Error('Failed to refetch associated tools'));
    } finally {
      setAssociationLoading(false);
    }
  };


  if (agentLoading || toolLoading) return <div>Loading details...</div>;
  if (agentError) return <div>Error loading agent: {agentError.message}</div>;
  if (toolError) return <div>Error loading tools: {toolError.message}</div>;
  if (!agent) return <div>Agent not found.</div>;

  return (
    <div>
      {/* Consider adding breadcrumbs or link back to agency if applicable */}
      <Link to="/agencies">Back to Agencies</Link> {/* Adjust if needed */}
      <h1>Agent Details: {agent.name}</h1>

      {isEditing ? (
        <form onSubmit={handleUpdate}>
          <div>
            <label htmlFor="editAgentName">Name:</label>
            <input id="editAgentName" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="editAgentRole">Role:</label>
            <input id="editAgentRole" type="text" value={editRole} onChange={(e) => setEditRole(e.target.value)} />
          </div>
          <button type="submit" disabled={agentLoading}>Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div>
          <p><strong>ID:</strong> {agent.id}</p>
          <p><strong>Name:</strong> {agent.name}</p>
          <p><strong>Role:</strong> {agent.role || 'N/A'}</p>
          <button onClick={() => setIsEditing(true)}>Edit Agent</button>
          <button onClick={handleDelete} disabled={agentLoading}>Delete Agent</button>
        </div>
      )}

      <hr />

      <h2>Associated Tools</h2>
      <button onClick={openCreateToolModal}>Create New Tool</button>

      {/* Tool Assignment Section */}
      <div>
        <h3>Assign Existing Tool</h3>
        <select onChange={(e) => handleAssignTool(e.target.value)} defaultValue="">
            <option value="" disabled>Select a tool to assign</option>
            {tools
              // Filter out tools already associated
              .filter(tool => !associatedTools.some(t => t.id === tool.id))
              .map(tool => (
                <option key={tool.id} value={tool.id}>{tool.name}</option>
            ))}
        </select>
      </div>

      {associationLoading && <p>Loading associations...</p>}
      {associationError && <p style={{ color: 'red' }}>Error managing associations: {associationError.message}</p>}

      {/* List of Associated Tools */}
      {!associationLoading && associatedTools.length === 0 ? (
        <p>No tools currently associated with this agent.</p>
      ) : (
        <ul>
          {associatedTools.map((tool) => (
            <li key={tool.id}>
              {tool.name} {/* Maybe link to tool detail page if exists? <Link to={`/tools/${tool.id}`}>{tool.name}</Link> */}
              <button onClick={() => openEditToolModal(tool)} style={{ marginLeft: '10px' }}>
                Edit
              </button>
              <button
                onClick={() => handleRemoveTool(tool.id)}
                style={{ marginLeft: '10px' }}
                disabled={associationLoading} // Disable button while loading
              >
                Remove Association
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Actual Tool Detail Modal */}
      <ToolDetailModal
        isOpen={isToolModalOpen}
        onClose={closeToolModal}
        tool={selectedToolForModal}
        onSuccess={refetchAssociatedTools} // Pass the refetch callback
      />

    </div>
  );
};

export default AgentDetailPage;