import { Injectable } from '@nestjs/common';
import { Workflow, Node, Edge } from '@n8n-work/contracts';

@Injectable()
export class DagService {
  constructor() {}

  parse(workflow: Workflow): Node[] {
    console.log('Parsing workflow:', workflow);
    const sortedNodes = this.topologicalSort(workflow.nodes, workflow.edges);
    return sortedNodes;
  }

  private topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    const queue: string[] = [];
    const result: Node[] = [];

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adj.set(node.id, []);
    }

    for (const edge of edges) {
      adj.get(edge.source).push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target) + 1);
    }

    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const u = queue.shift();
      const node = nodes.find((n) => n.id === u);
      if (node) {
        result.push(node);
      }

      for (const v of adj.get(u)) {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    if (result.length !== nodes.length) {
      throw new Error('Cycle detected in the workflow graph.');
    }

    return result;
  }
}
