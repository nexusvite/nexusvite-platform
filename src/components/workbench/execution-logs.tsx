'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  Filter,
  Download,
  Trash2,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
  data?: any;
}

interface ExecutionLogsProps {
  logs: LogEntry[];
}

const LogLevelIcon = ({ level }: { level: string }) => {
  switch (level) {
    case 'debug':
      return <Bug className="h-3 w-3 text-gray-500" />;
    case 'info':
      return <Info className="h-3 w-3 text-blue-500" />;
    case 'warn':
      return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
};

const LogLevelBadge = ({ level }: { level: string }) => {
  const variants: Record<string, string> = {
    debug: 'secondary',
    info: 'default',
    warn: 'warning',
    error: 'destructive',
  };

  return (
    <Badge
      variant={variants[level] as any}
      className="text-xs px-1.5 py-0 h-5 min-w-[50px] justify-center"
    >
      {level.toUpperCase()}
    </Badge>
  );
};

export function ExecutionLogs({ logs }: ExecutionLogsProps) {
  // Debug logging
  console.log('ExecutionLogs component received logs:', logs);
  console.log('Logs count:', logs?.length || 0);

  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs || []);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let filtered = logs || [];

    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.nodeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          JSON.stringify(log.data).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, searchQuery]);

  useEffect(() => {
    if (autoScroll && endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const toggleLogExpansion = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const exportLogs = () => {
    const logData = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setFilteredLogs([]);
  };

  const getLogLevelCounts = () => {
    const counts = { debug: 0, info: 0, warn: 0, error: 0 };
    (logs || []).forEach(log => {
      counts[log.level]++;
    });
    return counts;
  };

  const counts = getLogLevelCounts();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Execution Logs</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={autoScroll ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              Auto Scroll
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="debug">Debug ({counts.debug})</SelectItem>
              <SelectItem value="info">Info ({counts.info})</SelectItem>
              <SelectItem value="warn">Warning ({counts.warn})</SelectItem>
              <SelectItem value="error">Error ({counts.error})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <Bug className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-muted-foreground">{counts.debug}</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">{counts.info}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-muted-foreground">{counts.warn}</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            <span className="text-xs text-muted-foreground">{counts.error}</span>
          </div>
        </div>
      </div>

      {/* Logs */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <Card
                key={index}
                className={`p-3 font-mono text-sm cursor-pointer transition-colors ${
                  log.level === 'error'
                    ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    : log.level === 'warn'
                    ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => log.data && toggleLogExpansion(index)}
              >
                <div className="flex items-start gap-3">
                  <LogLevelIcon level={log.level} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                      </span>
                      <LogLevelBadge level={log.level} />
                      {log.nodeId && (
                        <Badge variant="outline" className="text-xs">
                          {log.nodeId}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm break-words">{log.message}</div>
                    {log.data && (
                      <div
                        className={`mt-2 transition-all overflow-hidden ${
                          expandedLogs.has(index) ? 'max-h-96' : 'max-h-0'
                        }`}
                      >
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
          <div ref={endOfLogsRef} />
        </div>
      </ScrollArea>
    </div>
  );
}