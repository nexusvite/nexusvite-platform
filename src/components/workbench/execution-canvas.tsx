'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ExecutionCanvasProps {
  execution: {
    executionId: string;
    workflowId: string;
    currentNodeId?: string;
    nodes: Array<{
      id: string;
      name: string;
      type: string;
      status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
      executionTime?: number;
      inputs?: any;
      outputs?: any;
      error?: string;
    }>;
  };
  onNodeClick?: (nodeId: string) => void;
}

const NodeStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />;
    case 'skipped':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return null;
  }
};

const CustomNode = memo(({ data }: { data: any }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'failed':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950 animate-pulse';
      case 'skipped':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'border-gray-300 bg-white dark:bg-gray-900';
    }
  };

  return (
    <Card className={`p-3 min-w-[200px] border-2 transition-all ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{data.label}</span>
        <NodeStatusIcon status={data.status} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Type:</span>
          <Badge variant="outline" className="text-xs px-1 py-0">
            {data.nodeType}
          </Badge>
        </div>

        {data.executionTime && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Time:</span>
            <span className="font-mono">{data.executionTime}ms</span>
          </div>
        )}

        {data.status === 'running' && (
          <Progress value={data.progress || 0} className="h-1 mt-2" />
        )}

        {data.error && (
          <div className="text-xs text-red-500 mt-2 p-1 bg-red-100 dark:bg-red-900 rounded">
            {data.error}
          </div>
        )}
      </div>
    </Card>
  );
});

CustomNode.displayName = 'CustomNode';

// Define nodeTypes outside component to prevent recreation
const nodeTypes = {
  custom: CustomNode,
};

export function WorkflowExecutionCanvas({ execution, onNodeClick }: ExecutionCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowData, setWorkflowData] = useState<any>(null);

  useEffect(() => {
    // Fetch workflow structure
    const fetchWorkflow = async () => {
      try {
        console.log('Fetching workflow:', execution.workflowId);
        console.log('Execution has nodes:', execution.nodes?.length || 0);
        const response = await fetch(`/api/developer/workflows/${execution.workflowId}`);

        if (!response.ok) {
          console.error('Failed to fetch workflow, status:', response.status);
          // If we can't fetch the workflow, create nodes from execution data
          if (execution.nodes && execution.nodes.length > 0) {
            console.log('Creating nodes from execution data:', execution.nodes);
            const flowNodes = execution.nodes.map((node: any, index: number) => ({
              id: node.id,
              type: 'custom',
              position: {
                x: 100 + (index % 3) * 200,
                y: 100 + Math.floor(index / 3) * 150
              },
              data: {
                label: node.name || node.id,
                nodeType: node.type,
                status: node.status,
                executionTime: node.executionTime,
                error: node.error,
                inputs: node.inputs,
                outputs: node.outputs,
              },
            }));

            // Create simple edges connecting nodes in sequence
            const flowEdges = execution.nodes.slice(0, -1).map((node: any, index: number) => ({
              id: `edge-${index}`,
              source: node.id,
              target: execution.nodes[index + 1].id,
              animated: false,
              style: {
                stroke: node.status === 'completed' ? '#10b981' : '#6b7280',
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: node.status === 'completed' ? '#10b981' : '#6b7280',
              },
            }));

            setNodes(flowNodes);
            setEdges(flowEdges);
          }
          return;
        }

        const data = await response.json();
        console.log('Workflow data received:', data);
        setWorkflowData(data.workflow);

        // Initialize nodes and edges from workflow structure
        if (data.workflow?.canvasState?.nodes && data.workflow.canvasState.nodes.length > 0) {
          console.log('Canvas state nodes:', data.workflow.canvasState.nodes);
          const flowNodes = data.workflow.canvasState.nodes.map((node: any) => {
            const executionNode = execution.nodes.find(n => n.id === node.id);
            console.log(`Matching node ${node.id} with execution:`, executionNode);

            // Use node data from canvas state
            const nodeLabel = node.data?.label || node.id.replace(/-/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const nodeType = node.data?.type || node.data?.subType || node.type || 'action';

            return {
              ...node,
              type: 'custom',
              data: {
                ...node.data,
                label: nodeLabel,
                nodeType: nodeType,
                status: executionNode?.status || 'pending',
                executionTime: executionNode?.executionTime,
                error: executionNode?.error,
                inputs: executionNode?.inputs,
                outputs: executionNode?.outputs,
              },
            };
          });

          const flowEdges = (data.workflow.canvasState.edges || []).map((edge: any) => ({
            ...edge,
            animated: execution.currentNodeId === edge.source,
            style: {
              stroke: execution.nodes.find(n => n.id === edge.source)?.status === 'completed'
                ? '#10b981'
                : execution.nodes.find(n => n.id === edge.source)?.status === 'failed'
                ? '#ef4444'
                : '#6b7280',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: execution.nodes.find(n => n.id === edge.source)?.status === 'completed'
                ? '#10b981'
                : execution.nodes.find(n => n.id === edge.source)?.status === 'failed'
                ? '#ef4444'
                : '#6b7280',
            },
          }));

          console.log('Setting nodes:', flowNodes);
          console.log('Setting edges:', flowEdges);
          setNodes(flowNodes);
          setEdges(flowEdges);
        } else if (execution.nodes && execution.nodes.length > 0) {
          // Fallback: Create nodes from execution data if no canvas state
          console.log('No canvas state, creating from execution nodes');
          const flowNodes = execution.nodes.map((node: any, index: number) => ({
            id: node.id,
            type: 'custom',
            position: {
              x: 100 + (index % 3) * 200,
              y: 100 + Math.floor(index / 3) * 150
            },
            data: {
              label: node.name || node.id,
              nodeType: node.type,
              status: node.status,
              executionTime: node.executionTime,
              error: node.error,
              inputs: node.inputs,
              outputs: node.outputs,
            },
          }));

          const flowEdges = execution.nodes.slice(0, -1).map((node: any, index: number) => ({
            id: `edge-${index}`,
            source: node.id,
            target: execution.nodes[index + 1].id,
            animated: false,
            style: {
              stroke: node.status === 'completed' ? '#10b981' : '#6b7280',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: node.status === 'completed' ? '#10b981' : '#6b7280',
            },
          }));

          setNodes(flowNodes);
          setEdges(flowEdges);
        }
      } catch (error) {
        console.error('Failed to fetch workflow:', error);
      }
    };

    if (execution.workflowId) {
      fetchWorkflow();
    }
  }, [execution.workflowId, execution.nodes]);

  // Update node statuses when execution changes
  useEffect(() => {
    console.log('Updating node statuses, current nodes:', nodes);
    console.log('Execution nodes:', execution.nodes);

    setNodes((nds) =>
      nds.map((node) => {
        const executionNode = execution.nodes.find(n => n.id === node.id);
        console.log(`Matching node ${node.id} with execution node:`, executionNode);
        if (executionNode) {
          return {
            ...node,
            data: {
              ...node.data,
              status: executionNode.status,
              executionTime: executionNode.executionTime,
              error: executionNode.error,
              progress: executionNode.status === 'running' ? 50 : 0,
            },
          };
        }
        return node;
      })
    );

    // Update edge animations
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: execution.currentNodeId === edge.source,
        style: {
          stroke: execution.nodes.find(n => n.id === edge.source)?.status === 'completed'
            ? '#10b981'
            : execution.nodes.find(n => n.id === edge.source)?.status === 'failed'
            ? '#ef4444'
            : '#6b7280',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: execution.nodes.find(n => n.id === edge.source)?.status === 'completed'
            ? '#10b981'
            : execution.nodes.find(n => n.id === edge.source)?.status === 'failed'
            ? '#ef4444'
            : '#6b7280',
        },
      }))
    );
  }, [execution]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  console.log('Rendering canvas with:', {
    nodesCount: nodes.length,
    edgesCount: edges.length,
    nodes: nodes,
    edges: edges,
    execution: execution,
  });

  // If no nodes, show a message or fallback canvas
  if (nodes.length === 0) {
    // If we have execution nodes but no canvas nodes, create a simple layout
    if (execution.nodes && execution.nodes.length > 0) {
      console.log('Creating fallback nodes from execution data');
      const fallbackNodes = execution.nodes.map((node: any, index: number) => ({
        id: node.id,
        type: 'custom',
        position: {
          x: 100 + (index % 3) * 250,
          y: 100 + Math.floor(index / 3) * 150
        },
        data: {
          label: node.name || node.id,
          nodeType: node.type,
          status: node.status,
          executionTime: node.executionTime,
          error: node.error,
        },
      }));

      const fallbackEdges = execution.nodes.slice(0, -1).map((node: any, index: number) => ({
        id: `edge-${index}`,
        source: node.id,
        target: execution.nodes[index + 1].id,
        animated: node.status === 'running',
        style: {
          stroke: node.status === 'completed' ? '#10b981' :
                 node.status === 'failed' ? '#ef4444' : '#6b7280',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: node.status === 'completed' ? '#10b981' :
                node.status === 'failed' ? '#ef4444' : '#6b7280',
        },
      }));

      // Set the fallback nodes immediately
      setTimeout(() => {
        setNodes(fallbackNodes);
        setEdges(fallbackEdges);
      }, 100);
    }

    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <p className="text-muted-foreground">Loading workflow canvas...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Workflow ID: {execution.workflowId}
          </p>
          <p className="text-sm text-muted-foreground">
            Execution nodes: {execution.nodes?.length || 0}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ minHeight: '400px', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeColor={(node) => {
            const status = node.data?.status;
            switch (status) {
              case 'completed':
                return '#10b981';
              case 'failed':
                return '#ef4444';
              case 'running':
                return '#3b82f6';
              default:
                return '#6b7280';
            }
          }}
          nodeColor={(node) => {
            const status = node.data?.status;
            switch (status) {
              case 'completed':
                return '#10b981';
              case 'failed':
                return '#ef4444';
              case 'running':
                return '#3b82f6';
              default:
                return '#e5e7eb';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}