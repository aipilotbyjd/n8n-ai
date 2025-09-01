import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { DagService } from '../dag/dag.service';
import { NodeDispatcherService } from '../dispatcher/node-dispatcher.service';
import { ExecutionStateService } from '../state/execution-state.service';
import { Workflow, ExecutionRequest, ExecutionState, NodeExecutionResult } from '@n8n-work/contracts';
import { Semaphore } from '../utils/semaphore.util';

@Controller()
export class ExecutionConsumer {
  private readonly logger = new Logger(ExecutionConsumer.name);
  private readonly maxConcurrency: number;
  private readonly nodeTimeout: number;
  private readonly maxRetries: number;
  private readonly semaphore: Semaphore;

  constructor(
    private readonly configService: ConfigService,
    private readonly dagService: DagService,
    private readonly nodeDispatcherService: NodeDispatcherService,
    private readonly executionStateService: ExecutionStateService,
  ) {
    this.maxConcurrency = parseInt(this.configService.get('EXECUTION_MAX_CONCURRENCY', '10'), 10);
    this.nodeTimeout = parseInt(this.configService.get('NODE_EXECUTION_TIMEOUT', '300000'), 10); // 5 minutes
    this.maxRetries = parseInt(this.configService.get('NODE_MAX_RETRIES', '3'), 10);
    this.semaphore = new Semaphore(this.maxConcurrency);
  }

  @MessagePattern('execute-workflow')
  public async handleMessage(@Payload() data: ExecutionRequest) {
    const startTime = Date.now();
    this.logger.log(`🚀 Starting workflow execution: ${data.workflowId}`);

    // Initialize execution state with enhanced metrics
    const executionState: ExecutionState = {
      executionId: data.workflowId,
      workflowId: data.workflowId,
      status: 'running',
      progress: {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        runningSteps: 0,
      },
      startedAt: new Date(),
      metadata: {
        ...data.metadata,
        executionMode: 'parallel',
        maxConcurrency: this.maxConcurrency,
        nodeTimeout: this.nodeTimeout,
        maxRetries: this.maxRetries,
      },
      tenantId: data.tenantId,
    };

    await this.executionStateService.setExecutionState(executionState.executionId, executionState);

    try {
      const workflow = data.workflow as Workflow;

      // Build execution graph with dependencies
      const executionGraph = this.buildExecutionGraph(workflow);
      this.logger.log(`📊 Execution graph built with ${executionGraph.size} nodes`);

      // Update total steps
      executionState.progress.totalSteps = executionGraph.size;
      await this.executionStateService.updateExecutionState(executionState.executionId, {
        progress: executionState.progress,
      });

      // Execute workflow with parallel processing
      const results = await this.executeParallelWorkflow(
        executionState,
        executionGraph,
        workflow,
        data.input || {}
      );

      // Calculate execution metrics
      const metrics = this.calculateExecutionMetrics(results, startTime);
      this.logger.log(`📈 Execution metrics:`, metrics);

      // Mark execution as completed
      executionState.status = 'completed';
      executionState.finishedAt = new Date();
      executionState.metadata = {
        ...executionState.metadata,
        metrics,
        completedAt: executionState.finishedAt,
      };

      await this.executionStateService.updateExecutionState(executionState.executionId, {
        status: executionState.status,
        finishedAt: executionState.finishedAt,
        metadata: executionState.metadata,
      });

      this.logger.log(`✅ Workflow execution completed successfully in ${Date.now() - startTime}ms`);

    } catch (error) {
      this.logger.error(`❌ Workflow execution failed:`, error);

      executionState.status = 'failed';
      executionState.error = error.message;
      executionState.finishedAt = new Date();
      executionState.metadata = {
        ...executionState.metadata,
        failedAt: executionState.finishedAt,
        failureReason: error.message,
      };

      await this.executionStateService.updateExecutionState(executionState.executionId, {
        status: executionState.status,
        error: executionState.error,
        finishedAt: executionState.finishedAt,
        metadata: executionState.metadata,
      });
    }
  }

  private buildExecutionGraph(workflow: Workflow): Map<string, NodeExecutionResult> {
    const graph = new Map<string, NodeExecutionResult>();

    // Build adjacency list for dependencies
    const adjacencyList = new Map<string, string[]>();
    const reverseAdjacencyList = new Map<string, string[]>();

    // Initialize graph nodes
    workflow.nodes.forEach(node => {
      graph.set(node.id, {
        nodeId: node.id,
        status: 'pending',
        startedAt: new Date(),
        retryCount: 0,
        dependencies: [],
        dependents: [],
      });
    });

    // Build edges from workflow connections
    workflow.edges.forEach(edge => {
      const sourceId = edge.source;
      const targetId = edge.target;

      // Add dependency relationship
      if (!adjacencyList.has(sourceId)) {
        adjacencyList.set(sourceId, []);
      }
      adjacencyList.get(sourceId)!.push(targetId);

      if (!reverseAdjacencyList.has(targetId)) {
        reverseAdjacencyList.set(targetId, []);
      }
      reverseAdjacencyList.get(targetId)!.push(sourceId);

      // Update graph with dependencies
      const targetNode = graph.get(targetId);
      if (targetNode) {
        targetNode.dependencies.push(sourceId);
      }

      const sourceNode = graph.get(sourceId);
      if (sourceNode) {
        sourceNode.dependents.push(targetId);
      }
    });

    return graph;
  }

