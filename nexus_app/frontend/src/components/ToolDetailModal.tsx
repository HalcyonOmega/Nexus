import React, { useState, useEffect } from 'react';
import { Tool } from '../types';
import { useTools } from '../contexts/ToolContext';

interface ToolDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool | null; // null for create mode, Tool object for edit mode
  onSuccess?: () => void | Promise<void>; // Optional callback for successful save/delete
  // We can pass agentId if creation/update needs to be associated immediately,
  // but the current context handles tools independently.
  // agentId?: string;
}

const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  isOpen,
  onClose,
  tool,
  onSuccess, // Destructure the new prop
}) => {
  const { addTool, updateTool, deleteTool, loading, error } = useTools();
  const [toolName, setToolName] = useState('');
  const [toolType, setToolType] = useState(''); // Assuming type is also editable/settable

  useEffect(() => {
    if (tool) {
      setToolName(tool.name);
      setToolType(tool.type || '');
    } else {
      // Reset form for create mode
      setToolName('');
      setToolType('');
    }
  }, [tool, isOpen]); // Reset form when modal opens or tool changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim()) return; // Basic validation

    const toolData = { name: toolName, type: toolType };

    try {
      if (tool) {
        // Update existing tool
        await updateTool({ ...tool, ...toolData });
      } else {
        // Create new tool
        await addTool(toolData);
      }
      onSuccess?.(); // Call onSuccess if provided
      onClose(); // Close modal on success
    } catch (err) {
      console.error("Failed to save tool:", err);
      // Keep modal open and show error message (error state is in context)
    }
  };

  const handleDelete = async () => {
    if (!tool || !window.confirm(`Are you sure you want to delete tool "${tool.name}"?`)) return;

    try {
      await deleteTool(tool.id);
      onSuccess?.(); // Call onSuccess if provided
      onClose(); // Close modal on success
    } catch (err) {
      console.error("Failed to delete tool:", err);
      // Keep modal open and show error message
    }
  };

  if (!isOpen) {
    return null;
  }

  // Basic modal styling (replace with a proper modal library like Material UI, Chakra UI, or Headless UI later)
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    zIndex: 1000,
    border: '1px solid #ccc',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    minWidth: '300px',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  };


  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        <h2>{tool ? 'Edit Tool' : 'Create New Tool'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="toolName">Tool Name:</label>
            <input
              id="toolName"
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="toolType">Tool Type (Optional):</label>
            <input
              id="toolType"
              type="text"
              value={toolType}
              onChange={(e) => setToolType(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
          <div style={{ marginTop: '15px' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (tool ? 'Save Changes' : 'Create Tool')}
            </button>
            {tool && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}
              >
                {loading ? 'Deleting...' : 'Delete Tool'}
              </button>
            )}
            <button type="button" onClick={onClose} disabled={loading} style={{ marginLeft: '10px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ToolDetailModal;