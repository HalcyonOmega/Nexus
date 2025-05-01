import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react'; // Import useCallback
import { Tool } from '../types';
import * as api from '../services/api'; // Assuming API functions are here

interface ToolContextType {
  tools: Tool[];
  loading: boolean;
  error: Error | null;
  fetchTools: () => Promise<void>;
  getToolById: (id: string) => Tool | undefined;
  addTool: (toolData: Omit<Tool, 'id'>) => Promise<void>;
  updateTool: (tool: Tool) => Promise<void>;
  deleteTool: (id: string) => Promise<void>;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export const ToolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTools();
      setTools(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tools'));
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array: function reference is stable

  const getToolById = useCallback((id: string): Tool | undefined => {
    return tools.find(tool => tool.id === id);
  }, [tools]); // Depends on the tools list

  const addTool = useCallback(async (toolData: Omit<Tool, 'id'>) => {
    setLoading(true);
    try {
      const newTool = await api.createTool(toolData);
      setTools(prev => [...prev, newTool]);
    } catch (err) {
       setError(err instanceof Error ? err : new Error('Failed to add tool'));
       throw err; // Re-throw error for form handling
    } finally {
       setLoading(false);
    }
  }, []); // No external dependencies needed for the function logic itself

  const updateTool = useCallback(async (tool: Tool) => {
     setLoading(true);
     try {
       const updatedTool = await api.updateTool(tool);
       setTools(prev => prev.map(t => t.id === updatedTool.id ? updatedTool : t));
     } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update tool'));
        throw err; // Re-throw error for form handling
     } finally {
        setLoading(false);
     }
  }, []); // No external dependencies needed for the function logic itself

   const deleteTool = useCallback(async (id: string) => {
     setLoading(true);
     try {
       await api.deleteTool(id);
       setTools(prev => prev.filter(t => t.id !== id));
     } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete tool'));
        throw err; // Re-throw error for handling
     } finally {
        setLoading(false);
     }
   }, []); // No external dependencies needed for the function logic itself


  return (
    <ToolContext.Provider value={{ tools, loading, error, fetchTools, getToolById, addTool, updateTool, deleteTool }}>
      {children}
    </ToolContext.Provider>
  );
};

export const useTools = (): ToolContextType => {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useTools must be used within a ToolProvider');
  }
  return context;
};