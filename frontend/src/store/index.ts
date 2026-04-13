import { create } from 'zustand';
import { type Node, type Edge, type Connection, addEdge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from 'reactflow';
import type { NodeData, Message } from '../types/node.types';
import { canvasApi, nodesApi, projectsApi, type Project, authApi, type User, default as api } from '../services/api/client';

interface AppState {
  archiveNodeBranch: (nodeId: string) => Promise<void>;
  // Auth State
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Canvas State
  nodes: Node<NodeData>[];
  edges: Edge[];
  isInitialized: boolean;
  isReadOnly: boolean;

  // Project State
  projects: Project[];
  currentProjectId: string | null;
  createProjectModalOpen: boolean;

  // UI State
  selectedNodeId: string | null;
  expandedNodeId: string | null;
  creatingBranchNodeId: string | null; // ID of the node being branched from
  mergingNodeId: string | null; // ID of the node being merged
  highlightedPath: string[]; // Node IDs in the context path
  messages: Record<string, Message[]>; // Chat messages per node
  loading: Record<string, boolean>; // generic loading states by key
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>;

  // Auth Actions
  login: (email: string, password: string) => Promise<{ success: boolean; code?: string; tempToken?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; code?: string; tempToken?: string }>;
  verify2FA: (code: string, tempToken: string) => Promise<{ success: boolean; code?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // Project Actions
  fetchProjects: () => Promise<void>;
  setCurrentProject: (id: string | null) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  archiveProject: (id: string) => Promise<void>;
  unarchiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  setCreateProjectModalOpen: (open: boolean) => void;
  createShareLink: () => Promise<string | null>;
  loadSharedWorkspace: (shareToken: string) => Promise<void>;
  loadSharedBranch: (shareId: string) => Promise<void>;
  saveViewport: (projectId: string, viewport: { x: number; y: number; zoom: number }) => void;
  getViewport: (projectId: string) => { x: number; y: number; zoom: number } | null;

  // Node Actions
  fetchNodes: () => Promise<void>;
  setNodes: (nodes: Node<NodeData>[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: Node<NodeData>) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  removeNode: (id: string) => void;

  setSelectedNode: (id: string | null) => void;
  setExpandedNode: (id: string | null) => void;
  setCreatingBranchNodeId: (id: string | null) => void;
  setMergingNodeId: (id: string | null) => void;
  setHighlightedPath: (path: string[]) => void;

  addMessage: (nodeId: string, message: Message) => void;

  addToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  removeToast: (id: string) => void;
}

// Converts inherited_context JSON into a readable summary string for display
const formatInheritedContext = (ctx: Record<string, unknown> | null | undefined): string => {
  if (!ctx) return '';
  const parts: string[] = [];
  const facts = ctx['facts'];
  if (Array.isArray(facts) && facts.length) {
    parts.push(
      facts
        .slice(0, 2)
        .map((f: unknown) =>
          typeof f === 'object' && f !== null && 'fact' in f
            ? String((f as { fact: unknown }).fact)
            : String(f)
        )
        .join('; ')
    );
  }
  const decisions = ctx['decisions'];
  if (Array.isArray(decisions) && decisions.length) {
    parts.push(
      decisions
        .slice(0, 1)
        .map((d: unknown) =>
          typeof d === 'object' && d !== null && 'decision' in d
            ? `[Decision] ${String((d as { decision: unknown }).decision)}`
            : `[Decision] ${String(d)}`
        )
        .join('; ')
    );
  }
  return parts.join(' | ');
};

// Helper to build edges from nodes based on parent-child relationships
const buildEdgesFromNodes = (nodes: Node<NodeData>[]): Edge[] => {
  const edges: Edge[] = [];
  for (const node of nodes) {
    // Primary parent edge
    if (node.data.parentId) {
      edges.push({
        id: `e-${node.data.parentId}-${node.id}`,
        source: node.data.parentId,
        target: node.id,
        type: 'context',
        animated: false,
        style: { strokeWidth: 1.5 }
      });
    }
    // Secondary parent edge (from merge)
    if (node.data.mergeParentId) {
      edges.push({
        id: `e-merge-${node.data.mergeParentId}-${node.id}`,
        source: node.data.mergeParentId,
        target: node.id,
        type: 'context',
        animated: false,
        style: { strokeWidth: 1.5, strokeDasharray: '5,5' } // Dashed for merge edges
      });
    }
  }
  return edges;
};

const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,

  nodes: [],
  edges: [],
  isInitialized: false,
  isReadOnly: false,

  projects: [],
  currentProjectId: null,
  createProjectModalOpen: false,

  selectedNodeId: null,
  expandedNodeId: null,
  creatingBranchNodeId: null,
  mergingNodeId: null,
  highlightedPath: [],
  messages: {},
  loading: {},
  toasts: [],

  login: async (email, password) => {
    try {
      set({ authLoading: true });
      const response = await authApi.login(email, password);

      if (response.requires_2fa) {
        set({ authLoading: false });
        return { success: false, code: 'requires_2fa', tempToken: response.temp_token };
      }

      set({
        user: response.user,
        isAuthenticated: true,
        authLoading: false
      });
      get().addToast({ type: 'success', message: 'Welcome back!' });
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      const detail = error.response?.data?.detail;
      set({ authLoading: false });
      if (detail === 'Invalid credentials') {
        return { success: false, code: 'invalid_credentials' };
      }
      get().addToast({ type: 'error', message: 'Something went wrong' });
      return { success: false, code: 'error' };
    }
  },

  verify2FA: async (code: string, tempToken: string) => {
    try {
      set({ authLoading: true });
      const response = await authApi.verify2FA(code, tempToken);
      set({
        user: response.user,
        isAuthenticated: true,
        authLoading: false
      });
      get().addToast({ type: 'success', message: 'Signed in securely!' });
      return { success: true };
    } catch (error: any) {
      console.error('2FA verification failed:', error);
      set({ authLoading: false });
      return { success: false, code: 'invalid_code' };
    }
  },

  signup: async (email, password) => {
    try {
      set({ authLoading: true });
      await authApi.register(email, password);
      // Automatically login after signup
      return await get().login(email, password);
    } catch (error: any) {
      console.error('Signup failed:', error);
      const detail = error.response?.data?.detail;
      set({ authLoading: false });

      if (detail === 'User already exists') {
        return { success: false, code: 'user_exists' };
      }

      get().addToast({ type: 'error', message: 'Registration failed' });
      return { success: false, code: 'error' };
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false, projects: [], currentProjectId: null });
    get().addToast({ type: 'info', message: 'Logged out successfully' });
  },

  checkAuth: async () => {
    try {
      set({ authLoading: true });
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, authLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, authLoading: false });
    }
  },

  fetchProjects: async () => {
    try {
      set({ loading: { ...get().loading, projects: true } });
      const projects = await projectsApi.getProjects();
      set({ projects, loading: { ...get().loading, projects: false } });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      get().addToast({ type: 'error', message: 'Failed to load projects' });
      set({ loading: { ...get().loading, projects: false } });
    }
  },

  setCurrentProject: async (id: string | null) => {
    set({ currentProjectId: id, nodes: [], edges: [], isInitialized: false, isReadOnly: false });

    if (id) {
      try {
        set({ loading: { ...get().loading, nodes: true } });
        const nodes = await projectsApi.getProjectNodes(id);
        const edges = buildEdgesFromNodes(nodes);
        set({ nodes, edges, isInitialized: true, loading: { ...get().loading, nodes: false } });
      } catch (error) {
        console.error('Failed to fetch project nodes:', error);
        get().addToast({ type: 'error', message: 'Failed to load project nodes' });
        set({ isInitialized: true, loading: { ...get().loading, nodes: false } });
      }
    } else {
      set({ isInitialized: true });
    }
  },

  createProject: async (name: string, description?: string) => {
    try {
      const project = await projectsApi.createProject({ name, description });
      set({ projects: [project, ...get().projects] });
      get().addToast({ type: 'success', message: `Created project: ${name}` });
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      get().addToast({ type: 'error', message: 'Failed to create project' });
      return null;
    }
  },

  archiveProject: async (id: string) => {
    const { projects, currentProjectId } = get();
    const previousProjects = projects;

    // Optimistic update for instant UI feedback.
    const optimisticProjects = projects.map((project) =>
      project.project_id === id ? { ...project, is_archived: true } : project
    );
    set({ projects: optimisticProjects });

    if (currentProjectId === id) {
      const nextActiveProject = optimisticProjects.find((project) => !project.is_archived);
      await get().setCurrentProject(nextActiveProject?.project_id ?? null);
    }

    try {
      const archivedProject = await projectsApi.archiveProject(id);
      set({
        projects: get().projects.map((project) =>
          project.project_id === id
            ? { ...project, ...archivedProject, is_archived: true }
            : project
        ),
      });
    } catch (error) {
      console.error('Failed to archive project:', error);
      try {
        const refreshed = await projectsApi.getProjects();
        set({ projects: refreshed });
      } catch {
        set({ projects: previousProjects });
      }
      get().addToast({ type: 'error', message: 'Archive update had a response error; list refreshed from server.' });
    }
  },

  unarchiveProject: async (id: string) => {
    const previousProjects = get().projects;

    // Optimistic update for instant UI feedback.
    set({
      projects: previousProjects.map((project) =>
        project.project_id === id ? { ...project, is_archived: false } : project
      ),
    });

    try {
      const unarchivedProject = await projectsApi.unarchiveProject(id);
      set({
        projects: get().projects.map((project) =>
          project.project_id === id
            ? { ...project, ...unarchivedProject, is_archived: false }
            : project
        ),
      });
    } catch (error) {
      console.error('Failed to unarchive project:', error);
      try {
        const refreshed = await projectsApi.getProjects();
        set({ projects: refreshed });
      } catch {
        set({ projects: previousProjects });
      }
      get().addToast({ type: 'error', message: 'Restore update had a response error; list refreshed from server.' });
    }
  },

  deleteProject: async (id: string) => {
    try {
      await projectsApi.deleteProject(id);
      set({ 
        projects: get().projects.filter(p => p.project_id !== id),
        currentProjectId: get().currentProjectId === id ? null : get().currentProjectId
      });
      get().addToast({ type: 'success', message: 'Project deleted permanently' });
    } catch (error) {
      console.error('Failed to delete project:', error);
      get().addToast({ type: 'error', message: 'Failed to delete project' });
    }
  },

  deleteAccount: async () => {
    try {
      await authApi.deleteAccount();
      get().logout();
      get().addToast({ type: 'success', message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Failed to delete account:', error);
      get().addToast({ type: 'error', message: 'Failed to delete account' });
    }
  },

  archiveNodeBranch: async (nodeId: string) => {
    try {
      const response = await api.post(`/nodes/${nodeId}/archive`);

      if (response.status !== 200) throw new Error('Failed to archive node branch');

      const data = response.data;
      const archivedIds = new Set<string>(data.archived_node_ids ?? []);

      set((state) => ({
        selectedNodeId: nodeId,
        nodes: state.nodes.map((node) =>
          archivedIds.has(node.id)
            ? {
              ...node,
              data: {
                ...node.data,
                isArchived: true,
              },
            }
            : node
        ),
      }));

      get().addToast({ type: 'success', message: 'Branch archived successfully' });
    } catch (error) {
      console.error('archiveNodeBranch error:', error);
      get().addToast({ type: 'error', message: 'Failed to archive branch' });
      throw error;
    }
  },

  setCreateProjectModalOpen: (open: boolean) => {
    set({ createProjectModalOpen: open });
  },

  createShareLink: async () => {
    const { currentProjectId } = get();
    if (!currentProjectId) {
      get().addToast({ type: 'error', message: 'Select a project before sharing' });
      return null;
    }

    try {
      const response = await projectsApi.createProjectShare(currentProjectId);
      const shareLink = `${window.location.origin}/app/shared/${response.share_token}`;
      try {
        await navigator.clipboard.writeText(shareLink);
        get().addToast({ type: 'success', message: 'Share link copied to clipboard' });
      } catch {
        get().addToast({ type: 'info', message: `Share link: ${shareLink}` });
      }
      return shareLink;
    } catch (error) {
      console.error('Failed to create share link:', error);
      get().addToast({ type: 'error', message: 'Failed to create share link' });
      return null;
    }
  },

  loadSharedWorkspace: async (shareToken: string) => {
    try {
      set({ loading: { ...get().loading, sharedWorkspace: true } });
      const response = await projectsApi.getSharedWorkspace(shareToken);

      const nodes: Node<NodeData>[] = response.nodes.map((n) => ({
        id: n.node_id,
        position: n.position || { x: 0, y: 0 },
        type: 'custom',
        data: {
          title: n.title,
          status: n.status,
          nodeType: n.node_type,
          parentId: n.parent_id,
          mergeParentId: n.merge_parent_id || null,
          messageCount: response.messages_by_node[n.node_id]?.length || 0,
          tokenCount: 0,
          lastActivity: new Date().toISOString(),
          inheritedContext: formatInheritedContext(n.inherited_context),
          isReadOnly: true,
        }
      }));

      const mappedMessages = Object.fromEntries(
        Object.entries(response.messages_by_node).map(([nodeId, msgs]) => [
          nodeId,
          msgs.map((m) => ({
            id: m.message_id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            metadata: m.metadata || {},
          }))
        ])
      );

      const existingProjects = get().projects;
      const hasProject = existingProjects.some((p) => p.project_id === response.project.project_id);
      const projects = hasProject ? existingProjects : [response.project, ...existingProjects];

      const edges = buildEdgesFromNodes(nodes);
      set({
        projects,
        currentProjectId: response.project.project_id,
        nodes,
        edges,
        messages: mappedMessages,
        isInitialized: true,
        isReadOnly: true,
        loading: { ...get().loading, sharedWorkspace: false },
      });

      get().addToast({ type: 'success', message: 'Shared workspace loaded' });
    } catch (error) {
      console.error('Failed to load shared workspace:', error);
      get().addToast({ type: 'error', message: 'Failed to load shared workspace' });
      set({ loading: { ...get().loading, sharedWorkspace: false } });
    }
  },

  loadSharedBranch: async (shareId: string) => {
    try {
      set({ loading: { ...get().loading, sharedBranch: true } });
      const data = await canvasApi.importBranch(shareId);

      const nodes: Node<NodeData>[] = data.nodes.map((n: any) => ({
        id: n.node_id,
        position: n.position || { x: 0, y: 0 },
        type: 'custom',
        data: {
          title: n.title,
          status: n.status,
          nodeType: n.node_type,
          parentId: n.parent_id,
          mergeParentId: n.merge_parent_id || null,
          messageCount: data.messages[n.node_id]?.length || 0,
          tokenCount: 0,
          lastActivity: new Date().toISOString(),
          inheritedContext: formatInheritedContext(n.inherited_context as Record<string, unknown> | null),
          isReadOnly: true,
        },
      }));

      const edges: Edge[] =
        data.edges && data.edges.length > 0
          ? data.edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: 'context',
            animated: false,
            style:
              e.type === 'merge'
                ? { strokeWidth: 1.5, strokeDasharray: '5,5' }
                : { strokeWidth: 1.5 },
          }))
          : buildEdgesFromNodes(nodes);

      const mappedMessages = Object.fromEntries(
        Object.entries(data.messages).map(([nodeId, msgs]: [string, any]) => [
          nodeId,
          msgs.map((m: any) => ({
            id: m.message_id,
            role: m.role as Message['role'],
            content: m.content,
            timestamp: m.timestamp,
            metadata: m.metadata || {},
          })),
        ])
      );

      const meta = data.meta;
      const projectId = meta?.project_id ?? `branch-${shareId}`;
      const project: Project = {
        project_id: projectId,
        name: meta?.project_name ? `${meta.project_name} (shared branch)` : 'Shared branch',
        description: null,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: null,
        node_count: data.nodes.length,
      };

      const existingProjects = get().projects;
      const hasProject = existingProjects.some((p) => p.project_id === project.project_id);
      const projects = hasProject ? existingProjects : [project, ...existingProjects];

      set({
        projects,
        currentProjectId: project.project_id,
        nodes,
        edges,
        messages: mappedMessages,
        isInitialized: true,
        isReadOnly: true,
        loading: { ...get().loading, sharedBranch: false },
      });

      get().addToast({ type: 'success', message: 'Shared branch loaded' });
    } catch (error) {
      console.error('Failed to load shared branch:', error);
      get().addToast({ type: 'error', message: 'Failed to load shared branch' });
      set({ loading: { ...get().loading, sharedBranch: false } });
    }
  },

  // Node Actions
  fetchNodes: async () => {
    try {
      set({ loading: { ...get().loading, nodes: true } });
      const nodes = await nodesApi.getNodes();
      const edges = buildEdgesFromNodes(nodes);
      set({ nodes, edges, isInitialized: true, loading: { ...get().loading, nodes: false } });
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
      get().addToast({ type: 'error', message: 'Failed to load nodes from server' });
      set({ isInitialized: true, loading: { ...get().loading, nodes: false } });
    }
  },

  setNodes: (nodes) => {
    const edges = buildEdgesFromNodes(nodes);
    set({ nodes, edges });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, type: 'context' }, get().edges),
    });
  },

  addNode: (node) => {
    set((state) => {
      const newNodes = [...state.nodes, node];
      const newEdges = buildEdgesFromNodes(newNodes);
      return { nodes: newNodes, edges: newEdges };
    });
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
  },

  removeNode: (id) => {
    const { nodes, edges } = get();
    const nodeToRemove = nodes.find(n => n.id === id);

    // Prevent deleting root
    if (nodeToRemove?.data.nodeType === 'root') {
      get().addToast({ type: 'error', message: 'Cannot delete root node' });
      return;
    }

    // Find parent of the deleted node (Grandparent to children)
    const parentId = nodeToRemove?.data.parentId;

    // Find children of the deleted node
    const children = nodes.filter(n => n.data.parentId === id);

    // Re-parent children
    const updatedNodes = nodes
      .filter(n => n.id !== id) // Remove target node
      .map(n => {
        if (n.data.parentId === id) {
          return {
            ...n,
            data: { ...n.data, parentId: parentId || null } // Set to grandparent or null if no grandparent
          };
        }
        return n;
      });

    let updatedEdges = edges.filter(e => e.source !== id && e.target !== id);

    if (parentId) {
      const newEdges = children.map(child => ({
        id: `e-${parentId}-${child.id}`,
        source: parentId,
        target: child.id,
        type: 'context',
        animated: false,
        style: { strokeWidth: 1.5 }
      }));
      updatedEdges = [...updatedEdges, ...newEdges];
    }

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      expandedNodeId: get().expandedNodeId === id ? null : get().expandedNodeId,
    });
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });

    if (!id) {
      set({ highlightedPath: [] });
      return;
    }

    const { nodes } = get();
    const path: string[] = [];
    let currentId: string | null = id;

    while (currentId) {
      path.unshift(currentId);
      const node = nodes.find(n => n.id === currentId);
      currentId = node?.data.parentId || null;
    }

    set({ highlightedPath: path });
  },
  setExpandedNode: (id) => set({ expandedNodeId: id }),
  setCreatingBranchNodeId: (id) => set({ creatingBranchNodeId: id }),
  setMergingNodeId: (id) => set({ mergingNodeId: id }),
  setHighlightedPath: (path) => set({ highlightedPath: path }),

  addMessage: (nodeId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [nodeId]: [...(state.messages[nodeId] || []), message]
      }
    }));
  },

  addToast: ({ type, message }) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => get().removeToast(id), 3000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  saveViewport: (projectId, viewport) => {
    localStorage.setItem(`viewport-${projectId}`, JSON.stringify(viewport));
  },
  getViewport: (projectId) => {
    const saved = localStorage.getItem(`viewport-${projectId}`);
    return saved ? JSON.parse(saved) : null;
  },
}));

export default useStore;

