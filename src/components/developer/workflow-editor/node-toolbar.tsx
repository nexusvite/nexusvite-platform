'use client';

import React, { useState } from 'react';
import { Node } from 'reactflow';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExpressionEditor } from './expression-editor';
import { CredentialSelector } from './credential-selector';
import { Separator } from '@/components/ui/separator';

interface NodeToolbarProps {
  node: Node;
  onClose: () => void;
  onUpdate: (node: Node) => void;
  onDelete?: (nodeId: string) => void;
  availableNodes?: Node[];
  executionOutputs?: Record<string, any>;
  onRegisterExpressionEditor?: (handler: ((value: string) => void) | null) => void;
}

export function NodeToolbar({
  node,
  onClose,
  onUpdate,
  onDelete,
  availableNodes = [],
  executionOutputs = {},
  onRegisterExpressionEditor
}: NodeToolbarProps) {
  const [nodeData, setNodeData] = useState(node.data);
  const [config, setConfig] = useState(node.data.config || {});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSave = () => {
    onUpdate({
      ...node,
      data: {
        ...nodeData,
        config,
      },
    });
    toast.success('Node configuration saved');
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(node.id);
      toast.success('Node deleted');
      onClose();
    }
  };

  const renderConfigFields = () => {
    const { subType, type } = nodeData;

    // First check for specific subTypes
    if (subType) {
      switch (subType) {
      case 'webhook':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={config.method || 'POST'}
                onValueChange={(value) => setConfig({ ...config, method: value })}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">Webhook Path</Label>
              <Input
                id="path"
                value={config.path || ''}
                onChange={(e) => setConfig({ ...config, path: e.target.value })}
                placeholder="/api/webhook/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authentication">Authentication</Label>
              <Select
                value={config.authentication || 'none'}
                onValueChange={(value) => setConfig({ ...config, authentication: value })}
              >
                <SelectTrigger id="authentication">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="hmac">HMAC Signature</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'schedule':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="cron">Cron Expression</Label>
              <Input
                id="cron"
                value={config.cron || '0 0 * * *'}
                onChange={(e) => setConfig({ ...config, cron: e.target.value })}
                placeholder="0 0 * * *"
              />
              <p className="text-xs text-muted-foreground">
                Daily at midnight: 0 0 * * *
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={config.timezone || 'UTC'}
                onValueChange={(value) => setConfig({ ...config, timezone: value })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'http':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <ExpressionEditor
                value={config.url || ''}
                onChange={(value) => setConfig({ ...config, url: value })}
                placeholder="https://api.example.com/endpoint"
                availableNodes={availableNodes.map(n => ({
                  id: n.id,
                  label: n.data.label || n.id,
                  outputs: n.data.outputs || {}
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="httpMethod">Method</Label>
              <Select
                value={config.method || 'GET'}
                onValueChange={(value) => setConfig({ ...config, method: value })}
              >
                <SelectTrigger id="httpMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label>Authentication</Label>
              <Select
                value={config.authType || 'none'}
                onValueChange={(value) => setConfig({ ...config, authType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="apikey">API Key</SelectItem>
                  <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                  <SelectItem value="credential">Use Credential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.authType === 'basic' && (
              <>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <ExpressionEditor
                    value={config.authUsername || ''}
                    onChange={(value) => setConfig({ ...config, authUsername: value })}
                    placeholder="username"
                    availableNodes={availableNodes.map(n => ({
                      id: n.id,
                      label: n.data.label || n.id,
                      outputs: n.data.outputs || {}
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <ExpressionEditor
                    value={config.authPassword || ''}
                    onChange={(value) => setConfig({ ...config, authPassword: value })}
                    placeholder="password"
                    availableNodes={availableNodes.map(n => ({
                      id: n.id,
                      label: n.data.label || n.id,
                      outputs: n.data.outputs || {}
                    }))}
                  />
                </div>
              </>
            )}

            {config.authType === 'bearer' && (
              <div className="space-y-2">
                <Label>Token</Label>
                <ExpressionEditor
                  value={config.authToken || ''}
                  onChange={(value) => setConfig({ ...config, authToken: value })}
                  placeholder="Bearer token"
                  availableNodes={availableNodes.map(n => ({
                    id: n.id,
                    label: n.data.label || n.id,
                    outputs: n.data.outputs || {}
                  }))}
                />
              </div>
            )}

            {config.authType === 'apikey' && (
              <>
                <div className="space-y-2">
                  <Label>Header Name</Label>
                  <Input
                    value={config.apiKeyHeader || 'X-API-Key'}
                    onChange={(e) => setConfig({ ...config, apiKeyHeader: e.target.value })}
                    placeholder="X-API-Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <ExpressionEditor
                    value={config.apiKey || ''}
                    onChange={(value) => setConfig({ ...config, apiKey: value })}
                    placeholder="Your API key"
                    availableNodes={availableNodes.map(n => ({
                      id: n.id,
                      label: n.data.label || n.id,
                      outputs: n.data.outputs || {}
                    }))}
                  />
                </div>
              </>
            )}

            {config.authType === 'credential' && (
              <CredentialSelector
                type="http_auth"
                value={config.credentialId}
                onChange={(credId, inlineConfig) => {
                  setConfig({
                    ...config,
                    credentialId: credId,
                    authConfig: inlineConfig,
                  });
                }}
                allowInline={true}
              />
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <ExpressionEditor
                value={config.headers ? JSON.stringify(config.headers, null, 2) : ''}
                onChange={(value) => {
                  try {
                    const headers = value ? JSON.parse(value) : {};
                    setConfig({ ...config, headers });
                  } catch {}
                }}
                placeholder='{\n  "Content-Type": "application/json"\n}'
                availableNodes={availableNodes.map(n => ({
                  id: n.id,
                  label: n.data.label || n.id,
                  outputs: n.data.outputs || {}
                }))}
              />
            </div>

            {['POST', 'PUT', 'PATCH'].includes(config.method) && (
              <div className="space-y-2">
                <Label htmlFor="body">Request Body</Label>
                <ExpressionEditor
                  value={config.body || ''}
                  onChange={(value) => setConfig({ ...config, body: value })}
                  placeholder='{\n  "key": "value"\n}'
                  availableNodes={availableNodes.map(n => ({
                    id: n.id,
                    label: n.data.label || n.id,
                    outputs: n.data.outputs || {}
                  }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Response Format</Label>
              <Select
                value={config.responseFormat || 'json'}
                onValueChange={(value) => setConfig({ ...config, responseFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="binary">Binary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ignoreSSL"
                checked={config.ignoreSSL === true}
                onCheckedChange={(checked) => setConfig({ ...config, ignoreSSL: checked })}
              />
              <Label htmlFor="ignoreSSL">Ignore SSL Issues</Label>
            </div>
          </>
        );

      case 'database':
        return (
          <>
            <div className="space-y-2">
              <Label>Database Type</Label>
              <Select
                value={config.dbType || 'postgresql'}
                onValueChange={(value) => setConfig({ ...config, dbType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="mongodb">MongoDB</SelectItem>
                  <SelectItem value="sqlite">SQLite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CredentialSelector
              type={config.dbType as any || 'postgresql'}
              value={config.credentialId}
              onChange={(credId, inlineConfig) => {
                setConfig({
                  ...config,
                  credentialId: credId,
                  dbConfig: inlineConfig,
                });
              }}
              allowInline={true}
            />

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={config.operation || 'select'}
                onValueChange={(value) => setConfig({ ...config, operation: value })}
              >
                <SelectTrigger id="operation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="insert">Insert</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="custom">Custom Query</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.operation === 'custom' ? (
              <div className="space-y-2">
                <Label htmlFor="customQuery">SQL Query</Label>
                <Textarea
                  id="customQuery"
                  value={config.customQuery || ''}
                  onChange={(e) => setConfig({ ...config, customQuery: e.target.value })}
                  placeholder="SELECT * FROM users WHERE status = $1"
                  className="font-mono text-xs min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use $1, $2, etc. for parameters
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="table">Table Name</Label>
                  <ExpressionEditor
                    value={config.table || ''}
                    onChange={(value) => setConfig({ ...config, table: value })}
                    placeholder="users"
                    availableNodes={availableNodes.map(n => ({
                      id: n.id,
                      label: n.data.label || n.id,
                      outputs: n.data.outputs || {}
                    }))}
                  />
                </div>

                {config.operation === 'select' && (
                  <>
                    <div className="space-y-2">
                      <Label>Columns (comma separated, empty for all)</Label>
                      <Input
                        value={config.columns || ''}
                        onChange={(e) => setConfig({ ...config, columns: e.target.value })}
                        placeholder="id, name, email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Limit</Label>
                      <Input
                        type="number"
                        value={config.limit || ''}
                        onChange={(e) => setConfig({ ...config, limit: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="query">
                    {config.operation === 'insert' ? 'Data' : 'Where Condition'} (JSON)
                  </Label>
                  <ExpressionEditor
                    value={config.query ? JSON.stringify(config.query, null, 2) : ''}
                    onChange={(value) => {
                      try {
                        const query = value ? JSON.parse(value) : {};
                        setConfig({ ...config, query });
                      } catch {}
                    }}
                    placeholder={config.operation === 'insert' ? '{"name": "John", "email": "john@example.com"}' : '{"status": "active"}'}
                    availableNodes={availableNodes.map(n => ({
                      id: n.id,
                      label: n.data.label || n.id,
                      outputs: n.data.outputs || {}
                    }))}
                  />
                </div>
              </>
            )}
          </>
        );

      case 'email':
        return (
          <>
            <CredentialSelector
              type="smtp"
              value={config.credentialId}
              onChange={(credId, inlineConfig) => {
                setConfig({
                  ...config,
                  credentialId: credId,
                  smtpConfig: inlineConfig,
                });
              }}
              allowInline={true}
            />
            <Separator className="my-4" />
            <div className="space-y-2">
              <Label htmlFor="from">From Email</Label>
              <ExpressionEditor
                value={config.from || ''}
                onChange={(value) => setConfig({ ...config, from: value })}
                placeholder="sender@example.com"
                availableNodes={availableNodes.map(n => ({
                  id: n.id,
                  label: n.data.label || n.id,
                  outputs: n.data.outputs || {}
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Email</Label>
              <ExpressionEditor
                value={config.to || ''}
                onChange={(value) => setConfig({ ...config, to: value })}
                placeholder="recipient@example.com"
                availableNodes={availableNodes.map(n => ({
                  id: n.id,
                  label: n.data.label || n.id,
                  outputs: n.data.outputs || {}
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <ExpressionEditor
                value={config.subject || ''}
                onChange={(value) => setConfig({ ...config, subject: value })}
                placeholder="Email Subject"
                availableNodes={availableNodes.map(n => ({
                  id: n.id,
                  label: n.data.label || n.id,
                  outputs: n.data.outputs || {}
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailBody">Body</Label>
              <ExpressionEditor
                value={config.body || ''}
                onChange={(value) => setConfig({ ...config, body: value })}
                placeholder="Email body content..."
                availableNodes={availableNodes.map(n => ({
                  id: n.id,
                  label: n.data.label || n.id,
                  outputs: n.data.outputs || {}
                }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="html"
                checked={config.html !== false}
                onCheckedChange={(checked) => setConfig({ ...config, html: checked })}
              />
              <Label htmlFor="html">Send as HTML</Label>
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="field">Field to Check</Label>
              <Input
                id="field"
                value={config.field || ''}
                onChange={(e) => setConfig({ ...config, field: e.target.value })}
                placeholder="data.status"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={config.operator || 'equals'}
                onValueChange={(value) => setConfig({ ...config, operator: value })}
              >
                <SelectTrigger id="operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="notEquals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greaterThan">Greater Than</SelectItem>
                  <SelectItem value="lessThan">Less Than</SelectItem>
                  <SelectItem value="isEmpty">Is Empty</SelectItem>
                  <SelectItem value="isNotEmpty">Is Not Empty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={config.value || ''}
                onChange={(e) => setConfig({ ...config, value: e.target.value })}
                placeholder="success"
              />
            </div>
          </>
        );

      case 'code':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={config.language || 'javascript'}
                onValueChange={(value) => setConfig({ ...config, language: value })}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Textarea
                id="code"
                value={config.code || ''}
                onChange={(e) => setConfig({ ...config, code: e.target.value })}
                placeholder="// Your code here
return data;"
                className="font-mono text-xs min-h-[200px]"
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="number"
                value={config.duration || 1000}
                onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={config.unit || 'ms'}
                onValueChange={(value) => setConfig({ ...config, unit: value })}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms">Milliseconds</SelectItem>
                  <SelectItem value="s">Seconds</SelectItem>
                  <SelectItem value="m">Minutes</SelectItem>
                  <SelectItem value="h">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

        default:
          break;
      }
    }

    // If no specific subType config, use general node type config
    switch (type || node.type) {
      case 'trigger':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="triggerName">Trigger Name</Label>
              <Input
                id="triggerName"
                value={config.name || nodeData.label}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter trigger name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="triggerDescription">Description</Label>
              <Textarea
                id="triggerDescription"
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe what triggers this workflow"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoStart">Auto Start</Label>
                <Switch
                  id="autoStart"
                  checked={config.autoStart !== false}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, autoStart: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically start the workflow when triggered
              </p>
            </div>
          </>
        );

      case 'action':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="actionName">Action Name</Label>
              <Input
                id="actionName"
                value={config.name || nodeData.label}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter action name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select
                value={config.actionType || 'custom'}
                onValueChange={(value) => setConfig({ ...config, actionType: value })}
              >
                <SelectTrigger id="actionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Action</SelectItem>
                  <SelectItem value="api">API Call</SelectItem>
                  <SelectItem value="database">Database Operation</SelectItem>
                  <SelectItem value="email">Send Email</SelectItem>
                  <SelectItem value="notification">Send Notification</SelectItem>
                  <SelectItem value="transform">Transform Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionData">Action Data (JSON)</Label>
              <Textarea
                id="actionData"
                value={JSON.stringify(config.data || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value);
                    setConfig({ ...config, data });
                  } catch {}
                }}
                placeholder='{"key": "value"}'
                className="font-mono text-xs min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="continueOnError">Continue on Error</Label>
                <Switch
                  id="continueOnError"
                  checked={config.continueOnError === true}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, continueOnError: checked })
                  }
                />
              </div>
            </div>
          </>
        );

      case 'logic':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="logicType">Logic Type</Label>
              <Select
                value={config.logicType || 'condition'}
                onValueChange={(value) => setConfig({ ...config, logicType: value })}
              >
                <SelectTrigger id="logicType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="condition">If/Then Condition</SelectItem>
                  <SelectItem value="switch">Switch/Case</SelectItem>
                  <SelectItem value="loop">Loop/Iterate</SelectItem>
                  <SelectItem value="merge">Merge Branches</SelectItem>
                  <SelectItem value="filter">Filter Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expression">Logic Expression</Label>
              <Textarea
                id="expression"
                value={config.expression || ''}
                onChange={(e) => setConfig({ ...config, expression: e.target.value })}
                placeholder="e.g., data.status === 'active' && data.count > 0"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branches">Number of Branches</Label>
              <Input
                id="branches"
                type="number"
                value={config.branches || 2}
                onChange={(e) => setConfig({ ...config, branches: parseInt(e.target.value) })}
                min="2"
                max="10"
              />
            </div>
          </>
        );

      case 'transform':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="transformType">Transform Type</Label>
              <Select
                value={config.transformType || 'map'}
                onValueChange={(value) => setConfig({ ...config, transformType: value })}
              >
                <SelectTrigger id="transformType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="map">Map/Transform</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="reduce">Reduce/Aggregate</SelectItem>
                  <SelectItem value="sort">Sort</SelectItem>
                  <SelectItem value="join">Join/Merge</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                  <SelectItem value="format">Format/Convert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transformCode">Transform Code</Label>
              <Textarea
                id="transformCode"
                value={config.code || ''}
                onChange={(e) => setConfig({ ...config, code: e.target.value })}
                placeholder="// Transform function\nreturn data.map(item => ({\n  ...item,\n  processed: true\n}));"
                className="font-mono text-xs min-h-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputFormat">Output Format</Label>
              <Select
                value={config.outputFormat || 'json'}
                onValueChange={(value) => setConfig({ ...config, outputFormat: value })}
              >
                <SelectTrigger id="outputFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="text">Plain Text</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        // Generic configuration for any unknown node type
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="nodeConfig">Node Configuration</Label>
              <Textarea
                id="nodeConfig"
                value={JSON.stringify(config, null, 2)}
                onChange={(e) => {
                  try {
                    const newConfig = JSON.parse(e.target.value);
                    setConfig(newConfig);
                  } catch {}
                }}
                placeholder={'{\n  "key": "value"\n}'}
                className="font-mono text-xs min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Edit the JSON configuration for this node
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <Sheet open={!!node} onOpenChange={() => onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>Configure Node</SheetTitle>
          <SheetDescription>
            Configure the settings for this workflow node.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="label">Node Label</Label>
                <Input
                  id="label"
                  value={nodeData.label}
                  onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
                  placeholder="Enter node label"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={nodeData.description || ''}
                  onChange={(e) => setNodeData({ ...nodeData, description: e.target.value })}
                  placeholder="Enter node description"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Enabled</Label>
                  <Switch
                    id="enabled"
                    checked={nodeData.enabled !== false}
                    onCheckedChange={(checked) =>
                      setNodeData({ ...nodeData, enabled: checked })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 p-4 bg-muted/30 rounded-lg">
              {renderConfigFields()}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Node ID</span>
                    <Badge variant="outline">{node.id}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Node Type</span>
                    <Badge variant="secondary">{node.type}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sub Type</span>
                    <Badge variant="secondary">{nodeData.subType}</Badge>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="retryCount">Retry Count</Label>
                <Input
                  id="retryCount"
                  type="number"
                  value={config.retryCount || 0}
                  onChange={(e) =>
                    setConfig({ ...config, retryCount: parseInt(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={config.timeout || 30000}
                  onChange={(e) =>
                    setConfig({ ...config, timeout: parseInt(e.target.value) })
                  }
                  placeholder="30000"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6 mt-6 border-t">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Node
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Node</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this node? This action cannot be undone.
                    All connections to this node will also be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}