import { Node, Edge } from 'reactflow';

export interface NodeOutput {
  nodeId: string;
  executionId: string;
  data: any;
  error?: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'running' | 'success' | 'error' | 'paused';
}

export interface ExecutionState {
  id: string;
  workflowId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  currentNodeId?: string;
  lastExecutedNodeIndex?: number;
  executionOrder?: string[];
  outputs: Record<string, NodeOutput>;
  variables: Record<string, any>;
  error?: string;
}

export interface ExecutionOptions {
  mode: 'full' | 'step' | 'until-node';
  untilNodeId?: string;
  startNodeId?: string;
  initialVariables?: Record<string, any>;
}

export class WorkflowExecutionEngine {
  private executionState: ExecutionState;
  private nodes: Node[];
  private edges: Edge[];
  private listeners: Array<(state: ExecutionState) => void> = [];
  private pauseRequested = false;
  private credentials: Record<string, any> = {};
  private currentExecutionMode: 'full' | 'step' | 'until-node' = 'full';

  constructor(
    workflowId: string,
    nodes: Node[],
    edges: Edge[],
    credentials?: Record<string, any>
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.credentials = credentials || {};
    this.executionState = {
      id: `exec_${Date.now()}`,
      workflowId,
      status: 'idle',
      outputs: {},
      variables: {},
      lastExecutedNodeIndex: -1,
      executionOrder: [],
    };
  }

