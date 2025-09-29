import { db } from '../src/core/database';
import { workflowExecutions, workflows } from '../src/core/database/schemas';
import { eq } from 'drizzle-orm';

async function createProperExecutions() {
  console.log('🎯 Creating proper executions for each workflow...\n');

  try {
    // Clear existing executions
    await db.delete(workflowExecutions);
    console.log('✅ Cleared existing executions\n');

    // Get all workflows
    const allWorkflows = await db.select().from(workflows);

    for (const workflow of allWorkflows) {
      console.log(`📋 Creating executions for: ${workflow.name}`);

      const canvasState = workflow.canvasState as any;
      if (!canvasState || !canvasState.nodes) {
        console.log('  ⚠️ No canvas state, skipping');
        continue;
      }

      // Create completed execution
      const completedOutputs: any = {};
      canvasState.nodes.forEach((node: any) => {
        const nodeId = node.id;
        const nodeType = node.type || node.data?.type || 'action';

        completedOutputs[nodeId] = {
          status: 'success',
          executionTime: Math.floor(Math.random() * 2000) + 100,
          result: {
            processed: true,
            itemCount: Math.floor(Math.random() * 100) + 1,
            timestamp: new Date().toISOString(),
          }
        };
      });

      await db.insert(workflowExecutions).values({
        id: `exec-completed-${workflow.id}-${Date.now()}`,
        workflowId: workflow.id,
        userId: workflow.userId,
        status: 'completed',
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() - 5000),
        outputs: completedOutputs,
        metadata: {
          triggeredBy: 'manual',
          duration: 5000,
          logs: [
            {
              timestamp: new Date(Date.now() - 10000).toISOString(),
              level: 'info',
              message: `Started workflow: ${workflow.name}`,
              nodeId: 'system',
            },
            ...Object.keys(completedOutputs).map((nodeId, index) => ({
              timestamp: new Date(Date.now() - 9000 + index * 1000).toISOString(),
              level: 'info' as const,
              message: `Executed node: ${nodeId}`,
              nodeId: nodeId,
            })),
            {
              timestamp: new Date(Date.now() - 5000).toISOString(),
              level: 'info',
              message: `Completed workflow: ${workflow.name}`,
              nodeId: 'system',
            },
          ],
        },
      });

      // Create running execution (for some workflows)
      if (Math.random() > 0.5) {
        const runningOutputs: any = {};
        const nodesList = canvasState.nodes;
        const runningNodeIndex = Math.floor(nodesList.length / 2);

        nodesList.forEach((node: any, index: number) => {
          const nodeId = node.id;
          if (index < runningNodeIndex) {
            runningOutputs[nodeId] = {
              status: 'success',
              executionTime: Math.floor(Math.random() * 1500) + 100,
              result: { processed: true }
            };
          } else if (index === runningNodeIndex) {
            runningOutputs[nodeId] = {
              status: 'running',
              executionTime: null,
              result: null
            };
          }
          // Nodes after running node are not in outputs yet
        });

        await db.insert(workflowExecutions).values({
          id: `exec-running-${workflow.id}-${Date.now()}`,
          workflowId: workflow.id,
          userId: workflow.userId,
          status: 'running',
          startTime: new Date(Date.now() - 3000),
          endTime: null,
          outputs: runningOutputs,
          metadata: {
            triggeredBy: 'schedule',
            currentNodeId: nodesList[runningNodeIndex].id,
            logs: [
              {
                timestamp: new Date(Date.now() - 3000).toISOString(),
                level: 'info',
                message: `Started workflow: ${workflow.name}`,
                nodeId: 'system',
              },
              ...Object.keys(runningOutputs).filter(id => runningOutputs[id].status === 'success').map((nodeId) => ({
                timestamp: new Date(Date.now() - 2000).toISOString(),
                level: 'info' as const,
                message: `Completed node: ${nodeId}`,
                nodeId: nodeId,
              })),
              {
                timestamp: new Date(Date.now() - 100).toISOString(),
                level: 'info',
                message: `Running node: ${nodesList[runningNodeIndex].id}`,
                nodeId: nodesList[runningNodeIndex].id,
              },
            ],
          },
        });
      }

      // Create failed execution (for some workflows)
      if (Math.random() > 0.5) {
        const failedOutputs: any = {};
        const nodesList = canvasState.nodes;
        const failNodeIndex = Math.floor(Math.random() * nodesList.length);

        nodesList.forEach((node: any, index: number) => {
          const nodeId = node.id;
          if (index < failNodeIndex) {
            failedOutputs[nodeId] = {
              status: 'success',
              executionTime: Math.floor(Math.random() * 1000) + 100,
              result: { processed: true }
            };
          } else if (index === failNodeIndex) {
            failedOutputs[nodeId] = {
              status: 'error',
              executionTime: 2000,
              error: 'Connection timeout: Unable to reach external service',
              result: null
            };
          }
          // Nodes after failed node are not executed
        });

        await db.insert(workflowExecutions).values({
          id: `exec-failed-${workflow.id}-${Date.now()}`,
          workflowId: workflow.id,
          userId: workflow.userId,
          status: 'failed',
          startTime: new Date(Date.now() - 8000),
          endTime: new Date(Date.now() - 6000),
          error: `Failed at node: ${nodesList[failNodeIndex].id}`,
          outputs: failedOutputs,
          metadata: {
            triggeredBy: 'webhook',
            duration: 2000,
            logs: [
              {
                timestamp: new Date(Date.now() - 8000).toISOString(),
                level: 'info',
                message: `Started workflow: ${workflow.name}`,
                nodeId: 'system',
              },
              ...Object.keys(failedOutputs).filter(id => failedOutputs[id].status === 'success').map((nodeId) => ({
                timestamp: new Date(Date.now() - 7000).toISOString(),
                level: 'info' as const,
                message: `Completed node: ${nodeId}`,
                nodeId: nodeId,
              })),
              {
                timestamp: new Date(Date.now() - 6000).toISOString(),
                level: 'error',
                message: `Failed at node: ${nodesList[failNodeIndex].id} - Connection timeout`,
                nodeId: nodesList[failNodeIndex].id,
              },
            ],
          },
        });
      }

      console.log(`  ✅ Created executions for ${workflow.name}`);
    }

    // Count total executions
    const executionCount = await db.select().from(workflowExecutions);
    console.log(`\n✨ Created ${executionCount.length} total executions`);
    console.log('🔍 Check the workbench to see unique executions for each workflow');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

createProperExecutions();