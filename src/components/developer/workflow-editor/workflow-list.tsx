'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  FileJson,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Workflow {
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

interface WorkflowListProps {
  workflows: Workflow[];
  onSelect: (workflow: Workflow) => void;
  onCreate: (data: { name: string; description: string }) => void;
  onDelete?: (workflowId: string) => void;
  onDuplicate?: (workflowId: string) => void;
  onToggleActive?: (workflowId: string, active: boolean) => void;
}

export function WorkflowList({
  workflows,
  onSelect,
  onCreate,
  onDelete,
  onDuplicate,
  onToggleActive,
}: WorkflowListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });

  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newWorkflow.name) {
      toast.error('Please enter a workflow name');
      return;
    }
    onCreate(newWorkflow);
    setNewWorkflow({ name: '', description: '' });
    setCreateDialogOpen(false);
    toast.success('Workflow created successfully');
  };

  const handleToggle = (workflow: Workflow) => {
    if (onToggleActive) {
      onToggleActive(workflow.id, !workflow.active);
      toast.success(`Workflow ${!workflow.active ? 'activated' : 'deactivated'}`);
    }
  };

  const handleDelete = (workflow: Workflow) => {
    if (onDelete) {
      onDelete(workflow.id);
      toast.success('Workflow deleted');
    }
  };

  const handleDuplicate = (workflow: Workflow) => {
    if (onDuplicate) {
      onDuplicate(workflow.id);
      toast.success('Workflow duplicated');
    }
  };

  const getTriggerBadgeColor = (triggerType?: string) => {
    switch (triggerType) {
      case 'webhook':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'schedule':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'manual':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'event':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Workflows</h2>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Workflow
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
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredWorkflows.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No workflows yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first workflow to start automating tasks.
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Workflow
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelect(workflow)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{workflow.name}</h3>
                      {workflow.active ? (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      {workflow.triggerType && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTriggerBadgeColor(
                            workflow.triggerType
                          )}`}
                        >
                          {workflow.triggerType}
                        </Badge>
                      )}
                    </div>

                    {workflow.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {workflow.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Updated {format(new Date(workflow.updatedAt), 'MMM d, yyyy')}
                      </span>
                      {workflow.executionCount !== undefined && (
                        <span>
                          {workflow.executionCount} execution
                          {workflow.executionCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {workflow.lastExecutedAt && (
                        <span>
                          Last run{' '}
                          {format(new Date(workflow.lastExecutedAt), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(workflow);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(workflow);
                        }}
                      >
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(workflow);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // View history
                        }}
                      >
                        <History className="mr-2 h-4 w-4" />
                        View History
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open settings
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(workflow);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}