import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactFlow, {
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Import ReactFlow styles

import * as api from '../services/api'; // Import API service
import { Workflow } from '../types'; // Import types

const WorkflowPage: React.FC = () => {
  const { agencyId } = useParams<{ agencyId: string }>();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [agencyName, setAgencyName] = useState<string>(''); // Optional: Fetch agency name too

  useEffect(() => {
    if (!agencyId) {
      setError(new Error("Agency ID is missing from the URL."));
      setLoading(false);
      return;
    }

    const fetchWorkflowData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch workflow data (nodes and edges)
        const workflowData: Workflow = await api.getWorkflow(agencyId);
        setNodes(workflowData.nodes);
        setEdges(workflowData.edges);

        // Optional: Fetch agency details to display the name
        // This assumes nodes[0] is the agency node or you have another way to get it
        if (workflowData.nodes.length > 0 && workflowData.nodes[0].data?.label) {
             setAgencyName(workflowData.nodes[0].data.label);
        } else {
            // Fallback or fetch separately if needed
            // const agencyDetails = await api.getAgency(agencyId);
            // setAgencyName(agencyDetails.name);
            setAgencyName(`Agency ${agencyId}`); // Placeholder
        }

      } catch (err) {
        console.error("Failed to fetch workflow:", err);
        setError(err instanceof Error ? err : new Error('Failed to load workflow data.'));
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowData();
  }, [agencyId]); // Refetch if agencyId changes

  // ReactFlow handlers (basic implementation)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  // Optional: Handle connection logic if needed
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );


  if (loading) return <div>Loading workflow...</div>;
  if (error) return <div>Error loading workflow: {error.message}</div>;
  if (!agencyId) return <div>Invalid Agency ID.</div>; // Should be caught by useEffect, but good practice

  return (
    <div style={{ height: 'calc(100vh - 50px)', width: '100%' }}> {/* Adjust height as needed */}
       <Link to={`/agencies/${agencyId}`}>Back to Agency Details</Link>
       <h1>Workflow for: {agencyName}</h1>
       <p><i>(Note: This is a visual representation. Node/edge data comes from the backend `/workflow/:agencyId` endpoint.)</i></p>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect} // Optional: if you want users to connect nodes
        fitView // Automatically fit the view to the nodes
        attributionPosition="top-right" // Optional: position of ReactFlow attribution
      >
        <Background />
        <Controls />
        <MiniMap /> {/* Optional: Add a minimap */}
      </ReactFlow>
    </div>
  );
};

export default WorkflowPage;