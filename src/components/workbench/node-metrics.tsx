'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Clock,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface NodeMetricsProps {
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

const COLORS = {
  completed: '#10b981',
  failed: '#ef4444',
  running: '#3b82f6',
  pending: '#6b7280',
  skipped: '#eab308',
};

export function NodeMetrics({ nodes, metrics }: NodeMetricsProps) {
  // Calculate statistics
  const nodesByStatus = nodes.reduce((acc, node) => {
    acc[node.status] = (acc[node.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const nodeExecutionTimes = nodes
    .filter(n => n.executionTime)
    .map(n => ({
      name: n.name || n.id,
      time: n.executionTime!,
      status: n.status,
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 10);

  const totalExecutionTime = metrics.totalExecutionTime ||
    nodes.reduce((sum, n) => sum + (n.executionTime || 0), 0);

  const averageExecutionTime = nodes.filter(n => n.executionTime).length > 0
    ? totalExecutionTime / nodes.filter(n => n.executionTime).length
    : 0;

  const slowestNode = nodes.reduce((max, n) =>
    (n.executionTime || 0) > (max.executionTime || 0) ? n : max,
    nodes[0]
  );

  const fastestNode = nodes
    .filter(n => n.executionTime)
    .reduce((min, n) =>
      (n.executionTime || Infinity) < (min.executionTime || Infinity) ? n : min,
      nodes[0]
    );

  const statusData = Object.entries(nodesByStatus).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: ((count / nodes.length) * 100).toFixed(1),
  }));

  const nodeTypeDistribution = nodes.reduce((acc, node) => {
    const type = node.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(nodeTypeDistribution).map(([type, count]) => ({
    name: type,
    count,
  }));

  // Timeline data for execution flow
  const timelineData = nodes
    .filter(n => n.executionTime)
    .map((n, index) => ({
      step: index + 1,
      name: n.name || n.id,
      time: n.executionTime!,
      cumulative: nodes
        .slice(0, index + 1)
        .reduce((sum, node) => sum + (node.executionTime || 0), 0),
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Execution</p>
              <p className="text-2xl font-bold">
                {(totalExecutionTime / 1000).toFixed(2)}s
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {((nodesByStatus.completed || 0) / nodes.length * 100).toFixed(0)}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
          <Progress
            value={(nodesByStatus.completed || 0) / nodes.length * 100}
            className="mt-2"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">CPU Usage</p>
              <p className="text-2xl font-bold">
                {metrics.cpuUsage?.toFixed(1) || '0'}%
              </p>
            </div>
            <Cpu className="h-8 w-8 text-blue-500" />
          </div>
          <Progress value={metrics.cpuUsage || 0} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-2xl font-bold">
                {((metrics.memoryUsage || 0) / 1024 / 1024).toFixed(0)}MB
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-purple-500" />
          </div>
          <Progress
            value={(metrics.memoryUsage || 0) / (1024 * 1024 * 1024) * 100}
            className="mt-2"
          />
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Node Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 10 Slowest Nodes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Execution Time by Node</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nodeExecutionTimes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="time" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Timeline */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Execution Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                name="Cumulative Time"
              />
              <Area
                type="monotone"
                dataKey="time"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Node Time"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Node Type Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Node Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Slowest Node</span>
            <Timer className="h-4 w-4 text-red-500" />
          </div>
          <p className="font-medium">{slowestNode?.name || slowestNode?.id}</p>
          <p className="text-2xl font-bold text-red-500">
            {((slowestNode?.executionTime || 0) / 1000).toFixed(2)}s
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Fastest Node</span>
            <Zap className="h-4 w-4 text-green-500" />
          </div>
          <p className="font-medium">{fastestNode?.name || fastestNode?.id}</p>
          <p className="text-2xl font-bold text-green-500">
            {((fastestNode?.executionTime || 0)).toFixed(0)}ms
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Average Time</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <p className="font-medium">Per Node</p>
          <p className="text-2xl font-bold text-blue-500">
            {(averageExecutionTime / 1000).toFixed(2)}s
          </p>
        </Card>
      </div>

      {/* Node Status Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Node Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Node</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Execution Time</th>
                <th className="text-right p-2">Input Size</th>
                <th className="text-right p-2">Output Size</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{node.name || node.id}</td>
                  <td className="p-2">
                    <Badge variant="outline">{node.type}</Badge>
                  </td>
                  <td className="p-2">
                    <Badge
                      variant={
                        node.status === 'completed' ? 'default' :
                        node.status === 'failed' ? 'destructive' :
                        node.status === 'running' ? 'secondary' :
                        'outline'
                      }
                    >
                      {node.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-right font-mono">
                    {node.executionTime ? `${node.executionTime}ms` : '-'}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {node.inputs ? `${JSON.stringify(node.inputs).length}B` : '-'}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {node.outputs ? `${JSON.stringify(node.outputs).length}B` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}