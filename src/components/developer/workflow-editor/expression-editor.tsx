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
  className?: string;
}

export function ExpressionEditor({
  value,
  onChange,
  placeholder = 'Enter value or expression...',
  availableNodes = [],
  className = '',
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

  const commonExpressions = [
    { label: 'Current Date', expression: 'new Date().toISOString()', icon: Calendar },
    { label: 'Timestamp', expression: 'Date.now()', icon: Clock },
    { label: 'Random Number', expression: 'Math.random()', icon: Hash },
    { label: 'UUID', expression: "crypto.randomUUID()", icon: Variable },
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
                      {availableNodes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No previous nodes available
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {availableNodes.map((node) => (
                            <div key={node.id} className="border rounded-lg p-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{node.label}</span>
                                <Badge variant="outline" className="text-xs">
                                  {node.id}
                                </Badge>
                              </div>
                              {node.outputs && Object.keys(node.outputs).length > 0 ? (
                                <div className="space-y-1">
                                  {Object.entries(node.outputs).map(([key, value]) => (
                                    <button
                                      key={key}
                                      className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded flex items-center justify-between group"
                                      onClick={() => insertExpression(`$node["${node.id}"].json.${key}`)}
                                    >
                                      <span className="flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3" />
                                        <code>{key}</code>
                                      </span>
                                      <span className="text-muted-foreground group-hover:text-foreground">
                                        {typeof value === 'object' ? 'Object' : String(value).substring(0, 20)}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No outputs yet</p>
                              )}
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