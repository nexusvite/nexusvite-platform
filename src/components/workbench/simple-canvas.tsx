'use client';

import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    data: { label: 'Test Node 1' },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'default',
    data: { label: 'Test Node 2' },
    position: { x: 300, y: 200 },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
  },
];

export function SimpleCanvas() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}