import axios from 'axios';
import type { NodeData, CreateNodeRequest, Message, NodeStatus, NodeType } from '../../types/node.types';
import type { Node } from 'reactflow';

export const AUTH_TOKEN_KEY = 'snaplm_auth_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      // Optional: redirect to login
      // window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

interface TreeNodeResponse {
  node_id: string;
  title: string;
  status: NodeStatus;
  node_type: NodeType;
  children: TreeNodeResponse[];
  position: { x: number; y: number };
  message_count?: number;
  merge_parent_id?: string | null;
  inherited_context?: Record<string, any> | null;
}

interface SharedWorkspaceNodeResponse {
  node_id: string;
  title: string;
  status: NodeStatus;
  node_type: NodeType;
  parent_id: string | null;
  merge_parent_id?: string | null;
  inherited_context?: Record<string, any> | null;
  position: { x: number; y: number };
}

interface SharedWorkspaceResponse {
  project: Project;
  nodes: SharedWorkspaceNodeResponse[];
  messages_by_node: Record<
    string,
    Array<{
      message_id: string;
      role: Message['role'];
      content: string;
      timestamp: string;
      metadata?: Record<string, any>;
    }>
  >;
}

export const nodesApi = {
  getNodes: async (): Promise<Node<NodeData>[]> => {
    const response = await api.get<TreeNodeResponse[]>('/nodes/tree');
    const treeRoots = response.data;

    const flatten = (nodes: TreeNodeResponse[], parentId: string | null = null): Node<NodeData>[] => {
      let flatList: Node<NodeData>[] = [];
      for (const n of nodes) {
        const ctx = n.inherited_context;
        const inheritedContext = ctx
          ? [
              ...(ctx.facts?.slice(0, 2).map((f: any) => f.fact || String(f)) ?? []),
              ...(ctx.decisions?.slice(0, 1).map((d: any) => `[Decision] ${d.decision || String(d)}`) ?? []),
            ].join(' | ')
          : '';
        flatList.push({
          id: n.node_id,
          position: n.position || { x: 0, y: 0 },
          type: 'custom',
          data: {
            title: n.title,
            status: n.status,
            nodeType: n.node_type,
            parentId: parentId,
            mergeParentId: n.merge_parent_id || null,
            messageCount: n.message_count || 0,
            tokenCount: 0,
            lastActivity: new Date().toISOString(),
            inheritedContext,
          }
        });

        if (n.children && n.children.length > 0) {
          flatList = flatList.concat(flatten(n.children, n.node_id));
        }
      }
      return flatList;
    };

    return flatten(treeRoots);
  },

  createNode: async (data: CreateNodeRequest): Promise<any> => {
    const payload: Record<string, any> = {
      title: data.title,
      node_type: data.nodeType || 'standard'
    };

    if (data.parentId && data.parentId.trim() !== '') {
      payload.parent_id = data.parentId;
    }
    if (data.projectId) {
      payload.project_id = data.projectId;
    }

    if (data.mergeParentId && data.mergeParentId.trim() !== '') {
      payload.merge_parent_id = data.mergeParentId;
    }

    if (data.initialMessage && data.initialMessage.trim() !== '') {
      payload.initial_message = data.initialMessage;
    }

    const response = await api.post('/nodes', payload);
    return response.data;
  },

  sendMessage: async (nodeId: string, content: string): Promise<Message> => {
    const response = await api.post(`/nodes/${nodeId}/messages`, { content });
    return {
      id: response.data.message_id,
      role: response.data.role,
      content: response.data.content,
      timestamp: response.data.timestamp,
      metadata: response.data.metadata
    };
  },

  sendVisionMessage: async (nodeId: string, content: string, image: File): Promise<Message> => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('image', image);
    const response = await api.post(`/nodes/${nodeId}/messages/vision`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      id: response.data.message_id,
      role: response.data.role,
      content: response.data.content,
      timestamp: response.data.timestamp,
      metadata: response.data.metadata,
    };
  },

  archiveNodeBranch: async (nodeId: string): Promise<{ selected_node_id: string; archived_node_ids: string[] }> => {
    const response = await api.post<{ selected_node_id: string; archived_node_ids: string[] }>(`/nodes/${nodeId}/archive`);
    return response.data;
  },

  restoreNodeBranch: async (nodeId: string): Promise<{ selected_node_id: string; restored_node_ids: string[] }> => {
    const response = await api.post<{ selected_node_id: string; restored_node_ids: string[] }>(`/nodes/${nodeId}/restore`);
    return response.data;
  },

  mergeNode: async (data: { sourceNodeId: string; targetNodeId: string; summary: string }) => {
    const payload = {
      source_node_id: data.sourceNodeId,
      target_node_id: data.targetNodeId
    };
    const response = await api.post('/nodes/merge', payload);
    return response.data;
  },

  deleteNode: async (nodeId: string, cascade: boolean = false) => {
    const response = await api.post(`/nodes/${nodeId}/delete`, { cascade });
    return response.data;
  },

  getMessages: async (nodeId: string): Promise<Message[]> => {
    const response = await api.get(`/nodes/${nodeId}/messages`);
    return response.data.map((m: any) => ({
      id: m.message_id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      metadata: m.metadata || {}
    }));
  },

  summarizeNode: async (nodeId: string) => {
    const response = await api.post(`/nodes/${nodeId}/summarize`);
    return response.data;
  },

  copyNode: async (nodeId: string, newParentId?: string) => {
    const payload: Record<string, any> = {};
    if (newParentId) {
      payload.new_parent_id = newParentId;
    }
    const response = await api.post(`/nodes/${nodeId}/copy`, payload);
    return response.data;
  },

  getGraph: async (nodeId: string) => {
    const response = await api.get(`/nodes/${nodeId}/graph`);
    return response.data;
  },

  updateNodePosition: async (nodeId: string, x: number, y: number) => {
    const response = await api.patch(`/nodes/${nodeId}/position`, { x, y });
    return response.data;
  },

  proposeBranches: async (nodeId: string): Promise<{ node_id: string; proposals: BranchProposal[] }> => {
    const response = await api.post('/nodes/propose-branches', { node_id: nodeId });
    return response.data;
  },

  executeBranches: async (payload: {
    project_id: string;
    parent_id: string;
    selected_proposals: BranchProposal[];
  }): Promise<any[]> => {
    const response = await api.post('/nodes/execute-branches', payload);
    return response.data;
  },
};

