'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MotiaStatusProps {
  workflowId: string;
  workflowName: string;
  isSynced?: boolean;
  onSync?: () => Promise<void>;
}

export function MotiaStatus({
  workflowId,
  workflowName,
  isSynced = false,
  onSync
}: MotiaStatusProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [motiaUrl, setMotiaUrl] = useState<string>('');
  const [isMotiaOnline, setIsMotiaOnline] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);

  // Check Motia server status
  useEffect(() => {
    const checkMotiaStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/', { method: 'HEAD' });
        setIsMotiaOnline(response.ok);
      } catch (error) {
        setIsMotiaOnline(false);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkMotiaStatus();
    const interval = setInterval(checkMotiaStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Set Motia URL for the workflow
  useEffect(() => {
    if (isSynced && workflowId) {
      setMotiaUrl(`http://localhost:3000/workflow/${workflowId}`);
      setSyncStatus('synced');
    } else {
      setSyncStatus('idle');
    }
  }, [isSynced, workflowId]);

  const handleSync = async () => {
    if (!onSync) return;

    setSyncStatus('syncing');
    try {
      await onSync();
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error syncing with Motia:', error);
      setSyncStatus('error');
    }
  };

  const openMotiaWorkbench = () => {
    window.open('http://localhost:3000', '_blank');
  };

  const openWorkflowInMotia = () => {
    if (motiaUrl) {
      window.open(motiaUrl, '_blank');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Motia Integration
          </CardTitle>
          <div className="flex items-center gap-2">
            {checkingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isMotiaOnline ? (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="mr-1 h-3 w-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="mr-1 h-3 w-3" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Sync Status:</span>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus === 'idle' && (
              <Badge variant="outline" className="text-xs">
                Not Synced
              </Badge>
            )}
            {syncStatus === 'syncing' && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                Syncing...
              </Badge>
            )}
            {syncStatus === 'synced' && (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="mr-1 h-3 w-3" />
                Synced
              </Badge>
            )}
            {syncStatus === 'error' && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="mr-1 h-3 w-3" />
                Sync Error
              </Badge>
            )}
          </div>
        </div>

        {/* Workflow Path */}
        {isSynced && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Motia Path:</div>
            <code className="block text-xs bg-muted px-2 py-1 rounded">
              /src/steps/workflows/{workflowId}
            </code>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openMotiaWorkbench}
                  disabled={!isMotiaOnline}
                  className="flex-1"
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Workbench
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open Motia Workbench Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isSynced && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openWorkflowInMotia}
                    disabled={!isMotiaOnline}
                    className="flex-1"
                  >
                    <Zap className="mr-2 h-3 w-3" />
                    View Flow
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View this workflow in Motia</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!isSynced && onSync && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleSync}
                    disabled={!isMotiaOnline || syncStatus === 'syncing'}
                    className="flex-1"
                  >
                    {syncStatus === 'syncing' ? (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-3 w-3" />
                        Sync to Motia
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate Motia steps for this workflow</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Motia Events */}
        {isSynced && (
          <div className="border-t pt-3 space-y-2">
            <div className="text-xs font-medium">Event Topics:</div>
            <div className="space-y-1">
              <code className="block text-xs bg-muted px-2 py-1 rounded">
                workflow.{workflowId}.start
              </code>
              <code className="block text-xs bg-muted px-2 py-1 rounded">
                workflow.{workflowId}.node.*.completed
              </code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}