  private async executeParallelWorkflow(
    executionState: ExecutionState,
    executionGraph: Map<string, NodeExecutionResult>,
    workflow: Workflow,
    input: any
  ): Promise<Map<string, NodeExecutionResult>> {
    const results = new Map<string, NodeExecutionResult>();
    const executing = new Set<string>();
    const completed = new Set<string>();

    // Start with nodes that have no dependencies
    const readyQueue = Array.from(executionGraph.values())
      .filter(node => node.dependencies.length === 0)
      .map(node => node.nodeId);

    this.logger.log(`🎯 Starting with ${readyQueue.length} independent nodes`);

    while (readyQueue.length > 0 || executing.size > 0) {
      // Process ready queue with concurrency control
      const batchSize = Math.min(readyQueue.length, this.maxConcurrency - executing.size);
      const batchPromises: Promise<void>[] = [];

      for (let i = 0; i < batchSize; i++) {
        const nodeId = readyQueue.shift()!;
        const promise = this.executeNodeWithRetry(
          nodeId,
          executionState,
          executionGraph,
          workflow,
          input,
          executing,
          completed,
          readyQueue
        );
        batchPromises.push(promise);
      }

      // Wait for current batch to complete
      await Promise.allSettled(batchPromises);

      // Small delay to prevent tight loop
      if (readyQueue.length === 0 && executing.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return results;
  }

  private async executeNodeWithRetry(
    nodeId: string,
    executionState: ExecutionState,
    executionGraph: Map<string, NodeExecutionResult>,
    workflow: Workflow,
    input: any,
    executing: Set<string>,
    completed: Set<string>,
    readyQueue: string[]
  ): Promise<void> {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      this.logger.error(`Node ${nodeId} not found in workflow`);
      return;
    }

    const nodeResult = executionGraph.get(nodeId);
    if (!nodeResult) return;

    executing.add(nodeId);
    nodeResult.status = 'running';
    nodeResult.startedAt = new Date();

    // Update execution state
    executionState.progress.runningSteps++;
    await this.executionStateService.updateExecutionState(executionState.executionId, {
      progress: executionState.progress,
    });

    this.logger.debug(`▶️  Starting node: ${nodeId} (${node.type})`);

    let retryCount = 0;
    let success = false;

    while (retryCount <= this.maxRetries && !success) {
      try {
        // Execute with timeout
        const result = await Promise.race([
          this.nodeDispatcherService.dispatchNode(
            executionState.executionId,
            nodeId,
            node,
            input
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Node execution timeout after ${this.nodeTimeout}ms`)), this.nodeTimeout)
          )
        ]);

        nodeResult.status = 'completed';
        nodeResult.output = result;
        nodeResult.finishedAt = new Date();
        nodeResult.retryCount = retryCount;

        success = true;
        this.logger.debug(`✅ Node ${nodeId} completed successfully`);

        // Update progress
        executionState.progress.runningSteps--;
        executionState.progress.completedSteps++;
        await this.executionStateService.updateExecutionState(executionState.executionId, {
          progress: executionState.progress,
        });

      } catch (error) {
        retryCount++;
        this.logger.warn(`⚠️  Node ${nodeId} failed (attempt ${retryCount}/${this.maxRetries + 1}):`, error.message);

        if (retryCount > this.maxRetries) {
          nodeResult.status = 'failed';
          nodeResult.error = error.message;
          nodeResult.finishedAt = new Date();
          nodeResult.retryCount = retryCount;

          // Update failed count
          executionState.progress.runningSteps--;
          executionState.progress.failedSteps++;
          await this.executionStateService.updateExecutionState(executionState.executionId, {
            progress: executionState.progress,
            error: `Node ${nodeId} failed: ${error.message}`,
          });

          this.logger.error(`❌ Node ${nodeId} failed permanently after ${retryCount} attempts`);
        } else {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    executing.delete(nodeId);
    completed.add(nodeId);

    // Add dependent nodes to ready queue if all dependencies are completed
    const dependents = nodeResult.dependents || [];
    for (const dependentId of dependents) {
      const dependentNode = executionGraph.get(dependentId);
      if (dependentNode &&
          dependentNode.status === 'pending' &&
          dependentNode.dependencies.every(depId => completed.has(depId))) {
        readyQueue.push(dependentId);
        this.logger.debug(`🎯 Added dependent node ${dependentId} to ready queue`);
      }
    }
  }

  private calculateExecutionMetrics(
    results: Map<string, NodeExecutionResult>,
    startTime: number
  ): ExecutionMetrics {
    const totalTime = Date.now() - startTime;
    const nodeResults = Array.from(results.values());

    const completedNodes = nodeResults.filter(r => r.status === 'completed').length;
    const failedNodes = nodeResults.filter(r => r.status === 'failed').length;
    const totalNodes = nodeResults.length;

    const completedNodeTimes = nodeResults
      .filter(r => r.finishedAt && r.startedAt)
      .map(r => r.finishedAt!.getTime() - r.startedAt.getTime());

    const averageExecutionTime = completedNodeTimes.length > 0
      ? completedNodeTimes.reduce((a, b) => a + b, 0) / completedNodeTimes.length
      : 0;

    // Calculate parallelization efficiency (theoretical vs actual time)
    const sequentialTime = completedNodeTimes.reduce((a, b) => a + b, 0);
    const parallelizationEfficiency = sequentialTime > 0 ? (sequentialTime / totalTime) * 100 : 0;

    return {
      totalNodes,
      completedNodes,
      failedNodes,
      runningNodes: 0, // All should be completed by now
      averageExecutionTime,
      totalExecutionTime: totalTime,
      parallelizationEfficiency,
    };
  }
}