export interface BranchProposal {
  title: string;
  node_type: string;
  initial_message: string;
  description: string;
}

// Project Types
export interface Project {
  project_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string | null;
  node_count: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  updateProject: async (projectId: string, data: Partial<CreateProjectRequest>): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${projectId}`, data);
    return response.data;
  },

  archiveProject: async (projectId: string): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${projectId}`, { is_archived: true });
    return response.data;
  },

  unarchiveProject: async (projectId: string): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${projectId}`, { is_archived: false });
    return response.data;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },

  getProjectNodes: async (projectId: string): Promise<Node<NodeData>[]> => {
    const response = await api.get<TreeNodeResponse[]>(`/projects/${projectId}/nodes/tree`);
    const treeRoots = response.data;

    const flatten = (nodes: TreeNodeResponse[], parentId: string | null = null): Node<NodeData>[] => {
      let flatList: Node<NodeData>[] = [];
      for (const n of nodes) {
        const ctx = n.inherited_context;
        const inheritedContext = ctx
          ? [
              ...(ctx.facts?.slice(0, 2).map((f: any) => f.fact || String(f)) ?? []),
              ...(ctx.decisions?.slice(0, 1).map((d: any) => `[Decision] ${d.decision || String(d)}`) ?? []),
            ].join(' | ')
          : '';
        flatList.push({
          id: n.node_id,
          position: n.position || { x: 0, y: 0 },
          type: 'custom',
          data: {
            title: n.title,
            status: n.status,
            nodeType: n.node_type,
            parentId: parentId,
            mergeParentId: n.merge_parent_id || null,
            messageCount: n.message_count || 0,
            tokenCount: 0,
            lastActivity: new Date().toISOString(),
            inheritedContext,
          }
        });

        if (n.children && n.children.length > 0) {
          flatList = flatList.concat(flatten(n.children, n.node_id));
        }
      }
      return flatList;
    };

    return flatten(treeRoots);
  },

  createProjectShare: async (projectId: string): Promise<{ share_token: string; share_url: string }> => {
    const response = await api.post(`/projects/${projectId}/share`);
    return response.data;
  },

  getSharedWorkspace: async (shareToken: string): Promise<SharedWorkspaceResponse> => {
    const response = await api.get<SharedWorkspaceResponse>(`/shared/${shareToken}`);
    return response.data;
  },
};

export interface User {
  id: string;
  email: string;
  username?: string;
  created_at?: string;
  is_2fa_enabled?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<any> => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.access_token);
    }
    return response.data;
  },

  register: async (email: string, password: string): Promise<{ message: string; user_id: string }> => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  setup2FA: async (): Promise<{ secret: string; uri: string }> => {
    const response = await api.post('/auth/2fa/setup');
    return response.data;
  },

  enable2FA: async (code: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/2fa/enable', { code });
    return response.data;
  },

  verify2FA: async (code: string, tempToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/2fa/verify', { code, temp_token: tempToken });
    if (response.data.access_token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.access_token);
    }
    return response.data;
  },

  disable2FA: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/2fa/disable');
    return response.data;
  },

  // Passkeys
  generatePasskeyRegistration: async (): Promise<any> => {
    const response = await api.get('/auth/passkeys/register/generate');
    return response.data;
  },
  
  verifyPasskeyRegistration: async (credential: any): Promise<any> => {
    const response = await api.post('/auth/passkeys/register/verify', credential);
    return response.data;
  },
  
  getPasskeyCredentials: async (): Promise<any[]> => {
    const response = await api.get('/auth/passkeys/credentials');
    return response.data;
  },
  
  deletePasskeyCredential: async (id: string): Promise<any> => {
    const response = await api.delete(`/auth/passkeys/credentials/${id}`);
    return response.data;
  },

  generatePasskeyAuthentication: async (email: string): Promise<any> => {
    const response = await api.post('/auth/passkeys/authenticate/generate', { email });
    return response.data;
  },

  verifyPasskeyAuthentication: async (email: string, credential: any): Promise<any> => {
    const response = await api.post('/auth/passkeys/authenticate/verify', { email, credential });
    if (response.data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    }
    return response.data;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/auth/me');
  }
};

export const canvasApi = {
  shareBranch: async (payload: {
    project_id: string;
    root_node_id: string;
    shared_with_user: string;
  }): Promise<{
    share_id: string;
    project_id: string;
    root_node_id: string;
    shared_with_user: string;
  }> => {
    const response = await api.post('/canvas/share-branch', {
      project_id: payload.project_id,
      root_node_id: payload.root_node_id,
      shared_with_user: payload.shared_with_user,
    });
    return response.data;
  },

  importBranch: async (shareId: string): Promise<any> => {
    const response = await api.get(`/canvas/import-branch/${shareId}`);
    return response.data;
  },
};

export default api;

