'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { WorkflowCanvas } from '@/components/developer/workflow-editor/workflow-canvas';
import { NodePalette } from '@/components/developer/workflow-editor/node-palette';
import { MotiaStatus } from '@/components/developer/workflow-editor/motia-status';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Play,
  Download,
  Upload,
  Settings,
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

export default function WorkflowEditorPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.workflowId as string;

  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [motiaSynced, setMotiaSynced] = useState(false);

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow();
    }
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/developer/workflows/${workflowId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
      } else {
        toast.error('Failed to fetch workflow');
        router.push('/developer/workflows');
      }
    } catch (error) {
      toast.error('Error fetching workflow');
      router.push('/developer/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkflow = async (nodes: any[], edges: any[]) => {
    if (!workflow) return;

    setSaving(true);
    const canvasState = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    try {
      const response = await fetch(`/api/developer/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canvasState }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
        setMotiaSynced(data.motiaSynced || false);
        toast.success(
          data.motiaSynced
            ? 'Workflow saved and synced with Motia'
            : 'Workflow saved successfully'
        );
      } else {
        toast.error('Failed to save workflow');
      }
    } catch (error) {
      toast.error('Error saving workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!workflow) return;

    setExecuting(true);
    try {
      const response = await fetch(`/api/developer/workflows/${workflowId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Workflow execution started');
      } else {
        toast.error('Failed to execute workflow');
      }
    } catch (error) {
      toast.error('Error executing workflow');
    } finally {
      setExecuting(false);
    }
  };


  const handleExportWorkflow = () => {
    if (!workflow) return;

    const exportData = {
      name: workflow.name,
      description: workflow.description,
      canvasState: workflow.canvasState,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `workflow_${workflow.name.replace(/\s+/g, '_')}_${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Workflow exported successfully');
  };

  const handleImportWorkflow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      try {
        const importData = JSON.parse(text);
        if (importData.canvasState) {
          handleSaveWorkflow(
            importData.canvasState.nodes || [],
            importData.canvasState.edges || []
          );
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Workflow not found</p>
          <Button onClick={() => router.push('/developer/workflows')}>
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/developer/workflows')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{workflow.name}</h1>
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
            </div>
            <Badge variant={workflow.active ? 'default' : 'secondary'}>
              {workflow.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/developer/workflows/${workflowId}/settings`)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImportWorkflow}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportWorkflow}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteWorkflow}
              disabled={executing}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {executing ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Canvas Editor */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={80}>
            <WorkflowCanvas
              workflowId={workflow.id}
              initialNodes={workflow.canvasState?.nodes || []}
              initialEdges={workflow.canvasState?.edges || []}
              onSave={handleSaveWorkflow}
              onExecute={handleExecuteWorkflow}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <NodePalette />
                <MotiaStatus
                  workflowId={workflow.id}
                  workflowName={workflow.name}
                  isSynced={motiaSynced}
                  onSync={async () => {
                    if (workflow.canvasState?.nodes && workflow.canvasState?.edges) {
                      await handleSaveWorkflow(
                        workflow.canvasState.nodes,
                        workflow.canvasState.edges
                      );
                    }
                  }}
                />
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}