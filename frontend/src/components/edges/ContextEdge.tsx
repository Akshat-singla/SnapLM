import { BaseEdge, type EdgeProps, getBezierPath } from 'reactflow';
import useStore from '../../store';

const ContextEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const highlightedPath = useStore((state) => state.highlightedPath);
  const highlightedEdges = useStore((state) => state.highlightedEdges);
  const selectedNodeId = useStore((state) => state.selectedNodeId);

  const edgeKey = `${source}->${target}`;
  const isHighlighted =
    highlightedEdges.includes(edgeKey) ||
    (highlightedPath.includes(source) && highlightedPath.includes(target));
  const isDimmed = selectedNodeId && !isHighlighted;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHighlighted ? '#135bec' : (isDimmed ? '#334155' : '#475569'),
          strokeWidth: isHighlighted ? 3 : 1.5,
          opacity: isDimmed ? 0.3 : 1,
          transition: 'all 0.3s ease',
          strokeDasharray: isHighlighted ? '5 5' : '0',
          animation: isHighlighted ? 'dashdraw 0.5s linear infinite' : 'none',
        }}
      />
    </>
  );
};

export default ContextEdge;
