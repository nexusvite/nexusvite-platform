'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowCanvas } from '@/components/developer/workflow-editor/workflow-canvas';
import { WorkflowList } from '@/components/developer/workflow-editor/workflow-list';
import { NodePalette } from '@/components/developer/workflow-editor/node-palette';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Workflow,
  Grid3x3,
  History,
  Settings,
  BookOpen,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  triggerType?: string;
  schedule?: string;
  webhookPath?: string;
  canvasState?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default function IntegrationsPage() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [loading, setLoading] = useState(true);

  // Fetch workflows on mount
  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/developer/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      } else {
        toast.error('Failed to fetch workflows');
      }
    } catch (error) {
      toast.error('Error fetching workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (data: { name: string; description: string }) => {
    try {
      const response = await fetch('/api/developer/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newWorkflow = await response.json();
        setWorkflows([newWorkflow.workflow, ...workflows]);
        setSelectedWorkflow(newWorkflow.workflow);
        setActiveTab('editor');
        toast.success('Workflow created');
      } else {
        toast.error('Failed to create workflow');
      }
    } catch (error) {
      toast.error('Error creating workflow');
    }
  };

  const handleSaveWorkflow = async (nodes: any[], edges: any[]) => {
    if (!selectedWorkflow) return;

    const canvasState = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    try {
      const response = await fetch(`/api/developer/workflows/${selectedWorkflow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canvasState }),
      });

      if (response.ok) {
        const updatedWorkflow = await response.json();
        setWorkflows(workflows.map(w =>
          w.id === selectedWorkflow.id ? updatedWorkflow.workflow : w
        ));
        setSelectedWorkflow(updatedWorkflow.workflow);
        toast.success('Workflow saved');
      } else {
        toast.error('Failed to save workflow');
      }
    } catch (error) {
      toast.error('Error saving workflow');
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      const response = await fetch(`/api/developer/workflows/${selectedWorkflow.id}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Workflow execution started');
        // Could open execution history tab
        setActiveTab('history');
      } else {
        toast.error('Failed to execute workflow');
      }
    } catch (error) {
      toast.error('Error executing workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/developer/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkflows(workflows.filter(w => w.id !== workflowId));
        if (selectedWorkflow?.id === workflowId) {
          setSelectedWorkflow(null);
        }
        toast.success('Workflow deleted');
      } else {
        toast.error('Failed to delete workflow');
      }
    } catch (error) {
      toast.error('Error deleting workflow');
    }
  };

  const handleToggleActive = async (workflowId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/developer/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });

      if (response.ok) {
        const updatedWorkflow = await response.json();
        setWorkflows(workflows.map(w =>
          w.id === workflowId ? updatedWorkflow.workflow : w
        ));
        if (selectedWorkflow?.id === workflowId) {
          setSelectedWorkflow(updatedWorkflow.workflow);
        }
      } else {
        toast.error('Failed to update workflow');
      }
    } catch (error) {
      toast.error('Error updating workflow');
    }
  };

  const handleDuplicateWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    try {
      const response = await fetch('/api/developer/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          canvasState: workflow.canvasState,
        }),
      });

      if (response.ok) {
        const newWorkflow = await response.json();
        setWorkflows([newWorkflow.workflow, ...workflows]);
        toast.success('Workflow duplicated');
      } else {
        toast.error('Failed to duplicate workflow');
      }
    } catch (error) {
      toast.error('Error duplicating workflow');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Workflow Automation</h1>
              <Badge variant="secondary" className="ml-2">
                Beta
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Docs
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Templates
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar - Workflow List */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <WorkflowList
              workflows={workflows}
              onSelect={(workflow) => {
                setSelectedWorkflow(workflow);
                setActiveTab('editor');
              }}
              onCreate={handleCreateWorkflow}
              onDelete={handleDeleteWorkflow}
              onDuplicate={handleDuplicateWorkflow}
              onToggleActive={handleToggleActive}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Editor Area */}
          <ResizablePanel defaultSize={60}>
            {selectedWorkflow ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="border-b px-4">
                  <TabsList className="h-12">
                    <TabsTrigger value="editor" className="gap-2">
                      <Zap className="h-4 w-4" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="h-4 w-4" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="editor" className="flex-1 m-0 p-0">
                  <WorkflowCanvas
                    workflowId={selectedWorkflow.id}
                    initialNodes={selectedWorkflow.canvasState?.nodes || []}
                    initialEdges={selectedWorkflow.canvasState?.edges || []}
                    onSave={handleSaveWorkflow}
                    onExecute={handleExecuteWorkflow}
                  />
                </TabsContent>

                <TabsContent value="history" className="flex-1 p-4">
                  <Card className="p-8 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Execution History</h3>
                    <p className="text-sm text-muted-foreground">
                      View past executions and their results here.
                    </p>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="flex-1 p-4">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Workflow Settings</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Workflow Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          value={selectedWorkflow.name}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                          className="w-full px-3 py-2 border rounded-md"
                          rows={3}
                          value={selectedWorkflow.description || ''}
                          readOnly
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Status:</label>
                        <Badge variant={selectedWorkflow.active ? 'default' : 'secondary'}>
                          {selectedWorkflow.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Card className="p-8 text-center max-w-md">
                  <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Select a Workflow</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a workflow from the sidebar or create a new one to get started.
                  </p>
                </Card>
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Node Palette */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <NodePalette />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}