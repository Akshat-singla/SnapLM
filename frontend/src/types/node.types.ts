export type NodeType = 'root' | 'standard' | 'exploration';
export type NodeStatus = 'active' | 'frozen' | 'deleted' | 'archived';

export interface NodeData {
  title: string;
  nodeType: NodeType;
  status: NodeStatus;
  parentId: string | null;
  mergeParentId?: string | null;
  messageCount: number;
  tokenCount: number;
  inheritedContext?: string;
  lastActivity: string;
  isReadOnly?: boolean; // true when viewing a shared workspace
  isArchived?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'summary';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
  hasImage?: boolean;
}

export interface CreateNodeRequest {
  title: string;
  parentId: string | null;
  mergeParentId?: string | null;
  projectId?: string | null;
  nodeType: NodeType;
  initialMessage?: string;
}

export interface MergeNodeRequest {
  sourceId: string;
  targetId: string;
}
