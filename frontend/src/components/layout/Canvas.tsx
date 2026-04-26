import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useStore from '../../store';
import CustomNode from '../nodes/CustomNode';
import ContextEdge from '../edges/ContextEdge';
import { nodesApi } from '../../services/api/client';
import type { NodeData } from '../../types/node.types';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  context: ContextEdge,
};

const CanvasWrapper = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNode } = useStore();

  const handleNodeDragStop = async (_event: React.MouseEvent, node: Node<NodeData>) => {
    try {
      await nodesApi.updateNodePosition(node.id, node.position.x, node.position.y);
    } catch (error) {
      console.error('Failed to persist node position:', error);
    }
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node.id);
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="flex-1 w-full h-full bg-background-dark relative group/canvas">
      <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-40 pointer-events-none transform scale-150 origin-center"></div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background gap={24} size={2} color="#282e39" />
        <Controls className="fill-white stroke-white text-black" />
        <MiniMap
          nodeColor={(n) => {
            if (n.style?.background) return n.style.background as string;
            return '#282e39';
          }}
          maskColor="#111318"
          className="bg-surface-border"
        />
      </ReactFlow>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      </div>
    </div>
  );
};

export default CanvasWrapper;
