'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Save,
  Download,
  Upload,
  History,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { NodeToolbar } from './node-toolbar';
import { nodeTypes } from './node-types';
import { ExecutionControls } from './execution-controls';
import { NodeOutputViewer } from './node-output-viewer';
import { WorkflowExecutionEngine, ExecutionState } from '@/core/workflow/execution-engine';

interface WorkflowCanvasProps {
  workflowId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExecute?: () => void;
}

function WorkflowCanvasContent({
  workflowId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onExecute,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [executionEngine, setExecutionEngine] = useState<WorkflowExecutionEngine | null>(null);
  const [showOutputPanel, setShowOutputPanel] = useState(true);
  const [currentExpressionEditor, setCurrentExpressionEditor] = useState<((value: string) => void) | null>(null);
  const { project } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#64748b',
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const subType = event.dataTransfer.getData('subType');
      const label = event.dataTransfer.getData('label');
      const description = event.dataTransfer.getData('description');

      const newNode: Node = {
        id: `${subType || type}_${Date.now()}`,
        type,
        position,
        data: {
          label: label || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          description: description || '',
          type: type,
          subType: subType || null,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success('Node added to canvas');
    },
    [project, setNodes]
  );

  // Update nodes with execution status
  useEffect(() => {
    if (!executionState) return;

    const updatedNodes = nodes.map(node => {
      const output = executionState.outputs[node.id];
      if (output) {
        return {
          ...node,
          data: {
            ...node.data,
            executionStatus: output.status,
            hasOutput: true,
          },
          style: {
            ...node.style,
            borderColor: output.status === 'success' ? '#10b981' :
                        output.status === 'error' ? '#ef4444' :
                        output.status === 'running' ? '#3b82f6' : undefined,
            borderWidth: output.status ? 2 : 1,
          },
        };
      }
      return node;
    });

    setNodes(updatedNodes);
  }, [executionState]);

  const handleExecutionStateChange = (state: ExecutionState) => {
    setExecutionState(state);
  };

  const handleCreateVariable = (nodeId: string, path: string, variableName: string) => {
    executionEngine?.createVariable(nodeId, path, variableName);
  };

  const handleInsertToExpression = (value: string) => {
    if (currentExpressionEditor) {
      currentExpressionEditor(value);
      toast.success('Inserted to expression');
    } else {
      toast.info('Select an expression field first');
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
    toast.success('Workflow saved successfully');
  };

  const handleExport = () => {
    const workflow = {
      nodes,
      edges,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `workflow_${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Workflow exported successfully');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      try {
        const workflow = JSON.parse(text);
        if (workflow.nodes && workflow.edges) {
          setNodes(workflow.nodes);
          setEdges(workflow.edges);
          toast.success('Workflow imported successfully');
        } else {
          toast.error('Invalid workflow file');
        }
      } catch (error) {
        toast.error('Failed to parse workflow file');
      }
    };
    input.click();
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Execution Controls Bar */}
      <ExecutionControls
        nodes={nodes}
        edges={edges}
        workflowId={workflowId || 'default'}
        onExecutionStateChange={handleExecutionStateChange}
      />

      {/* Secondary Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowOutputPanel(!showOutputPanel)}
          className="gap-2"
        >
          {showOutputPanel ? (
            <>
              <PanelRightClose className="h-4 w-4" />
              Hide Output
            </>
          ) : (
            <>
              <PanelRightOpen className="h-4 w-4" />
              Show Output
            </>
          )}
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Canvas Panel */}
          <ResizablePanel defaultSize={showOutputPanel ? 70 : 100}>
            <div className="h-full relative" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#64748b', strokeWidth: 1.5 },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 15,
                    height: 15,
                    color: '#64748b',
                  },
                }}
                connectionLineType="smoothstep"
                connectionLineStyle={{
                  stroke: '#64748b',
                  strokeWidth: 1.5,
                }}
                fitView
                className="bg-background"
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>

              {selectedNode && (
                <NodeToolbar
                  node={selectedNode}
                  availableNodes={nodes.filter(n => n.id !== selectedNode.id)}
                  executionOutputs={executionState?.outputs || {}}
                  onClose={() => setSelectedNode(null)}
                  onUpdate={(updatedNode) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === updatedNode.id ? updatedNode : node
                      )
                    );
                  }}
                  onDelete={(nodeId) => {
                    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
                    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
                    setSelectedNode(null);
                  }}
                  onRegisterExpressionEditor={setCurrentExpressionEditor}
                />
              )}
            </div>
          </ResizablePanel>

          {/* Output Panel */}
          {showOutputPanel && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <NodeOutputViewer
                  executionState={executionState}
                  nodes={nodes}
                  onCreateVariable={handleCreateVariable}
                  onInsertToExpression={handleInsertToExpression}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent {...props} />
    </ReactFlowProvider>
  );
}