import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AgencyProvider } from './contexts/AgencyContext';
import { AgentProvider } from './contexts/AgentContext';
import { ToolProvider } from './contexts/ToolContext';
import AppRoutes from './routes'; // Your routes component
import './App.css'; // Keep existing App CSS or update as needed

function App() {
  return (
    <BrowserRouter>
      <AgencyProvider>
        <AgentProvider>
          <ToolProvider>
            {/* Basic Layout Example (Optional) */}
            <div className="app-container">
              <header className="app-header">
                <h1>Nexus Agency Management</h1>
                {/* Add Navigation Links if needed */}
              </header>
              <main className="app-main">
                <AppRoutes />
              </main>
              <footer className="app-footer">
                {/* Footer content */}
              </footer>
            </div>
          </ToolProvider>
        </AgentProvider>
      </AgencyProvider>
    </BrowserRouter>
  );
}

export default App;
