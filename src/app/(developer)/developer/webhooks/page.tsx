'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Webhook,
  Edit2,
  Trash2,
  Copy,
  RefreshCw,
  Send,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Key,
  Globe,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { id: 'entity.created', name: 'Entity Created', description: 'Triggered when a new entity is created' },
  { id: 'entity.updated', name: 'Entity Updated', description: 'Triggered when an entity is updated' },
  { id: 'entity.deleted', name: 'Entity Deleted', description: 'Triggered when an entity is deleted' },
  { id: 'data.created', name: 'Data Created', description: 'Triggered when new data is added to an entity' },
  { id: 'data.updated', name: 'Data Updated', description: 'Triggered when data is updated' },
  { id: 'data.deleted', name: 'Data Deleted', description: 'Triggered when data is deleted' },
  { id: 'user.signup', name: 'User Signup', description: 'Triggered when a new user signs up' },
  { id: 'user.signin', name: 'User Sign In', description: 'Triggered when a user signs in' },
  { id: 'api.request', name: 'API Request', description: 'Triggered on API requests' },
];

interface Webhook {
  id: string;
  name: string;
  description?: string;
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  statusCode?: string;
  request: any;
  response?: any;
  error?: string;
  duration?: string;
  createdAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    secret: '',
    events: [] as string[],
    headers: {} as Record<string, string>,
    active: true,
  });

  const [newHeader, setNewHeader] = useState({ key: '', value: '' });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  useEffect(() => {
    if (selectedWebhook) {
      fetchWebhookLogs(selectedWebhook.id);
    }
  }, [selectedWebhook]);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/developer/webhooks');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
        if (data.webhooks?.length > 0 && !selectedWebhook) {
          setSelectedWebhook(data.webhooks[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    }
  };

  const fetchWebhookLogs = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/developer/webhooks/${webhookId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setWebhookLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    }
  };

  const handleCreateWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/developer/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Webhook created',
          description: 'Your webhook has been created successfully.',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchWebhooks();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!editingWebhook) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/developer/webhooks/${editingWebhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Webhook updated',
          description: 'Your webhook has been updated successfully.',
        });
        setEditingWebhook(null);
        resetForm();
        fetchWebhooks();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhook: Webhook) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/developer/webhooks/${webhook.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Webhook deleted',
          description: 'The webhook has been deleted successfully.',
        });
        if (selectedWebhook?.id === webhook.id) {
          setSelectedWebhook(null);
        }
        fetchWebhooks();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/developer/webhooks/${webhook.id}/test`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Test sent',
          description: `Test webhook sent. Status: ${data.status}`,
        });
        fetchWebhookLogs(webhook.id);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to test webhook',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWebhook = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/developer/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !webhook.active }),
      });

      if (response.ok) {
        toast({
          title: webhook.active ? 'Webhook deactivated' : 'Webhook activated',
          description: `The webhook has been ${webhook.active ? 'deactivated' : 'activated'}.`,
        });
        fetchWebhooks();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle webhook',
        variant: 'destructive',
      });
    }
  };

  const handleAddHeader = () => {
    if (newHeader.key && newHeader.value) {
      setFormData({
        ...formData,
        headers: {
          ...formData.headers,
          [newHeader.key]: newHeader.value,
        },
      });
      setNewHeader({ key: '', value: '' });
    }
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({ ...formData, headers: newHeaders });
  };

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const generateSecret = () => {
    const secret = `whsec_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;
    setFormData({ ...formData, secret });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      secret: '',
      events: [],
      headers: {},
      active: true,
    });
    setNewHeader({ key: '', value: '' });
  };

  const startEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      description: webhook.description || '',
      url: webhook.url,
      secret: webhook.secret || '',
      events: webhook.events,
      headers: webhook.headers || {},
      active: webhook.active,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks to receive real-time notifications about events
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Webhook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    type="password"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    placeholder="Optional secret for signing"
                  />
                  <Button type="button" variant="outline" onClick={generateSecret}>
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Events</Label>
                <ScrollArea className="h-48 border rounded-md p-4">
                  <div className="space-y-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <div key={event.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={event.id}
                          checked={formData.events.includes(event.id)}
                          onCheckedChange={() => handleEventToggle(event.id)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={event.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {event.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Custom Headers</Label>
                <div className="space-y-2">
                  {Object.entries(formData.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input value={key} disabled className="flex-1" />
                      <Input value={value} disabled className="flex-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHeader(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Header name"
                      value={newHeader.key}
                      onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={newHeader.value}
                      onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddHeader}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webhooks List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configured Webhooks</CardTitle>
              <CardDescription>
                {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {webhooks.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No webhooks configured yet
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {webhooks.map((webhook) => (
                      <Card
                        key={webhook.id}
                        className={`cursor-pointer transition-colors ${
                          selectedWebhook?.id === webhook.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedWebhook(webhook)}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Webhook className="h-4 w-4" />
                                <h3 className="font-semibold text-sm">{webhook.name}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {webhook.url}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={webhook.active ? 'default' : 'secondary'}>
                                  {webhook.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {webhook.events.length} event{webhook.events.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={webhook.active}
                              onCheckedChange={() => handleToggleWebhook(webhook)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Details */}
        <div className="lg:col-span-2">
          {selectedWebhook ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedWebhook.name}</CardTitle>
                    <CardDescription>{selectedWebhook.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(selectedWebhook)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                    <Dialog open={!!editingWebhook} onOpenChange={(open) => !open && setEditingWebhook(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(selectedWebhook)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Webhook</DialogTitle>
                          <DialogDescription>
                            Update webhook configuration
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="My Webhook"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Optional description"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-url">Endpoint URL</Label>
                            <Input
                              id="edit-url"
                              type="url"
                              value={formData.url}
                              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                              placeholder="https://example.com/webhook"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-secret">Secret Key</Label>
                            <div className="flex gap-2">
                              <Input
                                id="edit-secret"
                                type="password"
                                value={formData.secret}
                                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                                placeholder="Optional secret for signing"
                              />
                              <Button type="button" variant="outline" onClick={generateSecret}>
                                <Key className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Events</Label>
                            <ScrollArea className="h-48 border rounded-md p-4">
                              <div className="space-y-2">
                                {WEBHOOK_EVENTS.map((event) => (
                                  <div key={event.id} className="flex items-start space-x-2">
                                    <Checkbox
                                      id={`edit-${event.id}`}
                                      checked={formData.events.includes(event.id)}
                                      onCheckedChange={() => handleEventToggle(event.id)}
                                    />
                                    <div className="flex-1">
                                      <Label
                                        htmlFor={`edit-${event.id}`}
                                        className="text-sm font-medium cursor-pointer"
                                      >
                                        {event.name}
                                      </Label>
                                      <p className="text-xs text-muted-foreground">
                                        {event.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-active"
                              checked={formData.active}
                              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                            <Label htmlFor="edit-active">Active</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingWebhook(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateWebhook} disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Update Webhook'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteWebhook(selectedWebhook)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Endpoint URL</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded text-sm">
                          {selectedWebhook.url}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedWebhook.url);
                            toast({
                              title: 'Copied',
                              description: 'URL copied to clipboard',
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedWebhook.secret && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Secret Key</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-sm">
                            {selectedWebhook.secret.replace(/./g, '•')}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedWebhook.secret || '');
                              toast({
                                title: 'Copied',
                                description: 'Secret copied to clipboard',
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Subscribed Events</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedWebhook.events.map((eventId) => {
                          const event = WEBHOOK_EVENTS.find(e => e.id === eventId);
                          return (
                            <Badge key={eventId} variant="secondary">
                              {event?.name || eventId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {selectedWebhook.headers && Object.keys(selectedWebhook.headers).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Custom Headers</Label>
                        <div className="space-y-1">
                          {Object.entries(selectedWebhook.headers).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              <code className="font-medium">{key}:</code>
                              <code className="text-muted-foreground">{value}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Created</Label>
                        <p className="text-sm">
                          {new Date(selectedWebhook.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Last Updated</Label>
                        <p className="text-sm">
                          {new Date(selectedWebhook.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="logs">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Recent webhook deliveries
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchWebhookLogs(selectedWebhook.id)}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </Button>
                      </div>

                      {webhookLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-8 w-8 mx-auto mb-2" />
                          <p>No delivery attempts yet</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Status Code</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {webhookLogs.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(log.status)}
                                      {getStatusBadge(log.status)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {log.event}
                                  </TableCell>
                                  <TableCell>
                                    {log.statusCode || '-'}
                                  </TableCell>
                                  <TableCell>
                                    {log.duration ? `${log.duration}ms` : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(log.createdAt).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-[600px]">
                <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a webhook to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}