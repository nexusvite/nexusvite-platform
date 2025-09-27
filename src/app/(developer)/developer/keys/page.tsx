'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Key,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  RotateCw,
  Shield,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  key?: string;
  prefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  scopes: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_SCOPES = [
  { id: 'read:entities', label: 'Read Entities', description: 'View entity data' },
  { id: 'write:entities', label: 'Write Entities', description: 'Create and modify entities' },
  { id: 'delete:entities', label: 'Delete Entities', description: 'Delete entities' },
  { id: 'read:webhooks', label: 'Read Webhooks', description: 'View webhook configurations' },
  { id: 'write:webhooks', label: 'Write Webhooks', description: 'Create and modify webhooks' },
  { id: 'read:integrations', label: 'Read Integrations', description: 'View integration settings' },
  { id: 'write:integrations', label: 'Write Integrations', description: 'Configure integrations' },
  { id: 'admin', label: 'Admin Access', description: 'Full administrative access' },
];

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [selectedTab, setSelectedTab] = useState('keys');
  const [keyVisibility, setKeyVisibility] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expiresIn: 'never',
    scopes: [] as string[],
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/developer/keys');
      const data = await response.json();

      if (response.ok) {
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const response = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedKey(data.key);
        setShowKeyDialog(true);
        setShowCreateDialog(false);
        fetchApiKeys();

        // Reset form
        setFormData({
          name: '',
          description: '',
          expiresIn: 'never',
          scopes: [],
        });

        toast({
          title: 'Success',
          description: 'API key created successfully',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/developer/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchApiKeys();
        toast({
          title: 'Success',
          description: 'API key deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive',
      });
    }
  };

  const handleToggleKey = async (keyId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/developer/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });

      if (response.ok) {
        fetchApiKeys();
        toast({
          title: 'Success',
          description: `API key ${active ? 'activated' : 'deactivated'} successfully`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update API key',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'API key copied to clipboard',
    });
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for secure programmatic access
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for programmatic access to your resources.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="Production API Key"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this key"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Expiration</Label>
                <Select
                  value={formData.expiresIn}
                  onValueChange={(value) => setFormData({ ...formData, expiresIn: value })}
                >
                  <SelectTrigger id="expires">
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                    <SelectItem value="90d">90 days</SelectItem>
                    <SelectItem value="1y">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={scope.id}
                        checked={formData.scopes.includes(scope.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              scopes: [...formData.scopes, scope.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              scopes: formData.scopes.filter((s) => s !== scope.id),
                            });
                          }
                        }}
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor={scope.id} className="font-medium">
                          {scope.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {scope.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateKey}>
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="keys" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Activity className="h-4 w-4 mr-2" />
            Usage Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiKeys.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {apiKeys.filter((k) => k.active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  API Calls Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          {/* API Keys Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Manage your API keys and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No API keys created yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{apiKey.name}</p>
                            {apiKey.description && (
                              <p className="text-sm text-muted-foreground">
                                {apiKey.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {apiKey.prefix}...
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(apiKey.key || '')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={apiKey.active ? 'default' : 'secondary'}
                          >
                            {apiKey.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(apiKey.lastUsedAt)}</TableCell>
                        <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Switch
                              checked={apiKey.active}
                              onCheckedChange={(checked) =>
                                handleToggleKey(apiKey.id, checked)
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteKey(apiKey.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Analytics</CardTitle>
              <CardDescription>
                Monitor your API key usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Usage analytics coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Settings</CardTitle>
              <CardDescription>
                Configure global settings for API key management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require API Key for All Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce API key authentication for all API endpoints
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-expire Keys</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically expire keys after 90 days of inactivity
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Whitelisting</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict API key usage to specific IP addresses
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all">{generatedKey}</code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Store this key in a secure location. For security reasons, we only display it once.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>
              I've Copied the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}