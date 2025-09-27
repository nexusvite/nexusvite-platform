'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  GitPullRequest,
  Repeat,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NodeTemplate {
  id: string;
  type: string;
  subType: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const nodeTemplates: { [key: string]: NodeTemplate[] } = {
  triggers: [
    {
      id: 'trigger_manual',
      type: 'trigger',
      subType: 'manual',
      label: 'Manual Trigger',
      description: 'Start workflow manually',
      icon: Play,
    },
    {
      id: 'trigger_webhook',
      type: 'trigger',
      subType: 'webhook',
      label: 'Webhook',
      description: 'Trigger via webhook call',
      icon: Webhook,
    },
    {
      id: 'trigger_schedule',
      type: 'trigger',
      subType: 'schedule',
      label: 'Schedule',
      description: 'Run on schedule/cron',
      icon: Calendar,
    },
    {
      id: 'trigger_email',
      type: 'trigger',
      subType: 'email',
      label: 'Email Received',
      description: 'Trigger when email received',
      icon: Mail,
    },
  ],
  actions: [
    {
      id: 'action_http',
      type: 'action',
      subType: 'http',
      label: 'HTTP Request',
      description: 'Make HTTP API call',
      icon: Globe,
    },
    {
      id: 'action_database',
      type: 'action',
      subType: 'database',
      label: 'Database',
      description: 'Query or modify database',
      icon: Database,
    },
    {
      id: 'action_email',
      type: 'action',
      subType: 'email',
      label: 'Send Email',
      description: 'Send email notification',
      icon: Send,
    },
    {
      id: 'action_slack',
      type: 'action',
      subType: 'slack',
      label: 'Slack',
      description: 'Send Slack message',
      icon: MessageSquare,
    },
    {
      id: 'action_entity',
      type: 'action',
      subType: 'entity',
      label: 'Create Entity',
      description: 'Create new entity record',
      icon: Plus,
    },
  ],
  logic: [
    {
      id: 'logic_condition',
      type: 'logic',
      subType: 'condition',
      label: 'If/Else',
      description: 'Conditional branching',
      icon: GitBranch,
    },
    {
      id: 'logic_switch',
      type: 'logic',
      subType: 'switch',
      label: 'Switch',
      description: 'Multiple condition paths',
      icon: GitPullRequest,
    },
    {
      id: 'logic_loop',
      type: 'logic',
      subType: 'loop',
      label: 'Loop',
      description: 'Iterate over items',
      icon: Repeat,
    },
    {
      id: 'logic_delay',
      type: 'logic',
      subType: 'delay',
      label: 'Delay',
      description: 'Wait before continuing',
      icon: Timer,
    },
  ],
  transform: [
    {
      id: 'transform_set',
      type: 'transform',
      subType: 'set',
      label: 'Set Variable',
      description: 'Set workflow variables',
      icon: Variable,
    },
    {
      id: 'transform_code',
      type: 'transform',
      subType: 'code',
      label: 'Code',
      description: 'Run custom code',
      icon: Code,
    },
    {
      id: 'transform_merge',
      type: 'transform',
      subType: 'merge',
      label: 'Merge Data',
      description: 'Combine multiple inputs',
      icon: GitMerge,
    },
    {
      id: 'transform_filter',
      type: 'transform',
      subType: 'filter',
      label: 'Filter',
      description: 'Filter array items',
      icon: Filter,
    },
  ],
};

const categoryColors: { [key: string]: string } = {
  triggers: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  actions: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  logic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  transform: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string, subType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('nodeSubType', subType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Node Library</h3>
        <p className="text-sm text-muted-foreground">
          Drag nodes to canvas
        </p>
      </div>

      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          defaultValue={['triggers', 'actions', 'logic', 'transform']}
          className="w-full"
        >
          {Object.entries(nodeTemplates).map(([category, nodes]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="capitalize font-medium">{category}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${categoryColors[category]}`}
                  >
                    {nodes.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <div className="space-y-2">
                  {nodes.map((node) => {
                    const Icon = node.icon;
                    return (
                      <Card
                        key={node.id}
                        className="p-3 cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type, node.subType)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {node.label}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {node.description}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}