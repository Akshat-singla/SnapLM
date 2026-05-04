import React from 'react';
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

import { NodeSkeleton } from '../Skeleton';

const CanvasWrapper = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNode, loading, currentProjectId, saveViewport, getViewport } = useStore();

  const initialViewport = React.useMemo(() => {
    if (currentProjectId) return getViewport(currentProjectId);
    return null;
  }, [currentProjectId, getViewport]);

  const handleNodeDragStop = async (_event: React.MouseEvent, node: Node<NodeData>) => {
    try {
      await nodesApi.updateNodePosition(node.id, node.position.x, node.position.y);
    } catch (error) {
      console.error('Failed to persist node position:', error);
    }
  };

  const handleMoveEnd = (_event: any, viewport: { x: number; y: number; zoom: number }) => {
    if (currentProjectId) {
      saveViewport(currentProjectId, viewport);
    }
  };

  const handleNodeClick = (_event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node.id);
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  if (loading.nodes) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-background-dark relative">
        <div className="grid grid-cols-2 gap-8 opacity-40">
           <NodeSkeleton />
           <NodeSkeleton />
           <NodeSkeleton />
           <NodeSkeleton />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <p className="text-primary font-bold tracking-widest animate-pulse">SYNCHRONIZING CANVAS...</p>
        </div>
      </div>
    )
  }

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
        onMoveEnd={handleMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={initialViewport || undefined}
        fitView={!initialViewport}
        className="bg-transparent"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background gap={32} size={1} color="rgba(255,255,255,0.05)" />
        <Controls 
          className="bg-surface-elevated border border-white/10 rounded-lg overflow-hidden shadow-2xl [&_button]:bg-transparent [&_button]:border-white/5 [&_button:hover]:bg-white/10 [&_svg]:fill-white" 
        />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.status === 'active') return 'var(--color-primary)';
            if (n.data?.status === 'frozen') return 'var(--color-node-frozen)';
            return 'rgba(255,255,255,0.1)';
          }}
          maskColor="rgba(0,0,0,0.6)"
          className="bg-background-dark/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          style={{ width: 200, height: 150 }}
        />
      </ReactFlow>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      </div>
    </div>
  );
};

export default CanvasWrapper;
