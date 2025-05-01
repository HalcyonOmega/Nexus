import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export interface Agency {
  id: string;
  name: string;
  description?: string;
}

export interface Agent {
  id: string;
  name: string;
  role?: string;
}

export interface Tool {
  id: string;
  name: string;
  type?: string;
}

export const getAgencies = async (): Promise<Agency[]> => {
  const response = await api.get<Agency[]>('/agencies');
  return response.data;
};

export const getAgency = async (id: string): Promise<Agency> => {
  const response = await api.get<Agency>(`/agencies/${id}`);
  return response.data;
};

export const createAgency = async (
  data: Omit<Agency, 'id'>
): Promise<Agency> => {
  const response = await api.post<Agency>('/agencies', data);
  return response.data;
};

export const updateAgency = async (agency: Agency): Promise<Agency> => {
  const response = await api.put<Agency>(`/agencies/${agency.id}`, agency);
  return response.data;
};

export const deleteAgency = async (id: string): Promise<void> => {
  await api.delete(`/agencies/${id}`);
};

export const getAgents = async (): Promise<Agent[]> => {
  const response = await api.get<Agent[]>('/agents');
  return response.data;
};

export const getAgent = async (id: string): Promise<Agent> => {
  const response = await api.get<Agent>(`/agents/${id}`);
  return response.data;
};

export const createAgent = async (
  data: Omit<Agent, 'id'>
): Promise<Agent> => {
  const response = await api.post<Agent>('/agents', data);
  return response.data;
};

export const updateAgent = async (agent: Agent): Promise<Agent> => {
  const response = await api.put<Agent>(`/agents/${agent.id}`, agent);
  return response.data;
};

export const deleteAgent = async (id: string): Promise<void> => {
  await api.delete(`/agents/${id}`);
};

export const getTools = async (): Promise<Tool[]> => {
  const response = await api.get<Tool[]>('/tools');
  return response.data;
};

export const getTool = async (id: string): Promise<Tool> => {
  const response = await api.get<Tool>(`/tools/${id}`);
  return response.data;
};

export const createTool = async (
  data: Omit<Tool, 'id'>
): Promise<Tool> => {
  const response = await api.post<Tool>('/tools', data);
  return response.data;
};

export const updateTool = async (tool: Tool): Promise<Tool> => {
  const response = await api.put<Tool>(`/tools/${tool.id}`, tool);
  return response.data;
};

export const deleteTool = async (id: string): Promise<void> => {
  await api.delete(`/tools/${id}`);
};

// Workflow API: returns nodes and edges for ReactFlow
export interface Node {
  id: string;
  data: any;
  position: { x: number; y: number };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  nodes: Node[];
  edges: Edge[];
}

export const getWorkflow = async (
  agencyId: string
): Promise<Workflow> => {
  const response = await api.get<Workflow>(`/workflow/${agencyId}`);
  return response.data;
};
// Association API: Agency ↔ Agent
export const assignAgentToAgency = async (
  agencyId: string,
  agentId: string
): Promise<void> => {
  await api.post(`/agencies/${agencyId}/agents/${agentId}`);
};

export const removeAgentFromAgency = async (
  agencyId: string,
  agentId: string
): Promise<void> => {
  await api.delete(`/agencies/${agencyId}/agents/${agentId}`);
};

// Association API: Agent ↔ Tool
export const assignToolToAgent = async (
  agentId: string,
  toolId: string
): Promise<void> => {
  await api.post(`/agents/${agentId}/tools/${toolId}`);
};

export const removeToolFromAgent = async (
  agentId: string,
  toolId: string
): Promise<void> => {
  await api.delete(`/agents/${agentId}/tools/${toolId}`);
};

// Fetch agents associated with a specific agency
export const getAgentsForAgency = async (agencyId: string): Promise<Agent[]> => {
  const response = await api.get<Agent[]>(`/agencies/${agencyId}/agents`);
  return response.data;
};

// Fetch tools associated with a specific agent
export const getToolsForAgent = async (agentId: string): Promise<Tool[]> => {
  const response = await api.get<Tool[]>(`/agents/${agentId}/tools`);
  return response.data;
};