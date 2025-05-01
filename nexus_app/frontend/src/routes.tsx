import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Page Components
import AgenciesPage from './pages/AgenciesPage';
import AgencyDetailPage from './pages/AgencyDetailPage';
import AgentDetailPage from './pages/AgentDetailPage';
import WorkflowPage from './pages/WorkflowPage';
// Import other pages if they exist (e.g., separate pages for Agent/Tool pools if needed)
// import AgentsPoolPage from './pages/AgentsPoolPage';
// import ToolsPoolPage from './pages/ToolsPoolPage';
// import ToolDetailPage from './pages/ToolDetailPage';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Agency Routes */}
      <Route path="/agencies" element={<AgenciesPage />} />
      <Route path="/agencies/:agencyId" element={<AgencyDetailPage />} />

      {/* Agent Routes - Direct access might depend on final design */}
      {/* <Route path="/agents" element={<AgentsPoolPage />} /> */}
      {/* Agent Detail is nested under Agency in the user request */}
      <Route path="/agencies/:agencyId/agents/:agentId" element={<AgentDetailPage />} />

      {/* Tool Routes - Direct access might depend on final design */}
      {/* <Route path="/tools" element={<ToolsPoolPage />} /> */}
      {/* Tool Detail is handled by modal in Agent Detail Page per user request */}
      {/* <Route path="/tools/:toolId" element={<ToolDetailPage />} /> */}


      {/* Workflow Route */}
      <Route path="/workflow/:agencyId" element={<WorkflowPage />} />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/agencies" replace />} />

      {/* Fallback for unmatched routes (optional) */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;