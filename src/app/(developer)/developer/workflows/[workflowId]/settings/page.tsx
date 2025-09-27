'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Settings,
  Webhook,
  Calendar,
  Play,
  Zap,
  Shield,
  Bell,
  Trash2,
  Edit,
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
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default function WorkflowSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.workflowId as string;

  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

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

  const handleSaveSettings = async () => {
    if (!workflow) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/developer/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          active: workflow.active,
          triggerType: workflow.triggerType,
          schedule: workflow.schedule,
          webhookPath: workflow.webhookPath,
          settings: workflow.settings,
        }),
      });

      if (response.ok) {
        const updatedWorkflow = await response.json();
        setWorkflow(updatedWorkflow.workflow);
        toast.success('Workflow settings saved');
      } else {
        toast.error('Failed to save workflow settings');
      }
    } catch (error) {
      toast.error('Error saving workflow settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/developer/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Workflow deleted successfully');
        router.push('/developer/workflows');
      } else {
        toast.error('Failed to delete workflow');
      }
    } catch (error) {
      toast.error('Error deleting workflow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow settings...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/developer/workflows')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflow Settings</h1>
            <p className="text-muted-foreground">
              Manage settings and configuration for {workflow.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/developer/workflows/${workflowId}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Workflow
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic details of your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={workflow.name}
                  onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                  placeholder="Enter workflow name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={workflow.description || ''}
                  onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Enable or disable this workflow
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={workflow.active}
                    onCheckedChange={(checked) => setWorkflow({ ...workflow, active: checked })}
                  />
                  <Badge variant={workflow.active ? 'default' : 'secondary'}>
                    {workflow.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Workflow ID</Label>
                <div className="flex items-center gap-2">
                  <Input value={workflow.id} disabled className="font-mono" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(workflow.id);
                      toast.success('Workflow ID copied');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Created</Label>
                  <Input
                    value={new Date(workflow.createdAt).toLocaleDateString()}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <Input
                    value={new Date(workflow.updatedAt).toLocaleDateString()}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Triggers</CardTitle>
              <CardDescription>
                Configure how this workflow gets triggered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select
                  value={workflow.triggerType || 'manual'}
                  onValueChange={(value) => setWorkflow({ ...workflow, triggerType: value })}
                >
                  <SelectTrigger id="triggerType">
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Manual Trigger
                      </div>
                    </SelectItem>
                    <SelectItem value="webhook">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4" />
                        Webhook
                      </div>
                    </SelectItem>
                    <SelectItem value="schedule">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Schedule
                      </div>
                    </SelectItem>
                    <SelectItem value="event">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Event-based
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {workflow.triggerType === 'webhook' && (
                <div className="space-y-2">
                  <Label htmlFor="webhookPath">Webhook Path</Label>
                  <Input
                    id="webhookPath"
                    value={workflow.webhookPath || ''}
                    onChange={(e) => setWorkflow({ ...workflow, webhookPath: e.target.value })}
                    placeholder="/webhook/my-workflow"
                  />
                  <p className="text-sm text-muted-foreground">
                    Full URL: {`${window.location.origin}/api/workflows/webhook${workflow.webhookPath}`}
                  </p>
                </div>
              )}

              {workflow.triggerType === 'schedule' && (
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule (Cron Expression)</Label>
                  <Input
                    id="schedule"
                    value={workflow.schedule || ''}
                    onChange={(e) => setWorkflow({ ...workflow, schedule: e.target.value })}
                    placeholder="0 0 * * *"
                  />
                  <p className="text-sm text-muted-foreground">
                    Use cron expression format (e.g., "0 0 * * *" for daily at midnight)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions & Access</CardTitle>
              <CardDescription>
                Control who can access and execute this workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow this workflow to be triggered via API
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Team Access</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow team members to view and run this workflow
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Access</Label>
                  <div className="text-sm text-muted-foreground">
                    Make this workflow publicly accessible
                  </div>
                </div>
                <Switch disabled />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Execution Limits</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Max Executions per Hour</Label>
                    <Input type="number" placeholder="100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Timeout (seconds)</Label>
                    <Input type="number" placeholder="300" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure when and how you receive notifications about this workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Success Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Notify when workflow completes successfully
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Error Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Notify when workflow encounters an error
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Warning Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Notify when workflow has warnings or issues
                  </div>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Notification Channels</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="email" className="rounded" />
                    <Label htmlFor="email" className="cursor-pointer">
                      Email Notifications
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="slack" className="rounded" />
                    <Label htmlFor="slack" className="cursor-pointer">
                      Slack Notifications
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="webhook-notify" className="rounded" />
                    <Label htmlFor="webhook-notify" className="cursor-pointer">
                      Webhook Notifications
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete this workflow</p>
              <p className="text-sm text-muted-foreground">
                Once deleted, this workflow cannot be recovered
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkflow}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}