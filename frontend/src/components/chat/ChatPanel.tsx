import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckSquare,
  Minimize2,
  Send,
  Mic,
  History,
  Bot,
  CornerUpLeft,
  Share2,
  ImagePlus,
  XCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useStore from '../../store';
import type { Message, NodeData } from '../../types/node.types';
import { nodesApi } from '../../services/api/client';
import type { Node } from 'reactflow';

import { MessageSkeleton } from '../Skeleton';

const getAncestorChain = (nodeId: string, nodes: Node<NodeData>[]): Node<NodeData>[] => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const ancestors: Node<NodeData>[] = [];

  let currentNode = nodeMap.get(nodeId);
  while (currentNode?.data.parentId) {
    const parent = nodeMap.get(currentNode.data.parentId);
    if (parent) {
      ancestors.push(parent);
      currentNode = parent;
    } else {
      break;
    }
  }
  return ancestors;
};

const ChatPanel = () => {
  const {
    expandedNodeId,
    nodes,
    messages,
    setExpandedNode,
    addMessage: addStoreMessage,
    createShareLink,
    isReadOnly,
  } = useStore();

  const ancestors = useMemo(() => {
    if (!expandedNodeId) return [];
    return getAncestorChain(expandedNodeId, nodes);
  }, [expandedNodeId, nodes]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [_isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const node = nodes.find((n) => n.id === expandedNodeId);

  useEffect(() => {
    if (!expandedNodeId) return;

    if (messages[expandedNodeId]?.length > 0) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const fetchedMessages = await nodesApi.getMessages(expandedNodeId);
        fetchedMessages.forEach((msg) => addStoreMessage(expandedNodeId, msg));
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [expandedNodeId, messages, addStoreMessage]);

  if (!expandedNodeId || !node) return null;

  const nodeMessages = messages[expandedNodeId] || [];

  const handleClose = () => setExpandedNode(null);

  const handleSendMessage = async () => {
    if (isReadOnly) return;
    if (!inputText.trim() && !selectedImage) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText || '(image)',
      timestamp: new Date().toISOString(),
      hasImage: !!selectedImage,
    };

    addStoreMessage(node.id, userMsg);
    const capturedImage = selectedImage;
    setInputText('');
    clearImage();
    setIsTyping(true);

    try {
      let response: Message;
      if (capturedImage) {
        response = await nodesApi.sendVisionMessage(
          node.id,
          userMsg.content === '(image)' ? 'Describe this image.' : userMsg.content,
          capturedImage
        );
      } else {
        response = await nodesApi.sendMessage(node.id, userMsg.content);
      }
      addStoreMessage(node.id, response);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md z-[100]"
      >
        <div className="flex flex-col w-full max-w-[1000px] h-full max-h-[85vh] bg-background-dark/95 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative">
          <div className="flex flex-col border-b border-white/10 bg-panel-header/80 backdrop-blur-md z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <CornerUpLeft size={16} className="text-slate-400" />
                {[...ancestors].reverse().map((ancestor) => (
                  <span key={ancestor.id} className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm font-medium">{ancestor.data.title}</span>
                    <span className="text-slate-400 text-sm">/</span>
                  </span>
                ))}
                  <span className="text-white text-sm font-bold bg-primary/20 px-2 py-0.5 rounded text-primary">
                  {node.data.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => void createShareLink()}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Share2 size={14} />
                    Brain Sharing
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 bg-gradient-to-r from-panel-header to-background-dark">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-surface-elevated shadow-sm">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                  <History size={20} />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-bold uppercase tracking-wide">Lineage Context</p>
                    <span className="text-xs text-text-muted bg-surface-border px-2 py-1 rounded">
                      {ancestors.length} Parent Node{ancestors.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm font-normal leading-relaxed text-left">
                    {ancestors.length > 0 ? (
                      <>
                        This node inherits context from{' '}
                        {ancestors.slice(0, 3).map((ancestor, index) => (
                          <span key={ancestor.id}>
                            <span className="text-primary font-medium">{ancestor.data.title}</span>
                            {index < Math.min(ancestors.length, 3) - 1 && (
                              <span>{index === Math.min(ancestors.length, 3) - 2 ? ' and ' : ', '}</span>
                            )}
                          </span>
                        ))}
                        {ancestors.length > 3 && <span> (+{ancestors.length - 3} more)</span>}
                        .
                      </>
                    ) : (
                      <>This is a root node with no parent context.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-background-dark">
            <div className="flex justify-center">
              <span className="text-xs font-medium text-text-muted px-3 py-1 rounded-full border border-white/10 bg-surface-elevated">
                Today, 10:23 AM
              </span>
            </div>

            {_isLoadingMessages && (
              <>
                <MessageSkeleton />
                <MessageSkeleton />
                <MessageSkeleton />
              </>
            )}

            {nodeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'items-start'} gap-3 group`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-green-500'}`}
                >
                  {msg.role === 'user' ? 'U' : <Bot size={18} />}
                </div>
                <div className={`flex flex-col gap-1 max-w-[70%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  {msg.role !== 'user' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Fractal AI</span>
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-2xl shadow-md text-left ${msg.role === 'user' ? 'rounded-tr-sm bg-primary text-white' : 'rounded-tl-none bg-surface-elevated text-text-secondary'}`}
                  >
                    {msg.role === 'user' ? (
                      <div>
                        {msg.hasImage && (
                          <div className="flex items-center gap-1 text-white/70 text-xs mb-1">
                            <ImagePlus size={12} />
                            <span>Image attached</span>
                          </div>
                        )}
                        <p className="text-sm font-normal leading-relaxed font-body whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-background-dark prose-pre:p-3 prose-pre:rounded-lg prose-code:bg-surface-border prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-500 text-sm italic ml-14">
                <span className="animate-pulse">AI is thinking...</span>
              </div>
            )}
          </div>

          {isReadOnly ? (
            <div className="p-4 bg-background-dark border-t border-white/10 text-center text-sm text-text-muted">
              This is a shared read-only workspace. You cannot send messages.
            </div>
          ) : (
            <div className="p-4 bg-background-dark border-t border-white/10">
              {imagePreview && (
                <div className="relative inline-block mb-2 ml-1">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="h-16 w-16 object-cover rounded-lg border border-white/10 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 text-text-muted hover:text-red-400 transition-colors"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}
              <div className="relative flex items-end gap-2 bg-surface-elevated border border-white/10 rounded-xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-primary rounded-lg transition-colors self-end mb-0.5"
                >
                  <CheckSquare size={20} />
                </button>
                <textarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-text-heading dark:text-white placeholder-slate-400 resize-none h-auto min-h-[44px] max-h-[120px] py-3 text-sm font-body"
                  placeholder="Ask follow up questions..."
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                />
                <div className="flex items-center gap-1 pb-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 rounded-lg transition-colors ${selectedImage ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                    title="Attach image"
                  >
                    <ImagePlus size={20} />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Mic size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatPanel;
