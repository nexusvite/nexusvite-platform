/**
 * Motia Adapter for Workflow Execution Engine
 * Bridges our visual workflow nodes with Motia's event-driven steps
 */

import { Node } from 'reactflow';

export interface MotiaStepConfig {
  type: 'api' | 'event' | 'cron' | 'stream' | 'noop';
  name: string;
  method?: string;
  path?: string;
  subscribes?: string[];
  emits?: string[];
  flows?: string[];
  input?: Record<string, any>;
  cron?: string;
}

export interface MotiaContext {
  logger: {
    info: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
  };
  emit: (event: { topic: string; data: any }) => Promise<void>;
  state: {
    get: (group: string, key: string) => Promise<any>;
    set: (group: string, key: string, value: any) => Promise<void>;
    getGroup: (group: string) => Promise<Record<string, any>>;
  };
  traceId: string;
}

export class MotiaAdapter {
  private motiaBaseUrl: string;
  private workflowState: Map<string, any>;
  private eventQueue: Array<{ topic: string; data: any }>;

  constructor(motiaBaseUrl: string = 'http://localhost:3000') {
    this.motiaBaseUrl = motiaBaseUrl;
    this.workflowState = new Map();
    this.eventQueue = [];
  }

  /**
   * Convert workflow node to Motia step configuration
   */
  nodeToMotiaStep(node: Node): MotiaStepConfig {
    const { type, subType, config } = node.data;

    switch (type) {
      case 'trigger':
        return this.createTriggerStep(subType, config, node);

      case 'action':
        return this.createActionStep(subType, config, node);

      case 'transform':
        return this.createTransformStep(subType, config, node);

      case 'condition':
        return this.createConditionStep(subType, config, node);

      default:
        return this.createNoopStep(node);
    }
  }

  /**
   * Create Motia trigger step from workflow trigger node
   */
  private createTriggerStep(subType: string, config: any, node: Node): MotiaStepConfig {
    switch (subType) {
      case 'manual':
        return {
          type: 'api',
          name: `Trigger_${node.id}`,
          method: 'POST',
          path: `/workflow/trigger/${node.id}`,
          emits: [`workflow.${node.id}.triggered`],
          flows: ['workflow-automation'],
        };

      case 'webhook':
        return {
          type: 'api',
          name: `Webhook_${node.id}`,
          method: config.method || 'POST',
          path: config.webhookPath || `/webhook/${node.id}`,
          emits: [`webhook.${node.id}.received`],
          flows: ['workflow-automation'],
        };

      case 'schedule':
        return {
          type: 'cron',
          name: `Schedule_${node.id}`,
          cron: config.schedule || '0 * * * *',
          emits: [`schedule.${node.id}.triggered`],
        };

      default:
        return this.createNoopStep(node);
    }
  }

  /**
   * Create Motia action step from workflow action node
   */
  private createActionStep(subType: string, config: any, node: Node): MotiaStepConfig {
    const baseConfig: MotiaStepConfig = {
      type: 'event',
      name: `Action_${node.id}`,
      subscribes: [`workflow.${node.id}.execute`],
      emits: [`workflow.${node.id}.completed`, `workflow.${node.id}.failed`],
      input: config,
    };

    switch (subType) {
      case 'http':
        return {
          ...baseConfig,
          name: `HttpRequest_${node.id}`,
          input: {
            url: config.url,
            method: config.method || 'GET',
            headers: config.headers || {},
            body: config.body,
          },
        };

      case 'email':
        return {
          ...baseConfig,
          name: `SendEmail_${node.id}`,
          input: {
            to: config.to,
            subject: config.subject,
            body: config.body,
            from: config.from,
          },
        };

      case 'database':
        return {
          ...baseConfig,
          name: `DatabaseQuery_${node.id}`,
          input: {
            query: config.query,
            params: config.params,
            connection: config.connection,
          },
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Create Motia transform step from workflow transform node
   */
  private createTransformStep(subType: string, config: any, node: Node): MotiaStepConfig {
    return {
      type: 'event',
      name: `Transform_${node.id}`,
      subscribes: [`workflow.${node.id}.execute`],
      emits: [`workflow.${node.id}.transformed`],
      input: {
        transformType: subType,
        config: config,
      },
    };
  }

  /**
   * Create Motia condition step from workflow condition node
   */
  private createConditionStep(subType: string, config: any, node: Node): MotiaStepConfig {
    return {
      type: 'event',
      name: `Condition_${node.id}`,
      subscribes: [`workflow.${node.id}.execute`],
      emits: [
        `workflow.${node.id}.true`,
        `workflow.${node.id}.false`,
      ],
      input: {
        conditionType: subType,
        config: config,
      },
    };
  }

  /**
   * Create NOOP step for routing
   */
  private createNoopStep(node: Node): MotiaStepConfig {
    return {
      type: 'noop',
      name: `Route_${node.id}`,
      subscribes: [`workflow.${node.id}.execute`],
      emits: [`workflow.${node.id}.routed`],
    };
  }

  /**
   * Execute a Motia step via API
   */
  async executeStep(stepConfig: MotiaStepConfig, inputData: any): Promise<any> {
    try {
      // Call Motia API to execute the step
      const response = await fetch(`${this.motiaBaseUrl}/api/steps/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: stepConfig,
          input: inputData,
          traceId: `trace_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Motia step execution failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing Motia step:', error);
      throw error;
    }
  }

  /**
   * Create Motia context for step execution
   */
  createContext(nodeId: string): MotiaContext {
    const traceId = `trace_${nodeId}_${Date.now()}`;

    return {
      logger: {
        info: (message: string, data?: any) => {
          console.log(`[Motia:${nodeId}] INFO:`, message, data || '');
        },
        error: (message: string, data?: any) => {
          console.error(`[Motia:${nodeId}] ERROR:`, message, data || '');
        },
        warn: (message: string, data?: any) => {
          console.warn(`[Motia:${nodeId}] WARN:`, message, data || '');
        },
      },
      emit: async (event: { topic: string; data: any }) => {
        this.eventQueue.push(event);
        console.log(`[Motia:${nodeId}] Event emitted:`, event.topic);

        // Send event to Motia
        try {
          await fetch(`${this.motiaBaseUrl}/api/events/emit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...event,
              traceId,
            }),
          });
        } catch (error) {
          console.error('Failed to emit event to Motia:', error);
        }
      },
      state: {
        get: async (group: string, key: string) => {
          const groupData = this.workflowState.get(group) || {};
          return groupData[key];
        },
        set: async (group: string, key: string, value: any) => {
          const groupData = this.workflowState.get(group) || {};
          groupData[key] = value;
          this.workflowState.set(group, groupData);
        },
        getGroup: async (group: string) => {
          return this.workflowState.get(group) || {};
        },
      },
      traceId,
    };
  }

  /**
   * Get emitted events
   */
  getEvents(): Array<{ topic: string; data: any }> {
    return [...this.eventQueue];
  }

  /**
   * Clear event queue
   */
  clearEvents(): void {
    this.eventQueue = [];
  }

  /**
   * Get workflow state
   */
  getState(): Map<string, any> {
    return new Map(this.workflowState);
  }

  /**
   * Clear workflow state
   */
  clearState(): void {
    this.workflowState.clear();
  }
}