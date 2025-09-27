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
      <Card className={`min-w-[200px] p-4 ${colorClass} border-2`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5" />
          <Badge variant="secondary" className="text-xs">
            {type}
          </Badge>
        </div>
        <div className="font-medium text-sm">{data.label}</div>
        {data.status && (
          <div className="mt-2">
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
              className="text-xs"
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
        id="output"
        style={{ background: '#16a34a' }}
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
        id="input"
        style={{ background: '#3b82f6' }}
        isConnectable={isConnectable}
      />
      <BaseNode data={data} type="action" isConnectable={isConnectable} />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ background: '#3b82f6' }}
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
        id="input"
        style={{ background: '#f97316' }}
        isConnectable={isConnectable}
      />
      <BaseNode data={data} type="logic" isConnectable={isConnectable} />
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ background: '#16a34a', left: '30%' }}
            isConnectable={isConnectable}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ background: '#dc2626', left: '70%' }}
            isConnectable={isConnectable}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          id="output"
          style={{ background: '#f97316' }}
          isConnectable={isConnectable}
        />
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
        id="input"
        style={{ background: '#9333ea' }}
        isConnectable={isConnectable}
      />
      <BaseNode data={data} type="transform" isConnectable={isConnectable} />
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{ background: '#9333ea' }}
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