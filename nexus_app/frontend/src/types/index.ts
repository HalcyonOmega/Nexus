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