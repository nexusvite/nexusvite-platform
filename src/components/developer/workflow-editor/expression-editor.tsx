'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code,
  Variable,
  Clock,
  Hash,
  Type,
  Calendar,
  GitBranch,
  ChevronRight,
} from 'lucide-react';

interface ExpressionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  availableNodes?: Array<{
    id: string;
    label: string;
    outputs?: Record<string, any>;
  }>;
  executionOutputs?: Record<string, any>;
  executionVariables?: Record<string, any>;
  className?: string;
  onRegister?: (handler: (value: string) => void) => void;
}

export function ExpressionEditor({
  value,
  onChange,
  placeholder = 'Enter value or expression...',
  availableNodes = [],
  executionOutputs = {},
  executionVariables = {},
  className = '',
  onRegister,
}: ExpressionEditorProps) {
  const [isExpression, setIsExpression] = useState(value.startsWith('{{') && value.endsWith('}}'));
  const [localValue, setLocalValue] = useState(value);
  const [showHelper, setShowHelper] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
    setIsExpression(value.startsWith('{{') && value.endsWith('}}'));
  }, [value]);

  useEffect(() => {
    // Register the insert handler
    if (onRegister) {
      onRegister((expression: string) => {
        insertExpression(expression);
      });
    }
  }, [onRegister]);

  const handleToggleExpression = () => {
    if (isExpression) {
      // Convert from expression to static value
      const staticValue = localValue.replace(/^{{|}}/g, '').trim();
      setLocalValue(staticValue);
      onChange(staticValue);
      setIsExpression(false);
    } else {
      // Convert to expression
      const expression = `{{ ${localValue || ''} }}`;
      setLocalValue(expression);
      onChange(expression);
      setIsExpression(true);
    }
  };

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const insertExpression = (expression: string) => {
    if (!isExpression) {
      const newValue = `{{ ${expression} }}`;
      handleChange(newValue);
      setIsExpression(true);
    } else {
      // Insert at cursor position
      if (inputRef.current) {
        const start = inputRef.current.selectionStart || 0;
        const end = inputRef.current.selectionEnd || 0;
        const before = localValue.substring(0, start);
        const after = localValue.substring(end);
        const newValue = before + expression + after;
        handleChange(newValue);

        // Set cursor position after inserted text
        setTimeout(() => {
          if (inputRef.current) {
            const newPosition = start + expression.length;
            inputRef.current.setSelectionRange(newPosition, newPosition);
            inputRef.current.focus();
          }
        }, 0);
      }
    }
    setShowHelper(false);
  };

  const renderDataFields = (data: any, nodeId: string, path: string, depth = 0): JSX.Element[] => {
    if (depth > 2 || !data || typeof data !== 'object') return [];

    const fields: JSX.Element[] = [];

    Object.entries(data).forEach(([key, value]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const expression = `$node["${nodeId}"].json.${fullPath}`;

      fields.push(
        <button
          key={fullPath}
          className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded flex items-center justify-between group"
          onClick={() => insertExpression(expression)}
        >
          <span className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <code>{fullPath}</code>
          </span>
          <span className="text-muted-foreground group-hover:text-foreground text-right truncate max-w-[100px]">
            {typeof value === 'object' ? '{...}' : String(value).substring(0, 20)}
          </span>
        </button>
      );

      if (typeof value === 'object' && value !== null) {
        fields.push(...renderDataFields(value, nodeId, fullPath, depth + 1));
      }
    });

    return fields;
  };

  const commonExpressions = [
    { label: 'Current Date', expression: 'new Date().toISOString()', icon: Calendar },
    { label: 'Timestamp', expression: 'Date.now()', icon: Clock },
    { label: 'Random Number', expression: 'Math.random()', icon: Hash },
    { label: 'UUID', expression: "crypto.randomUUID()", icon: Variable },
    ...Object.entries(executionVariables).map(([name, value]) => ({
      label: `Variable: ${name}`,
      expression: `$vars.${name}`,
      icon: Variable,
    })),
  ];

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className={`pr-20 font-mono text-sm ${isExpression ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800' : ''}`}
            onFocus={() => setShowHelper(true)}
            onBlur={() => setTimeout(() => setShowHelper(false), 200)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Badge
              variant={isExpression ? 'default' : 'outline'}
              className="cursor-pointer text-xs h-6"
              onClick={handleToggleExpression}
            >
              {isExpression ? 'fx' : 'abc'}
            </Badge>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Code className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <Tabs defaultValue="nodes" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="nodes">Nodes</TabsTrigger>
                    <TabsTrigger value="expressions">Expressions</TabsTrigger>
                    <TabsTrigger value="help">Help</TabsTrigger>
                  </TabsList>

                  <TabsContent value="nodes" className="mt-4">
                    <ScrollArea className="h-64">
                      {availableNodes.length === 0 && Object.keys(executionOutputs).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No nodes available. Run the workflow to see outputs.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {/* Show execution outputs if available */}
                          {Object.entries(executionOutputs).map(([nodeId, output]: [string, any]) => {
                            const node = availableNodes.find(n => n.id === nodeId);
                            const nodeLabel = node?.label || nodeId;

                            if (!output?.data) return null;

                            return (
                              <div key={nodeId} className="border rounded-lg p-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">{nodeLabel}</span>
                                  <div className="flex gap-1">
                                    {output.status === 'success' && (
                                      <Badge variant="default" className="text-xs">
                                        ✓
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {nodeId}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  {renderDataFields(output.data, nodeId, '')}
                                </div>
                              </div>
                            );
                          })}

                          {/* Show node configurations if no execution */}
                          {Object.keys(executionOutputs).length === 0 && availableNodes.map((node) => (
                            <div key={node.id} className="border rounded-lg p-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{node.label}</span>
                                <Badge variant="outline" className="text-xs">
                                  {node.id}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">Run workflow to see outputs</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="expressions" className="mt-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {commonExpressions.map((expr) => {
                          const Icon = expr.icon;
                          return (
                            <button
                              key={expr.label}
                              className="w-full text-left p-2 hover:bg-muted rounded-lg flex items-center gap-3"
                              onClick={() => insertExpression(expr.expression)}
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{expr.label}</div>
                                <code className="text-xs text-muted-foreground">
                                  {expr.expression}
                                </code>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="help" className="mt-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Expression Syntax</h4>
                        <p className="text-xs text-muted-foreground">
                          Wrap JavaScript expressions in {'{{ }}'} to make them dynamic
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Accessing Node Data</h4>
                        <code className="text-xs block p-2 bg-muted rounded">
                          {'{{ $node["nodeName"].json.field }}'}
                        </code>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">JavaScript Functions</h4>
                        <p className="text-xs text-muted-foreground">
                          You can use any JavaScript expression including Math, Date, String methods
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {isExpression && (
        <p className="text-xs text-muted-foreground mt-1">
          Expression mode: JavaScript code will be evaluated
        </p>
      )}
    </div>
  );
}