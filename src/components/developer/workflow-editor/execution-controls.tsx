'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  StepForward,
  FastForward,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { WorkflowExecutionEngine, ExecutionState } from '@/core/workflow/execution-engine';
import { Node, Edge } from 'reactflow';

interface ExecutionControlsProps {
  nodes: Node[];
  edges: Edge[];
  onExecutionStateChange?: (state: ExecutionState) => void;
  workflowId: string;
}

export function ExecutionControls({
  nodes,
  edges,
  onExecutionStateChange,
  workflowId,
}: ExecutionControlsProps) {
  const [engine, setEngine] = useState<WorkflowExecutionEngine | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [executionMode, setExecutionMode] = useState<'full' | 'step'>('full');

  useEffect(() => {
    // Create new engine when nodes/edges change (always uses Motia)
    const newEngine = new WorkflowExecutionEngine(workflowId, nodes, edges);

    // Subscribe to state changes
    const unsubscribe = newEngine.subscribe((state) => {
      setExecutionState(state);
      onExecutionStateChange?.(state);
    });

    setEngine(newEngine);

    return () => {
      unsubscribe();
    };
  }, [nodes, edges, workflowId]);

  const handlePlay = async () => {
    if (!engine) return;

    if (executionState?.status === 'paused') {
      await engine.resume();
    } else {
      await engine.execute({ mode: executionMode });
    }
  };

  const handlePause = () => {
    engine?.pause();
  };

  const handleStop = () => {
    engine?.stop();
  };

  const handleStep = async () => {
    if (!engine) return;

    // If idle or completed, start fresh in step mode
    if (!executionState || executionState.status === 'idle' || executionState.status === 'completed') {
      await engine.execute({ mode: 'step' });
    } else if (executionState.status === 'paused') {
      // If paused, step forward one node
      await engine.stepForward();
    }
  };

  const handleReplay = async () => {
    if (!engine) return;

    // Create fresh engine for replay (always uses Motia)
    const newEngine = new WorkflowExecutionEngine(workflowId, nodes, edges);
    const unsubscribe = newEngine.subscribe((state) => {
      setExecutionState(state);
      onExecutionStateChange?.(state);
    });

    setEngine(newEngine);
    await newEngine.execute({ mode: executionMode });
  };

  const getStatusIcon = () => {
    if (!executionState) return null;

    switch (executionState.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getExecutedNodesCount = () => {
    if (!executionState) return 0;
    return Object.keys(executionState.outputs).length;
  };

  const getProgress = () => {
    const executed = getExecutedNodesCount();
    const total = nodes.length;
    return total > 0 ? (executed / total) * 100 : 0;
  };

  const formatDuration = () => {
    if (!executionState?.startTime) return '0ms';

    const start = new Date(executionState.startTime).getTime();
    const end = executionState.endTime
      ? new Date(executionState.endTime).getTime()
      : Date.now();

    const duration = end - start;

    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
  };

  const isRunning = executionState?.status === 'running';
  const isPaused = executionState?.status === 'paused';
  const isCompleted = executionState?.status === 'completed';
  const hasError = executionState?.status === 'error';

  return (
    <div className="flex items-center gap-4 p-3 border-b bg-background">
      {/* Execution Controls */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button
            size="sm"
            onClick={handlePlay}
            disabled={nodes.length === 0}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isPaused ? 'Resume' : 'Run'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handlePause}
            className="gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={handleStop}
          disabled={!isRunning && !isPaused}
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleStep}
          disabled={isRunning || nodes.length === 0}
          title="Step through execution"
        >
          <StepForward className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleReplay}
          disabled={!isCompleted && !hasError}
          title="Replay execution"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Execution Mode */}
      <Select value={executionMode} onValueChange={(v: any) => setExecutionMode(v)}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="full">
            <div className="flex items-center gap-2">
              <FastForward className="h-3 w-3" />
              <span>Full Run</span>
            </div>
          </SelectItem>
          <SelectItem value="step">
            <div className="flex items-center gap-2">
              <StepForward className="h-3 w-3" />
              <span>Step Mode</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Status Display */}
      {executionState && executionState.status !== 'idle' && (
        <>
          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={hasError ? 'destructive' : 'outline'}>
              {executionState.status}
            </Badge>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <Progress value={getProgress()} className="h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {getExecutedNodesCount()} / {nodes.length} nodes
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDuration()}</span>
          </div>

          {/* Current Node */}
          {executionState.currentNodeId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Executing:</span>
              <Badge variant="secondary" className="text-xs">
                {nodes.find(n => n.id === executionState.currentNodeId)?.data.label || executionState.currentNodeId}
              </Badge>
            </div>
          )}

          {/* Error Message */}
          {hasError && executionState.error && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{executionState.error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}