import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAgencies } from '../contexts/AgencyContext';
import { useAgents } from '../contexts/AgentContext'; // Assuming Agent context exists
import { Agency, Agent } from '../types';
import * as api from '../services/api'; // For association calls

const AgencyDetailPage: React.FC = () => {
  const { agencyId } = useParams<{ agencyId: string }>();
  const { getAgencyById, updateAgency, deleteAgency, loading: agencyLoading, error: agencyError } = useAgencies();
  const { agents, fetchAgents, loading: agentLoading, error: agentError } = useAgents(); // Need agent context

  const [agency, setAgency] = useState<Agency | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [associatedAgents, setAssociatedAgents] = useState<Agent[]>([]); // State to hold agents associated with this agency
  const [associationLoading, setAssociationLoading] = useState<boolean>(false);
  const [associationError, setAssociationError] = useState<Error | null>(null);

  // Fetch agency details
  useEffect(() => {
    if (agencyId) {
      const fetchedAgency = getAgencyById(agencyId);
      if (fetchedAgency) {
        setAgency(fetchedAgency);
        setEditName(fetchedAgency.name);
        setEditDesc(fetchedAgency.description || '');
      } else {
        // Handle case where agency is not found in context (maybe fetch directly?)
        console.warn(`Agency with ID ${agencyId} not found in context.`);
        // Example: api.getAgency(agencyId).then(setAgency).catch(console.error);
      }
    }
  }, [agencyId, getAgencyById]);

  // Fetch all agents (for the selection dropdown)
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Fetch agents specifically associated with this agencyId
  useEffect(() => {
    const fetchAssociatedAgents = async () => {
      if (!agencyId) return;
      setAssociationLoading(true);
      setAssociationError(null);
      try {
        const agentsData = await api.getAgentsForAgency(agencyId);
        setAssociatedAgents(agentsData);
      } catch (err) {
        console.error("Failed to fetch associated agents:", err);
        setAssociationError(err instanceof Error ? err : new Error('Failed to fetch associated agents'));
      } finally {
        setAssociationLoading(false);
      }
    };

    fetchAssociatedAgents();
  }, [agencyId]); // Re-fetch when agencyId changes


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency || !editName.trim()) return;

    try {
      await updateAgency({ ...agency, name: editName, description: editDesc });
      setIsEditing(false);
      // Optionally show success message
    } catch (err) {
      console.error("Failed to update agency:", err);
      // Optionally show error message
    }
  };

  const handleDelete = async () => {
    if (!agencyId || !window.confirm(`Are you sure you want to delete agency "${agency?.name}"?`)) return;

    try {
      await deleteAgency(agencyId);
      // Navigate back to agencies list after deletion
      // navigate('/agencies'); // Requires useNavigate hook from react-router-dom
      console.log("Agency deleted, implement navigation");
    } catch (err) {
      console.error("Failed to delete agency:", err);
      // Optionally show error message
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!agencyId || !agentId) return;
    setAssociationLoading(true);
    setAssociationError(null);
    console.log(`Assigning agent ${agentId} to agency ${agencyId}`);
    try {
      await api.assignAgentToAgency(agencyId, agentId);
      // Refetch associated agents after assigning
      const agentsData = await api.getAgentsForAgency(agencyId);
      setAssociatedAgents(agentsData);
      // Optionally: Add success message/toast
    } catch (err) {
      console.error("Failed to assign agent:", err);
      setAssociationError(err instanceof Error ? err : new Error('Failed to assign agent'));
      // Optionally: Show error message to user
    } finally {
      setAssociationLoading(false);
    }
  };

  const handleRemoveAgent = async (agentId: string) => {
     if (!agencyId || !agentId) return;
     setAssociationLoading(true);
     setAssociationError(null);
     console.log(`Removing agent ${agentId} from agency ${agencyId}`);
    try {
      await api.removeAgentFromAgency(agencyId, agentId);
      // Refetch associated agents after removing
      const agentsData = await api.getAgentsForAgency(agencyId);
      setAssociatedAgents(agentsData);
       // Optionally: Add success message/toast
    } catch (err) {
      console.error("Failed to remove agent:", err);
      setAssociationError(err instanceof Error ? err : new Error('Failed to remove agent'));
      // Optionally: Show error message to user
    } finally {
       setAssociationLoading(false);
    }
  };


  if (agencyLoading || agentLoading) return <div>Loading details...</div>;
  if (agencyError) return <div>Error loading agency: {agencyError.message}</div>;
  if (agentError) return <div>Error loading agents: {agentError.message}</div>;
  if (!agency) return <div>Agency not found.</div>;

  return (
    <div>
      <Link to="/agencies">Back to Agencies</Link>
      <h1>Agency Details: {agency.name}</h1>

      {isEditing ? (
        <form onSubmit={handleUpdate}>
          <div>
            <label htmlFor="editAgencyName">Name:</label>
            <input
              id="editAgencyName"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="editAgencyDesc">Description:</label>
            <textarea
              id="editAgencyDesc"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>
          <button type="submit" disabled={agencyLoading}>Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div>
          <p><strong>ID:</strong> {agency.id}</p>
          <p><strong>Name:</strong> {agency.name}</p>
          <p><strong>Description:</strong> {agency.description || 'N/A'}</p>
          <button onClick={() => setIsEditing(true)}>Edit Agency</button>
          <button onClick={handleDelete} disabled={agencyLoading}>Delete Agency</button>
        </div>
      )}

      <hr />

      <h2>Associated Agents</h2>
      {/* Agent Assignment Section */}
      <div>
        <h3>Assign Agent</h3>
        <select onChange={(e) => handleAssignAgent(e.target.value)} defaultValue="">
            <option value="" disabled>Select an agent to assign</option>
            {agents
              // Filter out agents already associated
              .filter(agent => !associatedAgents.some(a => a.id === agent.id))
              .map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
        </select>
      </div>

      {/* List of Associated Agents */}
      {associationLoading && <p>Loading associations...</p>}
      {associationError && <p style={{ color: 'red' }}>Error managing associations: {associationError.message}</p>}

      {/* List of Associated Agents */}
      {!associationLoading && associatedAgents.length === 0 ? (
        <p>No agents currently associated with this agency.</p>
      ) : (
        <ul>
          {associatedAgents.map((agent) => (
            <li key={agent.id}>
              <Link to={`/agents/${agent.id}`}>{agent.name}</Link>
              <button
                onClick={() => handleRemoveAgent(agent.id)}
                style={{ marginLeft: '10px' }}
                disabled={associationLoading} // Disable button while loading
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
};

export default AgencyDetailPage;