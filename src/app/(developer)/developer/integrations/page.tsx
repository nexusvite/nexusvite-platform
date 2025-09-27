'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Settings,
  Shield,
  Database,
  Mail,
  Globe,
  Key,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  TestTube,
  Zap,
  MessageSquare,
  Link,
  Server,
  Cloud,
} from 'lucide-react';
import { toast } from 'sonner';
import { credentialTypes, CredentialType } from '@/core/database/schemas/workflow-credentials';

interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  description?: string;
  config: Record<string, any>;
  isGlobal: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  workflowCount?: number;
}

interface IntegrationStats {
  total: number;
  active: number;
  byType: Record<string, number>;
}

export default function IntegrationsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState<IntegrationStats>({
    total: 0,
    active: 0,
    byType: {},
  });
  const [newCredential, setNewCredential] = useState<{
    name: string;
    type: CredentialType | '';
    description: string;
    config: Record<string, any>;
    isGlobal: boolean;
  }>({
    name: '',
    type: '',
    description: '',
    config: {},
    isGlobal: false,
  });

  // Fetch credentials on mount
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/developer/credentials');
      if (response.ok) {
        const data = await response.json();
        const creds = data.credentials || [];
        setCredentials(creds);

        // Calculate stats
        const stats: IntegrationStats = {
          total: creds.length,
          active: creds.filter((c: Credential) => c.workflowCount && c.workflowCount > 0).length,
          byType: {},
        };

        creds.forEach((c: Credential) => {
          stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
        });

        setStats(stats);
      } else {
        // For now, use mock data if API doesn't exist yet
        const mockCredentials: Credential[] = [
          {
            id: 'cred_1',
            name: 'Production SMTP',
            type: 'smtp',
            description: 'Main email server for production',
            config: { host: 'smtp.gmail.com', port: 587, user: 'noreply@example.com' },
            isGlobal: true,
            userId: 'user_1',
            createdAt: new Date(),
            updatedAt: new Date(),
            workflowCount: 5,
          },
          {
            id: 'cred_2',
            name: 'PostgreSQL Production',
            type: 'postgresql',
            description: 'Main production database',
            config: { host: 'db.example.com', port: 5432, database: 'production' },
            isGlobal: true,
            userId: 'user_1',
            createdAt: new Date(),
            updatedAt: new Date(),
            workflowCount: 3,
          },
          {
            id: 'cred_3',
            name: 'OpenAI API',
            type: 'openai',
            description: 'OpenAI API for AI features',
            config: { apiKey: 'sk-...', organization: 'org-...' },
            isGlobal: false,
            userId: 'user_1',
            createdAt: new Date(),
            updatedAt: new Date(),
            workflowCount: 2,
          },
        ];
        setCredentials(mockCredentials);
        setStats({
          total: mockCredentials.length,
          active: mockCredentials.filter(c => c.workflowCount && c.workflowCount > 0).length,
          byType: { smtp: 1, postgresql: 1, openai: 1 },
        });
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredential = async () => {
    if (!newCredential.name || !newCredential.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Validate required fields for the credential type
      const credType = credentialTypes[newCredential.type as CredentialType];
      const requiredFields = credType.fields.filter(f => f.required);

      for (const field of requiredFields) {
        if (!newCredential.config[field.key]) {
          toast.error(`${field.label} is required`);
          return;
        }
      }

      const credential: Credential = {
        id: `cred_${Date.now()}`,
        name: newCredential.name,
        type: newCredential.type as CredentialType,
        description: newCredential.description,
        config: newCredential.config,
        isGlobal: newCredential.isGlobal,
        userId: 'user_1', // Would come from auth
        createdAt: new Date(),
        updatedAt: new Date(),
        workflowCount: 0,
      };

      // In production, this would be an API call
      setCredentials([credential, ...credentials]);
      setIsCreating(false);
      setNewCredential({
        name: '',
        type: '',
        description: '',
        config: {},
        isGlobal: false,
      });
      toast.success('Integration added successfully');
    } catch (error) {
      toast.error('Failed to add integration');
    }
  };

  const handleTestCredential = async (credential: Credential) => {
    toast.info(`Testing ${credential.type} connection...`);

    // Simulate test based on credential type
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        toast.success(`${credential.name} connection successful!`);
      } else {
        toast.error(`Failed to connect to ${credential.name}`);
      }
    }, 1500);
  };

  const handleDeleteCredential = async () => {
    if (!credentialToDelete) return;

    const credential = credentials.find(c => c.id === credentialToDelete);
    if (credential?.workflowCount && credential.workflowCount > 0) {
      toast.error('Cannot delete credential in use by workflows');
      setDeleteDialogOpen(false);
      return;
    }

    setCredentials(credentials.filter(c => c.id !== credentialToDelete));
    toast.success('Integration deleted');
    setDeleteDialogOpen(false);
    setCredentialToDelete(null);
  };

  const renderCredentialField = (field: any, values: Record<string, any>, onChange: (key: string, value: any) => void) => {
    const value = values[field.key] || field.default || '';

    // Check field condition
    if (field.condition) {
      const [condKey, condValue] = field.condition.split(':');
      if (values[condKey] !== condValue) {
        return null;
      }
    }

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.type}
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'password':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <div className="relative">
              <Input
                id={field.key}
                type={showPassword[field.key] ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword({ ...showPassword, [field.key]: !showPassword[field.key] })}
              >
                {showPassword[field.key] ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              value={value}
              onChange={(e) => onChange(field.key, parseInt(e.target.value))}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={field.key} className="flex items-center justify-between space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Switch
              id={field.key}
              checked={value}
              onCheckedChange={(checked) => onChange(field.key, checked)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Select value={value} onValueChange={(v) => onChange(field.key, v)}>
              <SelectTrigger id={field.key}>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  const getCredentialIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      smtp: Mail,
      postgresql: Database,
      mysql: Database,
      mongodb: Database,
      http_auth: Globe,
      openai: Zap,
      slack: MessageSquare,
    };
    return iconMap[type] || Key;
  };

  const getCredentialsByType = (type?: string) => {
    if (!type || type === 'all') return credentials;
    return credentials.filter(c => c.type === type);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
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
              <Link className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Global Integrations</h1>
              <Badge variant="outline" className="ml-2">
                {stats.total} Total
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Integration</DialogTitle>
                  <DialogDescription>
                    Configure a new integration that can be used across all workflows
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cred-name">Integration Name</Label>
                      <Input
                        id="cred-name"
                        value={newCredential.name}
                        onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                        placeholder="My Integration"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cred-type">Type</Label>
                      <Select
                        value={newCredential.type}
                        onValueChange={(v) => setNewCredential({ ...newCredential, type: v as CredentialType, config: {} })}
                      >
                        <SelectTrigger id="cred-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(credentialTypes).map(([key, type]) => {
                            const Icon = getCredentialIcon(key);
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{type.name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cred-desc">Description</Label>
                    <Input
                      id="cred-desc"
                      value={newCredential.description}
                      onChange={(e) => setNewCredential({ ...newCredential, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-global">Make this integration global</Label>
                    <Switch
                      id="is-global"
                      checked={newCredential.isGlobal}
                      onCheckedChange={(checked) => setNewCredential({ ...newCredential, isGlobal: checked })}
                    />
                  </div>

                  {newCredential.type && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium">Configuration</h4>
                      {credentialTypes[newCredential.type as CredentialType].fields.map((field) =>
                        renderCredentialField(
                          field,
                          newCredential.config,
                          (key, val) => setNewCredential({
                            ...newCredential,
                            config: { ...newCredential.config, [key]: val }
                          })
                        )
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCredential}>
                    Create Integration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Integrations
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                API Services
              </CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byType.openai || 0 + stats.byType.http_auth || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Databases
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.byType.postgresql || 0) + (stats.byType.mysql || 0) + (stats.byType.mongodb || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="smtp">Email</TabsTrigger>
            <TabsTrigger value="database">Databases</TabsTrigger>
            <TabsTrigger value="api">APIs</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getCredentialsByType('all').map((credential) => {
                const Icon = getCredentialIcon(credential.type);
                return (
                  <Card key={credential.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          {credential.name}
                        </CardTitle>
                        <div className="flex gap-1">
                          {credential.isGlobal && (
                            <Badge variant="secondary">Global</Badge>
                          )}
                          {credential.workflowCount && credential.workflowCount > 0 ? (
                            <Badge variant="default">{credential.workflowCount} workflows</Badge>
                          ) : (
                            <Badge variant="outline">Unused</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        {credential.description || credentialTypes[credential.type].name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{credentialTypes[credential.type].name}</span>
                        </div>
                        {credential.config.host && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Host:</span>
                            <span className="font-medium">{credential.config.host}</span>
                          </div>
                        )}
                        {credential.config.user && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">User:</span>
                            <span className="font-medium">{credential.config.user}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleTestCredential(credential)}
                        >
                          <TestTube className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCredentialToDelete(credential.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="smtp" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getCredentialsByType('smtp').map((credential) => {
                const Icon = Mail;
                return (
                  <Card key={credential.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {credential.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SMTP Host:</span>
                          <span>{credential.config.host}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Port:</span>
                          <span>{credential.config.port}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {credentials.filter(c => ['postgresql', 'mysql', 'mongodb'].includes(c.type)).map((credential) => {
                const Icon = Database;
                return (
                  <Card key={credential.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {credential.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{credentialTypes[credential.type].name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Host:</span>
                          <span>{credential.config.host || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this integration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCredential}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}