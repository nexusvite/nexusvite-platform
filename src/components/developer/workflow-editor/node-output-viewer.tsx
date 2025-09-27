'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Variable,
  Copy,
  Eye,
  Plus,
  DragHandleDots2Icon,
  Loader2,
} from 'lucide-react';
import { NodeOutput, ExecutionState } from '@/core/workflow/execution-engine';
import { toast } from 'sonner';
import { Node } from 'reactflow';

interface NodeOutputViewerProps {
  executionState: ExecutionState | null;
  nodes: Node[];
  onCreateVariable?: (nodeId: string, path: string, variableName: string) => void;
  onInsertToExpression?: (value: string) => void;
}

export function NodeOutputViewer({
  executionState,
  nodes,
  onCreateVariable,
  onInsertToExpression,
}: NodeOutputViewerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [createVarDialog, setCreateVarDialog] = useState<{
    open: boolean;
    nodeId: string;
    path: string;
    value: any;
  } | null>(null);
  const [varName, setVarName] = useState('');

  const toggleNodeExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeLabel = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId)?.data.label || nodeId;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const formatDuration = (startTime: Date, endTime: Date) => {
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const copyToClipboard = (value: any) => {
    const text = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCreateVariable = () => {
    if (!createVarDialog || !varName.trim()) return;

    onCreateVariable?.(createVarDialog.nodeId, createVarDialog.path, varName);
    toast.success(`Created variable: ${varName}`);
    setCreateVarDialog(null);
    setVarName('');
  };

  const renderJsonValue = (
    value: any,
    path: string = '',
    nodeId: string,
    depth: number = 0
  ): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-500">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-green-500">{value}</span>;
    }

    if (typeof value === 'string') {
      return (
        <span className="text-orange-500">
          "{value.length > 100 ? value.substring(0, 100) + '...' : value}"
        </span>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="pl-4">
          <span className="text-muted-foreground">[</span>
          {value.map((item, index) => (
            <div key={index} className="flex items-center gap-2 hover:bg-muted/50 rounded px-1">
              <span className="text-muted-foreground">{index}:</span>
              {renderJsonValue(item, `${path}[${index}]`, nodeId, depth + 1)}
              {depth < 2 && (
                <div className="ml-auto flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(item)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() =>
                      setCreateVarDialog({
                        open: true,
                        nodeId,
                        path: `${path}[${index}]`,
                        value: item,
                      })
                    }
                  >
                    <Variable className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          <span className="text-muted-foreground">]</span>
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      return (
        <div className="pl-4">
          <span className="text-muted-foreground">{'{'}</span>
          {entries.map(([key, val], index) => (
            <div key={key} className="flex items-center gap-2 hover:bg-muted/50 rounded px-1">
              <span className="text-purple-500">"{key}":</span>
              {renderJsonValue(val, path ? `${path}.${key}` : key, nodeId, depth + 1)}
              {depth < 2 && (
                <div className="ml-auto flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(val)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() =>
                      setCreateVarDialog({
                        open: true,
                        nodeId,
                        path: path ? `${path}.${key}` : key,
                        value: val,
                      })
                    }
                  >
                    <Variable className="h-3 w-3" />
                  </Button>
                  {onInsertToExpression && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        onInsertToExpression(`$node["${nodeId}"].json.${path ? `${path}.${key}` : key}`)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          <span className="text-muted-foreground">{'}'}</span>
        </div>
      );
    }

    return <span>{JSON.stringify(value)}</span>;
  };

  if (!executionState) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Node Outputs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Run the workflow to see node outputs here
          </p>
        </CardContent>
      </Card>
    );
  }

  const outputNodes = Object.entries(executionState.outputs);

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Node Outputs</CardTitle>
            {executionState.variables && Object.keys(executionState.variables).length > 0 && (
              <Badge variant="secondary">
                {Object.keys(executionState.variables).length} variables
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs defaultValue="outputs" className="h-full flex flex-col">
            <TabsList className="mx-4">
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="outputs" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {outputNodes.map(([nodeId, output]) => (
                    <Collapsible
                      key={nodeId}
                      open={expandedNodes.has(nodeId)}
                      onOpenChange={() => toggleNodeExpanded(nodeId)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer">
                          {expandedNodes.has(nodeId) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {getStatusIcon(output.status)}
                          <span className="font-medium text-sm">{getNodeLabel(nodeId)}</span>
                          {output.endTime && (
                            <Badge variant="outline" className="ml-auto text-xs">
                              {formatDuration(output.startTime, output.endTime)}
                            </Badge>
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-8 pr-2 pb-2">
                          {output.error ? (
                            <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-950 rounded">
                              Error: {output.error}
                            </div>
                          ) : (
                            <div className="bg-muted/30 rounded-lg p-2 text-sm font-mono">
                              {renderJsonValue(output.data, '', nodeId)}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="variables" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {Object.entries(executionState.variables || {}).map(([name, value]) => (
                    <div
                      key={name}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Variable className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">${name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(value)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {onInsertToExpression && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => onInsertToExpression(`$vars.${name}`)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-mono bg-muted/30 rounded p-2">
                        {renderJsonValue(value, '', '', 0)}
                      </div>
                    </div>
                  ))}

                  {(!executionState.variables ||
                    Object.keys(executionState.variables).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No variables created yet. Click the variable icon on any output value to create
                      a variable.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Variable Dialog */}
      {createVarDialog && (
        <Dialog open={createVarDialog.open} onOpenChange={() => setCreateVarDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Variable</DialogTitle>
              <DialogDescription>
                Create a variable from this output value that can be used in other nodes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Variable Name</label>
                <Input
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="myVariable"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Value Preview</label>
                <div className="text-sm font-mono bg-muted rounded p-2 max-h-32 overflow-auto">
                  {JSON.stringify(createVarDialog.value, null, 2)}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateVarDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVariable} disabled={!varName.trim()}>
                Create Variable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}