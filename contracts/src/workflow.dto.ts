export interface Node {
  id: string;
  type: string;
  data: any;
}

export interface Edge {
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  nodes: Node[];
  edges: Edge[];
}
