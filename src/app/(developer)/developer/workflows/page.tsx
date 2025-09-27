'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  History,
  Settings,
  Workflow,
  Calendar,
  Webhook,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  triggerType?: string;
  schedule?: string;
  webhookPath?: string;
  createdAt: Date;
  updatedAt: Date;
  executionCount?: number;
  lastExecutedAt?: Date;
  status?: 'idle' | 'running' | 'error';
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowData | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);

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

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name) {
      toast.error('Please enter a workflow name');
      return;
    }

    try {
      const response = await fetch('/api/developer/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflow),
      });

      if (response.ok) {
        const data = await response.json();
        setNewWorkflow({ name: '', description: '' });
        setCreateDialogOpen(false);
        toast.success('Workflow created successfully');
        // Navigate to the editor
        router.push(`/developer/workflows/${data.workflow.id}/edit`);
      } else {
        toast.error('Failed to create workflow');
      }
    } catch (error) {
      toast.error('Error creating workflow');
    }
  };

  const handleSettingsWorkflow = (workflowId: string) => {
    router.push(`/developer/workflows/${workflowId}/settings`);
  };

  const handleToggleActive = async (workflow: WorkflowData) => {
    try {
      const response = await fetch(`/api/developer/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !workflow.active }),
      });

      if (response.ok) {
        fetchWorkflows();
        toast.success(`Workflow ${!workflow.active ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      toast.error('Failed to update workflow');
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    try {
      const response = await fetch(`/api/developer/workflows/${workflowToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchWorkflows();
        toast.success('Workflow deleted');
        setDeleteDialogOpen(false);
        setWorkflowToDelete(null);
      } else {
        toast.error('Failed to delete workflow');
      }
    } catch (error) {
      toast.error('Error deleting workflow');
    }
  };

  const openDeleteDialog = (workflow: WorkflowData) => {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  };

  const handleDuplicateWorkflow = async (workflow: WorkflowData) => {
    try {
      const response = await fetch('/api/developer/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
        }),
      });

      if (response.ok) {
        fetchWorkflows();
        toast.success('Workflow duplicated');
      }
    } catch (error) {
      toast.error('Error duplicating workflow');
    }
  };

  const getTriggerIcon = (triggerType?: string) => {
    switch (triggerType) {
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'manual':
        return <Play className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflow Automation</h1>
        <p className="text-muted-foreground">
          Build and manage automated workflows to streamline your processes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows..."
            className="pl-10"
          />
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Create a new workflow to automate your tasks and processes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newWorkflow.name}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, name: e.target.value })
                  }
                  placeholder="My Workflow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newWorkflow.description}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, description: e.target.value })
                  }
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows Grid */}
      {loading ? (
        <div className="text-center py-12">Loading workflows...</div>
      ) : filteredWorkflows.length === 0 ? (
        <Card className="p-12 text-center">
          <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No workflows yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first workflow to start automating tasks.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTriggerIcon(workflow.triggerType)}
                    <Badge variant={workflow.active ? 'default' : 'secondary'}>
                      {workflow.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSettingsWorkflow(workflow.id)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/developer/workflows/${workflow.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Workflow
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(workflow)}>
                        {workflow.active ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateWorkflow(workflow)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(workflow)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="line-clamp-1">{workflow.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {workflow.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Switch
                      checked={workflow.active}
                      onCheckedChange={() => handleToggleActive(workflow)}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Created: {format(new Date(workflow.createdAt), 'MMM d, yyyy')}
                    </div>
                    {workflow.lastExecutedAt && (
                      <div>
                        Last run: {format(new Date(workflow.lastExecutedAt), 'MMM d, h:mm a')}
                      </div>
                    )}
                    {workflow.executionCount !== undefined && (
                      <div>
                        Executions: {workflow.executionCount}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSettingsWorkflow(workflow.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/developer/workflows/${workflow.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Workflow
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setWorkflowToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkflow}
            >
              Delete Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}