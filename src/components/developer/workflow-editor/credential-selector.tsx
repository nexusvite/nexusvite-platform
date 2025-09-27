'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Settings, Key, Shield, Globe, Database, Mail } from 'lucide-react';
import { credentialTypes, CredentialType } from '@/core/database/schemas/workflow-credentials';
import { toast } from 'sonner';

interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  config?: Record<string, any>;
}

interface CredentialSelectorProps {
  type: CredentialType;
  value?: string;
  onChange: (credentialId: string | null, config?: Record<string, any>) => void;
  allowInline?: boolean;
}

export function CredentialSelector({
  type,
  value,
  onChange,
  allowInline = true,
}: CredentialSelectorProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [useInlineConfig, setUseInlineConfig] = useState(!value && allowInline);
  const [inlineConfig, setInlineConfig] = useState<Record<string, any>>({});
  const [newCredential, setNewCredential] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load credentials for this type
    loadCredentials();
  }, [type]);

  const loadCredentials = async () => {
    try {
      // In production, this would be an API call
      // For now, using mock data
      const mockCredentials: Credential[] = [
        {
          id: 'cred_1',
          name: 'Default SMTP',
          type: 'smtp',
          config: { host: 'smtp.gmail.com', port: 587 }
        },
        {
          id: 'cred_2',
          name: 'Production Database',
          type: 'postgresql',
          config: { host: 'db.example.com', port: 5432 }
        }
      ].filter(c => c.type === type);

      setCredentials(mockCredentials);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleCreateCredential = async () => {
    try {
      // Validate required fields
      const credType = credentialTypes[type];
      const requiredFields = credType.fields.filter(f => f.required);

      for (const field of requiredFields) {
        if (!newCredential[field.key]) {
          toast.error(`${field.label} is required`);
          return;
        }
      }

      // In production, this would save to database
      const credential: Credential = {
        id: `cred_${Date.now()}`,
        name: newCredential.name || `New ${credType.name}`,
        type,
        config: { ...newCredential }
      };

      setCredentials([...credentials, credential]);
      onChange(credential.id, credential.config);
      setIsCreating(false);
      setNewCredential({});
      toast.success('Credential created successfully');
    } catch (error) {
      toast.error('Failed to create credential');
    }
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
      case 'password':
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

  const credType = credentialTypes[type];
  const iconMap: Record<string, any> = {
    smtp: Mail,
    postgresql: Database,
    mysql: Database,
    mongodb: Database,
    http_auth: Globe,
    openai: Globe,
    slack: Globe,
  };
  const Icon = iconMap[type] || Key;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          <Icon className="inline-block w-4 h-4 mr-2" />
          {credType.name} Configuration
        </Label>
        {allowInline && (
          <div className="flex items-center gap-2">
            <Label htmlFor="inline-config" className="text-sm">Use inline config</Label>
            <Switch
              id="inline-config"
              checked={useInlineConfig}
              onCheckedChange={(checked) => {
                setUseInlineConfig(checked);
                if (checked) {
                  onChange(null, inlineConfig);
                } else {
                  onChange(value || '', undefined);
                }
              }}
            />
          </div>
        )}
      </div>

      {useInlineConfig ? (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          {credType.fields.map((field) =>
            renderCredentialField(
              field,
              inlineConfig,
              (key, val) => {
                const updated = { ...inlineConfig, [key]: val };
                setInlineConfig(updated);
                onChange(null, updated);
              }
            )
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Select value={value} onValueChange={(v) => onChange(v, undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Select credential or create new" />
            </SelectTrigger>
            <SelectContent>
              {credentials.map((cred) => (
                <SelectItem key={cred.id} value={cred.id}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    <span>{cred.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create {credType.name} Credential</DialogTitle>
                <DialogDescription>
                  Create a reusable credential that can be used across multiple nodes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cred-name">Credential Name</Label>
                  <Input
                    id="cred-name"
                    value={newCredential.name || ''}
                    onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                    placeholder={`My ${credType.name}`}
                  />
                </div>

                {credType.fields.map((field) =>
                  renderCredentialField(
                    field,
                    newCredential,
                    (key, val) => setNewCredential({ ...newCredential, [key]: val })
                  )
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCredential}>
                  Create Credential
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}