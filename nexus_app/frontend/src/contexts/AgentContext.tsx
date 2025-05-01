import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react'; // Import useCallback
import { Agent } from '../types';
import * as api from '../services/api'; // Assuming API functions are here

interface AgentContextType {
  agents: Agent[];
  loading: boolean;
  error: Error | null;
  fetchAgents: () => Promise<void>;
  getAgentById: (id: string) => Agent | undefined;
  addAgent: (agentData: Omit<Agent, 'id'>) => Promise<void>;
  updateAgent: (agent: Agent) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  assignToolToAgent: (agentId: string, toolId: string) => Promise<void>;
  removeToolFromAgent: (agentId: string, toolId: string) => Promise<void>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array: function reference is stable

  const getAgentById = useCallback((id: string): Agent | undefined => {
    return agents.find(agent => agent.id === id);
  }, [agents]); // Depends on the agents list

  const addAgent = useCallback(async (agentData: Omit<Agent, 'id'>) => {
    setLoading(true);
    try {
      const newAgent = await api.createAgent(agentData);
      setAgents(prev => [...prev, newAgent]);
    } catch (err) {
       setError(err instanceof Error ? err : new Error('Failed to add agent'));
       throw err; // Re-throw error for form handling
    } finally {
       setLoading(false);
    }
  }, []); // No external dependencies needed for the function logic itself

  const updateAgent = useCallback(async (agent: Agent) => {
     setLoading(true);
     try {
       const updatedAgent = await api.updateAgent(agent);
       setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
     } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update agent'));
        throw err; // Re-throw error for form handling
     } finally {
        setLoading(false);
     }
  }, []); // No external dependencies needed for the function logic itself

   const deleteAgent = useCallback(async (id: string) => {
     setLoading(true);
     try {
       await api.deleteAgent(id);
       setAgents(prev => prev.filter(a => a.id !== id));
     } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete agent'));
        throw err; // Re-throw error for handling
     } finally {
        setLoading(false);
     }
   }, []); // No external dependencies needed for the function logic itself

   const assignToolToAgent = useCallback(async (agentId: string, toolId: string) => {
     setLoading(true);
     try {
       await api.assignToolToAgent(agentId, toolId);
       // Optionally refetch agent details or update local state if needed
     } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to assign tool to agent'));
        throw err;
     } finally {
        setLoading(false);
     }
   }, []); // No external dependencies needed for the function logic itself

   const removeToolFromAgent = useCallback(async (agentId: string, toolId: string) => {
      setLoading(true);
      try {
        await api.removeToolFromAgent(agentId, toolId);
        // Optionally refetch agent details or update local state if needed
      } catch (err) {
         setError(err instanceof Error ? err : new Error('Failed to remove tool from agent'));
         throw err;
      } finally {
         setLoading(false);
      }
   }, []); // No external dependencies needed for the function logic itself


  return (
    <AgentContext.Provider value={{
        agents,
        loading,
        error,
        fetchAgents,
        getAgentById,
        addAgent,
        updateAgent,
        deleteAgent,
        assignToolToAgent,
        removeToolFromAgent
      }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgents = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
};