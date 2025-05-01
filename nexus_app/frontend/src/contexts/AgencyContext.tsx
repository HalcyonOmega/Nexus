import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Agency } from '../types';
import * as api from '../services/api'; // Assuming API functions are here

interface AgencyContextType {
  agencies: Agency[];
  loading: boolean;
  error: Error | null;
  fetchAgencies: () => Promise<void>;
  getAgencyById: (id: string) => Agency | undefined;
  addAgency: (agencyData: Omit<Agency, 'id'>) => Promise<void>;
  updateAgency: (agency: Agency) => Promise<void>;
  deleteAgency: (id: string) => Promise<void>;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export const AgencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAgencies();
      setAgencies(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agencies'));
    } finally {
      setLoading(false);
    }
  };

  const getAgencyById = (id: string): Agency | undefined => {
    return agencies.find(agency => agency.id === id);
  };

  const addAgency = async (agencyData: Omit<Agency, 'id'>) => {
    setLoading(true);
    try {
      const newAgency = await api.createAgency(agencyData);
      setAgencies(prev => [...prev, newAgency]);
    } catch (err) {
       setError(err instanceof Error ? err : new Error('Failed to add agency'));
       throw err; // Re-throw error for form handling
    } finally {
       setLoading(false);
    }
  };

  const updateAgency = async (agency: Agency) => {
     setLoading(true);
     try {
       const updatedAgency = await api.updateAgency(agency);
       setAgencies(prev => prev.map(a => a.id === updatedAgency.id ? updatedAgency : a));
     } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update agency'));
        throw err; // Re-throw error for form handling
     } finally {
        setLoading(false);
     }
  };

   const deleteAgency = async (id: string) => {
     setLoading(true);
     try {
       await api.deleteAgency(id);
       setAgencies(prev => prev.filter(a => a.id !== id));
     } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete agency'));
        throw err; // Re-throw error for handling
     } finally {
        setLoading(false);
     }
   };


  return (
    <AgencyContext.Provider value={{ agencies, loading, error, fetchAgencies, getAgencyById, addAgency, updateAgency, deleteAgency }}>
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgencies = (): AgencyContextType => {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error('useAgencies must be used within an AgencyProvider');
  }
  return context;
};