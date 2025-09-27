import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Globe,
  Database,
  Mail,
  MessageSquare,
  GitBranch,
  Code,
  Filter,
  Clock,
  Webhook,
  Calendar,
  Zap,
  GitMerge,
  Variable,
  Timer,
  Plus,
} from 'lucide-react';

interface BaseNodeData {
  label: string;
  config?: any;
  status?: 'idle' | 'running' | 'success' | 'error';
  subType?: string;
}

const iconMap: Record<string, any> = {
  manual: Play,
  webhook: Webhook,
  schedule: Calendar,
  email: Mail,
  http: Globe,
  database: Database,
  slack: MessageSquare,
  entity: Plus,
  condition: GitBranch,
  switch: GitBranch,
  loop: Zap,
  delay: Timer,
  set: Variable,
  code: Code,
  merge: GitMerge,
  filter: Filter,
};

const nodeColors = {
  trigger: 'border-green-500 bg-green-50 dark:bg-green-950',
  action: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  logic: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
  transform: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
};

const BaseNode = memo(
  ({ data, type, isConnectable }: { data: BaseNodeData; type: string; isConnectable?: boolean }) => {
    const Icon = iconMap[data.subType || type] || Zap;
    const colorClass = nodeColors[type as keyof typeof nodeColors] || '';

    return (
      <Card className={`min-w-[150px] p-3 ${colorClass} border-2`}>
        <div className="flex items-center justify-between mb-1.5">
          <Icon className="h-4 w-4" />
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-auto">
            {type}
          </Badge>
        </div>
        <div className="font-medium text-xs">{data.label}</div>
        {data.status && (
          <div className="mt-1.5">
            <Badge
              variant={
                data.status === 'success'
                  ? 'default'
                  : data.status === 'error'
                  ? 'destructive'
                  : data.status === 'running'
                  ? 'secondary'
                  : 'outline'
              }
              className="text-[10px] px-1.5 py-0.5 h-auto"
            >
              {data.status}
            </Badge>
          </div>
        )}
      </Card>
    );
  }
);

BaseNode.displayName = 'BaseNode';

// Trigger Node
export const TriggerNode = memo(({ data, isConnectable }: NodeProps<BaseNodeData>) => {
  return (
    <>
      <BaseNode data={data} type="trigger" isConnectable={isConnectable} />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-bottom"
        style={{ background: '#16a34a', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output-right"
        style={{ background: '#16a34a', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
    </>
  );
});

TriggerNode.displayName = 'TriggerNode';

// Action Node
export const ActionNode = memo(({ data, isConnectable }: NodeProps<BaseNodeData>) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="input-top"
        style={{ background: '#3b82f6', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-left"
        style={{ background: '#3b82f6', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <BaseNode data={data} type="action" isConnectable={isConnectable} />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-bottom"
        style={{ background: '#3b82f6', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output-right"
        style={{ background: '#3b82f6', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
    </>
  );
});

ActionNode.displayName = 'ActionNode';

// Logic Node
export const LogicNode = memo(({ data, isConnectable }: NodeProps<BaseNodeData>) => {
  const isCondition = data.subType === 'condition' || data.subType === 'switch';

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="input-top"
        style={{ background: '#f97316', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-left"
        style={{ background: '#f97316', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <BaseNode data={data} type="logic" isConnectable={isConnectable} />
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true-bottom"
            style={{ background: '#16a34a', left: '30%', width: 8, height: 8 }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false-bottom"
            style={{ background: '#dc2626', left: '70%', width: 8, height: 8 }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="true-right"
            style={{ background: '#16a34a', top: '30%', width: 8, height: 8 }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false-right"
            style={{ background: '#dc2626', top: '70%', width: 8, height: 8 }}
            isConnectable={isConnectable}
          />
        </>
      ) : (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="output-bottom"
            style={{ background: '#f97316', width: 8, height: 8 }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="output-right"
            style={{ background: '#f97316', width: 8, height: 8 }}
            isConnectable={isConnectable}
          />
        </>
      )}
    </>
  );
});

LogicNode.displayName = 'LogicNode';

// Transform Node
export const TransformNode = memo(({ data, isConnectable }: NodeProps<BaseNodeData>) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="input-top"
        style={{ background: '#9333ea', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-left"
        style={{ background: '#9333ea', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <BaseNode data={data} type="transform" isConnectable={isConnectable} />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-bottom"
        style={{ background: '#9333ea', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output-right"
        style={{ background: '#9333ea', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
    </>
  );
});

TransformNode.displayName = 'TransformNode';

// Export all node types
export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  transform: TransformNode,
};