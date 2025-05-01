import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAgencies } from '../contexts/AgencyContext';
import { Agency } from '../types';

const AgenciesPage: React.FC = () => {
  const { agencies, loading, error, fetchAgencies, addAgency } = useAgencies();
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyDesc, setNewAgencyDesc] = useState('');

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyName.trim()) return; // Basic validation

    try {
      await addAgency({ name: newAgencyName, description: newAgencyDesc });
      setNewAgencyName('');
      setNewAgencyDesc('');
      // Optionally: show success message
    } catch (err) {
      console.error("Failed to create agency:", err);
      // Optionally: show error message to user
    }
  };

  if (loading) return <div>Loading agencies...</div>;
  if (error) return <div>Error loading agencies: {error.message}</div>;

  return (
    <div>
      <h1>Agencies</h1>

      {/* Create Agency Form */}
      <form onSubmit={handleCreateAgency}>
        <h2>Create New Agency</h2>
        <div>
          <label htmlFor="agencyName">Name:</label>
          <input
            id="agencyName"
            type="text"
            value={newAgencyName}
            onChange={(e) => setNewAgencyName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="agencyDesc">Description (Optional):</label>
          <textarea
            id="agencyDesc"
            value={newAgencyDesc}
            onChange={(e) => setNewAgencyDesc(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>Create Agency</button>
      </form>

      {/* Agency List */}
      <h2>Existing Agencies</h2>
      {agencies.length === 0 ? (
        <p>No agencies found.</p>
      ) : (
        <ul>
          {agencies.map((agency: Agency) => (
            <li key={agency.id}>
              <Link to={`/agencies/${agency.id}`}>
                {agency.name} {agency.description && `- ${agency.description}`}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AgenciesPage;