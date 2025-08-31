import { Injectable } from '@nestjs/common';
import { Workflow, Node, Edge } from '@n8n-work/contracts';

@Injectable()
export class DagService {
  /**
   * Parses a workflow and returns the execution order of nodes
   */
  parseWorkflow(workflow: Workflow): string[] {
    const { nodes, edges } = workflow;
    
    // Create adjacency list and in-degree count
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Initialize
    nodes.forEach(node => {
      adj.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    // Build adjacency list and count in-degrees
    edges.forEach(edge => {
      const sourceList = adj.get(edge.source);
      if (sourceList) {
        sourceList.push(edge.target);
      }
      
      const targetInDegree = inDegree.get(edge.target);
      if (targetInDegree !== undefined) {
        inDegree.set(edge.target, targetInDegree + 1);
      }
    });
    
    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];
    
    // Add nodes with in-degree 0 to queue
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });
    
    while (queue.length > 0) {
      const u = queue.shift()!;
      result.push(u);
      
      const neighbors = adj.get(u);
      if (neighbors) {
        for (const v of neighbors) {
          const currentInDegree = inDegree.get(v);
          if (currentInDegree !== undefined) {
            inDegree.set(v, currentInDegree - 1);
            if (currentInDegree - 1 === 0) {
              queue.push(v);
            }
          }
        }
      }
    }
    
    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains cycles');
    }
    
    return result;
  }
  
  /**
   * Gets the next nodes that can be executed given the current execution state
   */
  getNextExecutableNodes(workflow: Workflow, completedNodes: Set<string>): string[] {
    const executionOrder = this.parseWorkflow(workflow);
    const nextNodes: string[] = [];
    
    for (const nodeId of executionOrder) {
      if (completedNodes.has(nodeId)) {
        continue;
      }
      
      // Check if all dependencies are completed
      const dependencies = workflow.edges
        .filter(edge => edge.target === nodeId)
        .map(edge => edge.source);
      
      const allDependenciesCompleted = dependencies.every(dep => completedNodes.has(dep));
      
      if (allDependenciesCompleted) {
        nextNodes.push(nodeId);
      }
    }
    
    return nextNodes;
  }
  
  /**
   * Validates that the workflow is a valid DAG
   */
  validateWorkflow(workflow: Workflow): boolean {
    try {
      this.parseWorkflow(workflow);
      return true;
    } catch (error) {
      return false;
    }
  }
}