  // Subscribe to execution state changes
  subscribe(listener: (state: ExecutionState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.executionState));
  }

  // Get nodes in topological order for execution
  private getExecutionOrder(): Node[] {
    const visited = new Set<string>();
    const order: Node[] = [];
    const inDegree = new Map<string, number>();

    // Calculate in-degree for each node
    this.nodes.forEach(node => {
      inDegree.set(node.id, 0);
    });

    this.edges.forEach(edge => {
      const current = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, current + 1);
    });

    // Find all nodes with no incoming edges (triggers)
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    // Process nodes in topological order
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        order.push(node);

        // Reduce in-degree for all neighbors
        const outgoingEdges = this.edges.filter(e => e.source === nodeId);
        outgoingEdges.forEach(edge => {
          const targetDegree = inDegree.get(edge.target) || 0;
          inDegree.set(edge.target, targetDegree - 1);

          // If in-degree becomes 0, add to queue
          if (targetDegree - 1 === 0) {
            queue.push(edge.target);
          }
        });
      }
    }

    // Check for cycles (if not all nodes were processed)
    if (order.length !== this.nodes.length) {
      console.warn('Warning: Workflow contains cycles or disconnected nodes');
      // Add any remaining nodes that weren't reached
      this.nodes.forEach(node => {
        if (!order.some(n => n.id === node.id)) {
          order.push(node);
        }
      });
    }

    return order;
  }

  // Get input data for a node from connected nodes
  private getNodeInputData(nodeId: string): Record<string, any> {
    const incomingEdges = this.edges.filter(e => e.target === nodeId);
    const inputData: Record<string, any> = {};

    incomingEdges.forEach(edge => {
      const sourceOutput = this.executionState.outputs[edge.source];
      if (sourceOutput && sourceOutput.data) {
        inputData[edge.source] = sourceOutput.data;
      }
    });

    return inputData;
  }

  // Resolve expressions in node configuration
  private resolveExpressions(config: any, context: Record<string, any>): any {
    if (typeof config === 'string') {
      // Check if it's an expression
      const expressionMatch = config.match(/^\{\{(.+)\}\}$/);
      if (expressionMatch) {
        const expression = expressionMatch[1].trim();
        try {
          // Create a safe evaluation context
          const evalContext = {
            $node: context.nodes || {},
            $vars: this.executionState.variables,
            $input: context.input || {},
            ...context,
          };

          // Use Function constructor for safer evaluation
          const func = new Function(...Object.keys(evalContext), `return ${expression}`);
          return func(...Object.values(evalContext));
        } catch (error) {
          console.error('Expression evaluation error:', error);
          return config;
        }
      }
    } else if (typeof config === 'object' && config !== null) {
      const resolved: any = Array.isArray(config) ? [] : {};
      for (const key in config) {
        resolved[key] = this.resolveExpressions(config[key], context);
      }
      return resolved;
    }

    return config;
  }

  // Execute a single node
  private async executeNode(node: Node): Promise<NodeOutput> {
    const startTime = new Date();
    const output: NodeOutput = {
      nodeId: node.id,
      executionId: this.executionState.id,
      data: null,
      startTime,
      endTime: new Date(),
      status: 'running',
    };

    try {
      // Update state to show current node
      this.executionState.currentNodeId = node.id;
      this.executionState.outputs[node.id] = output;
      this.notify();

      // Get input data from connected nodes
      const inputData = this.getNodeInputData(node.id);

      // Resolve expressions in node configuration
      const context = {
        nodes: this.executionState.outputs,
        input: inputData,
      };
      const resolvedConfig = this.resolveExpressions(node.data.config || {}, context);

      // Execute based on node type
      const result = await this.executeNodeByType(node, resolvedConfig, inputData);

      output.data = result;
      output.status = 'success';
    } catch (error: any) {
      output.error = error.message;
      output.status = 'error';
      throw error;
    } finally {
      output.endTime = new Date();
      this.executionState.outputs[node.id] = output;
      this.notify();
    }

    return output;
  }

  // Execute node based on its type
  private async executeNodeByType(
    node: Node,
    config: any,
    inputData: Record<string, any>
  ): Promise<any> {
    const nodeType = node.data.type;
    const subType = node.data.subType;

    switch (nodeType) {
      case 'trigger':
        return this.executeTriggerNode(subType, config);

      case 'action':
        return this.executeActionNode(subType, config, inputData);

      case 'transform':
        return this.executeTransformNode(subType, config, inputData);

      case 'condition':
        return this.executeConditionNode(subType, config, inputData);

      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }
  }

  private async executeTriggerNode(subType: string, config: any): Promise<any> {
    switch (subType) {
      case 'manual':
        return { triggered: true, timestamp: new Date() };

      case 'webhook':
        return { webhook: config.webhookPath, method: config.method };

      case 'schedule':
        return { schedule: config.schedule, nextRun: new Date() };

      default:
        return { type: subType, config };
    }
  }

  private async executeActionNode(
    subType: string,
    config: any,
    inputData: Record<string, any>
  ): Promise<any> {
    switch (subType) {
      case 'http':
        try {
          // Prepare request options
          const requestOptions: RequestInit = {
            method: config.method || 'GET',
            headers: config.headers || {},
          };

          // Add body for POST/PUT/PATCH requests
          if (['POST', 'PUT', 'PATCH'].includes(requestOptions.method) && config.body) {
            requestOptions.body = typeof config.body === 'string'
              ? config.body
              : JSON.stringify(config.body);

            // Set content-type if not already set
            if (!requestOptions.headers['Content-Type']) {
              requestOptions.headers['Content-Type'] = 'application/json';
            }
          }

          // Make the actual HTTP request
          console.log(`Making HTTP ${requestOptions.method} request to ${config.url}`);
          const response = await fetch(config.url, requestOptions);

          let data;
          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text();
          }

          return {
            url: config.url,
            method: requestOptions.method,
            headers: config.headers,
            status: response.status,
            statusText: response.statusText,
            data: data,
            success: response.ok,
          };
        } catch (error: any) {
          console.error('HTTP request failed:', error);
          return {
            url: config.url,
            method: config.method || 'GET',
            error: error.message,
            success: false,
          };
        }

      case 'email':
        // Simulate email sending
        return {
          to: config.to,
          subject: config.subject,
          body: config.body,
          sent: true,
        };

      case 'database':
        // Simulate database query
        return {
          query: config.query,
          results: [{ id: 1, name: 'Sample' }],
        };

      default:
        return { type: subType, config, input: inputData };
    }
  }

  private async executeTransformNode(
    subType: string,
    config: any,
    inputData: Record<string, any>
  ): Promise<any> {
    const firstInput = Object.values(inputData)[0];

    switch (subType) {
      case 'filter':
        if (Array.isArray(firstInput)) {
          // Apply filter condition
          return firstInput.filter((item, index) => index % 2 === 0);
        }
        return firstInput;

      case 'map':
        if (Array.isArray(firstInput)) {
          // Apply transformation
          return firstInput.map(item => ({ ...item, transformed: true }));
        }
        return { ...firstInput, transformed: true };

      case 'merge':
        // Merge all inputs
        return Object.values(inputData).reduce((acc, curr) => {
          if (Array.isArray(acc) && Array.isArray(curr)) {
            return [...acc, ...curr];
          }
          return { ...acc, ...curr };
        }, {});

      case 'code':
        // Execute custom code
        try {
          const func = new Function('$input', '$vars', config.code || 'return $input');
          return func(inputData, this.executionState.variables);
        } catch (error) {
          throw new Error(`Code execution error: ${error}`);
        }

      default:
        return { type: subType, config, input: inputData };
    }
  }

  private async executeConditionNode(
    subType: string,
    config: any,
    inputData: Record<string, any>
  ): Promise<any> {
    const firstInput = Object.values(inputData)[0];

    switch (subType) {
      case 'if':
        // Evaluate condition
        const condition = config.condition || 'true';
        try {
          const func = new Function('$input', `return ${condition}`);
          const result = func(firstInput);
          return { condition: result, branch: result ? 'true' : 'false' };
        } catch (error) {
          throw new Error(`Condition evaluation error: ${error}`);
        }

      case 'switch':
        // Evaluate switch cases
        const value = config.value || firstInput;
        const matchedCase = config.cases?.find((c: any) => c.value === value);
        return { value, case: matchedCase?.label || 'default' };

      default:
        return { type: subType, config, input: inputData };
    }
  }

  // Main execution method
  async execute(options: ExecutionOptions = { mode: 'full' }): Promise<ExecutionState> {
    this.pauseRequested = false;
    this.currentExecutionMode = options.mode;

    // Only reset state if starting fresh
    if (this.executionState.status !== 'paused') {
      this.executionState.status = 'running';
      this.executionState.startTime = new Date();
      this.executionState.variables = options.initialVariables || this.executionState.variables || {};
    } else {
      // Resuming from pause
      this.executionState.status = 'running';
    }

    this.notify();

    try {
      const executionOrder = this.getExecutionOrder();

      console.log('Execution order:', executionOrder.map(n => `${n.id} (${n.data.label})`));
      console.log('Total nodes to execute:', executionOrder.length);

      // Store execution order for resume
      this.executionState.executionOrder = executionOrder.map(n => n.id);

      let startIndex = 0;

      // Determine where to start
      if (this.executionState.lastExecutedNodeIndex >= 0) {
        // Resume from next node after last executed
        startIndex = this.executionState.lastExecutedNodeIndex + 1;
      } else if (options.startNodeId) {
        startIndex = executionOrder.findIndex(n => n.id === options.startNodeId);
        if (startIndex === -1) startIndex = 0;
      }

      for (let i = startIndex; i < executionOrder.length; i++) {
        const node = executionOrder[i];

        console.log(`Executing node ${i + 1}/${executionOrder.length}: ${node.id} (${node.data.label})`);

        // Check for pause
        if (this.pauseRequested) {
          this.executionState.status = 'paused';
          this.executionState.lastExecutedNodeIndex = i - 1;
          this.notify();
          break;
        }

        // Execute node
        await this.executeNode(node);

        // Update last executed index
        this.executionState.lastExecutedNodeIndex = i;

        // Check if we should stop at this node
        if (options.mode === 'step') {
          this.executionState.status = 'paused';
          this.notify();
          break;
        }

        if (options.mode === 'until-node' && node.id === options.untilNodeId) {
          break;
        }
      }

      if (this.executionState.status === 'running') {
        this.executionState.status = 'completed';
        this.executionState.lastExecutedNodeIndex = -1; // Reset for next run
      }
    } catch (error: any) {
      this.executionState.status = 'error';
      this.executionState.error = error.message;
    } finally {
      if (this.executionState.status !== 'paused') {
        this.executionState.endTime = new Date();
        this.executionState.currentNodeId = undefined;
      }
      this.notify();
    }

    return this.executionState;
  }

  // Control methods
  pause() {
    this.pauseRequested = true;
  }

  async resume() {
    if (this.executionState.status === 'paused') {
      // Continue with the same mode that was paused
      await this.execute({
        mode: this.currentExecutionMode,
        initialVariables: this.executionState.variables,
      });
    }
  }

  async stepForward() {
    if (this.executionState.status === 'paused' || this.executionState.status === 'idle') {
      // Execute just one more node
      await this.execute({
        mode: 'step',
        initialVariables: this.executionState.variables,
      });
    }
  }

  stop() {
    this.pauseRequested = true;
    this.executionState.status = 'idle';
    this.executionState.currentNodeId = undefined;
    this.executionState.lastExecutedNodeIndex = -1;
    this.executionState.outputs = {};
    this.executionState.variables = {};
    this.notify();
  }

  // Get current state
  getState(): ExecutionState {
    return this.executionState;
  }

  // Create variable from output
  createVariable(nodeId: string, path: string, variableName: string) {
    const output = this.executionState.outputs[nodeId];
    if (output && output.data) {
      const value = this.getValueByPath(output.data, path);
      this.executionState.variables[variableName] = value;
      this.notify();
    }
  }

  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }
}