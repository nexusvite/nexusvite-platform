'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Activity,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Terminal,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Settings,
  Search,
  Filter,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { WorkflowExecutionCanvas } from '@/components/workbench/execution-canvas';
import { ExecutionLogs } from '@/components/workbench/execution-logs';
import { NodeMetrics } from '@/components/workbench/node-metrics';
import { useWebSocket } from '@/hooks/use-websocket';

interface ExecutionData {
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  currentNodeId?: string;
  progress: number;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    nodeId?: string;
    data?: any;
  }>;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    executionTime?: number;
    inputs?: any;
    outputs?: any;
    error?: string;
  }>;
  metrics: {
    totalExecutionTime?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    nodesCompleted: number;
    nodesTotal: number;
  };
}

export default function WorkbenchPage() {
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');

  // WebSocket connection for real-time updates
  const { sendMessage, lastMessage } = useWebSocket('/api/workbench/ws', {
    onOpen: () => {
      setIsConnected(true);
      sendMessage({ type: 'subscribe', topic: 'executions' });
    },
    onClose: () => setIsConnected(false),
  });

  // Consider connected if we can fetch executions
  useEffect(() => {
    if (executions !== undefined) {
      setIsConnected(true);
    }
  }, [executions]);

  // Fetch initial executions
  useEffect(() => {
    fetchExecutions();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      switch (message.type) {
        case 'execution:update':
          updateExecution(message.data);
          break;
        case 'execution:new':
          addExecution(message.data);
          break;
        case 'execution:log':
          addLog(message.executionId, message.log);
          break;
        case 'node:update':
          updateNode(message.executionId, message.nodeId, message.data);
          break;
      }
    }
  }, [lastMessage]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchExecutions, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/workbench/executions', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      setExecutions([]);
    }
  };

  const updateExecution = (executionUpdate: Partial<ExecutionData>) => {
    setExecutions(prev =>
      prev.map(exec =>
        exec.executionId === executionUpdate.executionId
          ? { ...exec, ...executionUpdate }
          : exec
      )
    );
  };

  const addExecution = (execution: ExecutionData) => {
    setExecutions(prev => [execution, ...prev]);
  };

  const addLog = (executionId: string, log: any) => {
    setExecutions(prev =>
      prev.map(exec =>
        exec.executionId === executionId
          ? { ...exec, logs: [...exec.logs, log] }
          : exec
      )
    );
  };

  const updateNode = (executionId: string, nodeId: string, nodeUpdate: any) => {
    setExecutions(prev =>
      prev.map(exec =>
        exec.executionId === executionId
          ? {
              ...exec,
              nodes: exec.nodes.map(node =>
                node.id === nodeId ? { ...node, ...nodeUpdate } : node
              ),
            }
          : exec
      )
    );
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    setIsBottomPanelCollapsed(false);
    setActiveTab('node-details');
  }, []);

  const handlePause = async (executionId: string) => {
    await fetch(`/api/workbench/executions/${executionId}/pause`, {
      method: 'POST',
      credentials: 'include',
    });
  };

  const handleResume = async (executionId: string) => {
    await fetch(`/api/workbench/executions/${executionId}/resume`, {
      method: 'POST',
      credentials: 'include',
    });
  };

  const handleStop = async (executionId: string) => {
    await fetch(`/api/workbench/executions/${executionId}/stop`, {
      method: 'POST',
      credentials: 'include',
    });
  };

  const filteredExecutions = (executions || [])
    .filter(exec => {
      if (filter !== 'all' && exec.status !== filter) return false;
      if (searchQuery && !exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });

  const selectedExecutionData = executions.find(exec => exec.executionId === selectedExecution);
  const selectedNodeData = selectedExecutionData?.nodes.find(node => node.id === selectedNode);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'paused':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar - Execution List */}
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={40}
          className={cn(
            "transition-all duration-200",
            isSidebarCollapsed && "min-w-[50px] max-w-[50px]"
          )}
        >
          <div className="h-full flex flex-col border-r bg-muted/30">
            {/* Sidebar Header */}
            <div className="px-4 py-3 border-b bg-background">
              <div className="flex items-center justify-between">
                <h2 className={cn(
                  "font-semibold transition-opacity",
                  isSidebarCollapsed && "opacity-0"
                )}>
                  Executions
                </h2>
                <div className="flex items-center gap-1">
                  {!isSidebarCollapsed && (
                    <>
                      <Badge
                        variant={isConnected ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {isConnected ? (
                          <><Wifi className="h-3 w-3 mr-1" /> Live</>
                        ) : (
                          <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                        )}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchExecutions}
                        className="h-8 w-8"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="h-8 w-8"
                  >
                    {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {!isSidebarCollapsed && (
              <>
                {/* Search and Filter */}
                <div className="px-4 py-3 space-y-2 border-b bg-background/50">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search workflows..."
                      className="w-full pl-8 pr-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({executions.length})</SelectItem>
                      <SelectItem value="running">
                        Running ({executions.filter(e => e.status === 'running').length})
                      </SelectItem>
                      <SelectItem value="completed">
                        Completed ({executions.filter(e => e.status === 'completed').length})
                      </SelectItem>
                      <SelectItem value="failed">
                        Failed ({executions.filter(e => e.status === 'failed').length})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Execution List */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {filteredExecutions.map(execution => (
                      <Card
                        key={execution.executionId}
                        className={cn(
                          "p-3 cursor-pointer transition-all hover:shadow-md",
                          selectedExecution === execution.executionId
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedExecution(execution.executionId)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getStatusIcon(execution.status)}
                              <span className="font-medium truncate text-sm">
                                {execution.workflowName}
                              </span>
                            </div>
                            <Badge variant={getStatusBadgeVariant(execution.status)} className="text-xs">
                              {execution.status}
                            </Badge>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="font-mono">
                              {execution.executionId.slice(0, 8)}...
                            </div>
                            <div>
                              {new Date(execution.startTime).toLocaleTimeString()}
                            </div>
                          </div>

                          {execution.status === 'running' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{execution.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${execution.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content Area */}
        <ResizablePanel defaultSize={75} minSize={60}>
          <div className="h-full flex flex-col">
            {selectedExecutionData ? (
              <>
                {/* Header Bar */}
                <div className="px-6 py-3 border-b bg-background flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold">
                      {selectedExecutionData.workflowName}
                    </h1>
                    <Badge variant={getStatusBadgeVariant(selectedExecutionData.status)}>
                      {selectedExecutionData.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {selectedExecutionData.executionId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedExecutionData.status === 'running' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePause(selectedExecutionData.executionId)}
                      >
                        <PauseCircle className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {selectedExecutionData.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResume(selectedExecutionData.executionId)}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {(selectedExecutionData.status === 'running' ||
                      selectedExecutionData.status === 'paused') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStop(selectedExecutionData.executionId)}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>

                {/* Canvas and Bottom Panel */}
                <ResizablePanelGroup direction="vertical" className="flex-1">
                  {/* Canvas */}
                  <ResizablePanel defaultSize={70} minSize={50}>
                    <div className="h-full relative bg-muted/10">
                      <WorkflowExecutionCanvas
                        execution={selectedExecutionData}
                        onNodeClick={handleNodeClick}
                      />

                      {/* Canvas Controls (floating) */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-background">
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-background">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Bottom Panel */}
                  <ResizablePanel
                    defaultSize={30}
                    minSize={10}
                    maxSize={50}
                    className={cn(
                      "transition-all duration-200",
                      isBottomPanelCollapsed && "min-h-[40px] max-h-[40px]"
                    )}
                  >
                    <div className="h-full flex flex-col bg-background border-t">
                      {/* Bottom Panel Header */}
                      <div className="px-4 py-2 border-b flex items-center justify-between">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                          <div className="flex items-center justify-between">
                            <TabsList className="h-8">
                              <TabsTrigger value="logs" className="text-xs">
                                <Terminal className="h-3 w-3 mr-1" />
                                Logs
                              </TabsTrigger>
                              <TabsTrigger value="metrics" className="text-xs">
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Metrics
                              </TabsTrigger>
                              {selectedNode && (
                                <TabsTrigger value="node-details" className="text-xs">
                                  <Layers className="h-3 w-3 mr-1" />
                                  Node Details
                                </TabsTrigger>
                              )}
                            </TabsList>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
                              className="h-6 w-6"
                            >
                              {isBottomPanelCollapsed ?
                                <ChevronUp className="h-4 w-4" /> :
                                <ChevronDown className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                        </Tabs>
                      </div>

                      {/* Bottom Panel Content */}
                      {!isBottomPanelCollapsed && (
                        <div className="flex-1 overflow-hidden">
                          {activeTab === 'logs' && (
                            <ExecutionLogs logs={selectedExecutionData.logs} />
                          )}
                          {activeTab === 'metrics' && (
                            <ScrollArea className="h-full">
                              <NodeMetrics
                                nodes={selectedExecutionData.nodes}
                                metrics={selectedExecutionData.metrics}
                              />
                            </ScrollArea>
                          )}
                          {activeTab === 'node-details' && selectedNodeData && (
                            <div className="p-4 space-y-4">
                              <div>
                                <h3 className="font-semibold mb-2">
                                  {selectedNodeData.name || selectedNodeData.id}
                                </h3>
                                <Badge variant={getStatusBadgeVariant(selectedNodeData.status)}>
                                  {selectedNodeData.status}
                                </Badge>
                              </div>

                              {selectedNodeData.executionTime && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Execution Time:</span>
                                  <span className="ml-2 font-mono">{selectedNodeData.executionTime}ms</span>
                                </div>
                              )}

                              {selectedNodeData.inputs && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Inputs:</span>
                                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                    {JSON.stringify(selectedNodeData.inputs, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedNodeData.outputs && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Outputs:</span>
                                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                                    {JSON.stringify(selectedNodeData.outputs, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedNodeData.error && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Error:</span>
                                  <div className="mt-1 p-2 bg-destructive/10 text-destructive rounded text-sm">
                                    {selectedNodeData.error}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No execution selected</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select an execution from the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}