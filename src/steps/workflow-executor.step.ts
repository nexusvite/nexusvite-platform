import { z } from 'zod';
import type { ApiRouteConfig, Handlers } from '@motia/core';

/**
 * Workflow Executor Step
 * Bridges between Nexusvite Platform workflow nodes and Motia steps
 */
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'WorkflowExecutor',
  method: 'POST',
  path: '/workflow/execute',
  bodySchema: z.object({
    workflowId: z.string(),
    nodeId: z.string(),
    nodeType: z.string(),
    nodeSubType: z.string().optional(),
    config: z.record(z.any()),
    inputData: z.record(z.any()).optional(),
  }),
  emits: [
    'workflow.node.started',
    'workflow.node.completed',
    'workflow.node.failed',
    'workflow.http.request',
    'workflow.email.send',
    'workflow.database.query',
    'workflow.transform.execute',
    'workflow.condition.evaluate',
  ],
  flows: ['workflow-automation'],
};

export const handler: Handlers['WorkflowExecutor'] = async (
  req,
  { logger, emit, state, traceId }
) => {
  const { workflowId, nodeId, nodeType, nodeSubType, config, inputData } = req.body;

  logger.info(`Executing workflow node: ${nodeId}`, {
    workflowId,
    nodeType,
    nodeSubType,
    traceId,
  });

  // Emit node started event
  await emit({
    topic: 'workflow.node.started',
    data: {
      workflowId,
      nodeId,
      nodeType,
      nodeSubType,
      timestamp: new Date().toISOString(),
      traceId,
    },
  });

  try {
    let result: any = null;

    // Handle different node types
    switch (nodeType) {
      case 'trigger':
        result = await handleTrigger(nodeSubType, config, { logger, emit, state });
        break;

      case 'action':
        result = await handleAction(nodeSubType, config, inputData, { logger, emit, state });
        break;

      case 'transform':
        result = await handleTransform(nodeSubType, config, inputData, { logger, emit, state });
        break;

      case 'condition':
        result = await handleCondition(nodeSubType, config, inputData, { logger, emit, state });
        break;

      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }

    // Store result in state
    await state.set('workflow_results', `${workflowId}_${nodeId}`, {
      nodeId,
      result,
      timestamp: new Date().toISOString(),
      traceId,
    });

    // Emit node completed event
    await emit({
      topic: 'workflow.node.completed',
      data: {
        workflowId,
        nodeId,
        nodeType,
        nodeSubType,
        result,
        timestamp: new Date().toISOString(),
        traceId,
      },
    });

    return {
      status: 200,
      body: {
        success: true,
        nodeId,
        result,
        traceId,
      },
    };
  } catch (error: any) {
    logger.error(`Node execution failed: ${nodeId}`, {
      error: error.message,
      workflowId,
      nodeId,
      traceId,
    });

    // Emit node failed event
    await emit({
      topic: 'workflow.node.failed',
      data: {
        workflowId,
        nodeId,
        nodeType,
        nodeSubType,
        error: error.message,
        timestamp: new Date().toISOString(),
        traceId,
      },
    });

    return {
      status: 500,
      body: {
        success: false,
        nodeId,
        error: error.message,
        traceId,
      },
    };
  }
};

/**
 * Handle trigger nodes
 */
async function handleTrigger(
  subType: string | undefined,
  config: any,
  { logger, emit, state }: any
): Promise<any> {
  switch (subType) {
    case 'manual':
      logger.info('Manual trigger activated');
      return { triggered: true, timestamp: new Date().toISOString() };

    case 'webhook':
      logger.info('Webhook trigger activated', { path: config.webhookPath });
      return {
        webhook: config.webhookPath,
        method: config.method,
        timestamp: new Date().toISOString(),
      };

    case 'schedule':
      logger.info('Schedule trigger activated', { schedule: config.schedule });
      return {
        schedule: config.schedule,
        timestamp: new Date().toISOString(),
      };

    default:
      return { type: subType, config, timestamp: new Date().toISOString() };
  }
}

/**
 * Handle action nodes
 */
async function handleAction(
  subType: string | undefined,
  config: any,
  inputData: any,
  { logger, emit, state }: any
): Promise<any> {
  switch (subType) {
    case 'http':
      logger.info('Executing HTTP request', { url: config.url, method: config.method });

      // Emit event for HTTP request processing
      await emit({
        topic: 'workflow.http.request',
        data: {
          url: config.url,
          method: config.method || 'GET',
          headers: config.headers || {},
          body: config.body,
          inputData,
        },
      });

      // For now, return mock response
      // In production, this would be handled by a separate HTTP step
      return {
        url: config.url,
        method: config.method || 'GET',
        status: 200,
        data: { message: 'HTTP request queued for processing' },
      };

    case 'email':
      logger.info('Sending email', { to: config.to, subject: config.subject });

      // Emit event for email processing
      await emit({
        topic: 'workflow.email.send',
        data: {
          to: config.to,
          from: config.from,
          subject: config.subject,
          body: config.body,
          inputData,
        },
      });

      return {
        to: config.to,
        subject: config.subject,
        status: 'queued',
      };

    case 'database':
      logger.info('Executing database query', { query: config.query });

      // Emit event for database query processing
      await emit({
        topic: 'workflow.database.query',
        data: {
          query: config.query,
          params: config.params,
          connection: config.connection,
          inputData,
        },
      });

      return {
        query: config.query,
        status: 'queued',
      };

    default:
      return { type: subType, config, inputData };
  }
}

/**
 * Handle transform nodes
 */
async function handleTransform(
  subType: string | undefined,
  config: any,
  inputData: any,
  { logger, emit, state }: any
): Promise<any> {
  logger.info('Executing transform', { type: subType });

  // Emit event for transform processing
  await emit({
    topic: 'workflow.transform.execute',
    data: {
      transformType: subType,
      config,
      inputData,
    },
  });

  // Simple transform examples
  switch (subType) {
    case 'filter':
      if (Array.isArray(inputData)) {
        // Simple even number filter for demo
        return inputData.filter((item: any, index: number) => index % 2 === 0);
      }
      return inputData;

    case 'map':
      if (Array.isArray(inputData)) {
        return inputData.map((item: any) => ({ ...item, transformed: true }));
      }
      return { ...inputData, transformed: true };

    case 'merge':
      return { merged: true, ...inputData };

    default:
      return { type: subType, config, inputData };
  }
}

/**
 * Handle condition nodes
 */
async function handleCondition(
  subType: string | undefined,
  config: any,
  inputData: any,
  { logger, emit, state }: any
): Promise<any> {
  logger.info('Evaluating condition', { type: subType });

  // Emit event for condition evaluation
  await emit({
    topic: 'workflow.condition.evaluate',
    data: {
      conditionType: subType,
      config,
      inputData,
    },
  });

  switch (subType) {
    case 'if':
      // Simple condition evaluation
      const condition = config.condition || 'true';
      const result = condition === 'true'; // Simplified for demo
      return { condition: result, branch: result ? 'true' : 'false' };

    case 'switch':
      const value = config.value || inputData;
      const matchedCase = config.cases?.find((c: any) => c.value === value);
      return { value, case: matchedCase?.label || 'default' };

    default:
      return { type: subType, config, inputData };
  }
}