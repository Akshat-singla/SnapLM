import { useState, useEffect } from 'react';
import { Sparkles, X, GitBranch, Loader2, CheckSquare, Square, Zap, BookOpen, FlaskConical, Circle } from 'lucide-react';
import useStore from '../../store';
import type { BranchProposal } from '../../services/api/client';

const NODE_TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  exploration: { icon: <FlaskConical size={14} />, color: 'text-violet-400 bg-violet-400/10 border-violet-400/30', label: 'Exploration' },
  decision:    { icon: <Zap size={14} />,          color: 'text-amber-400  bg-amber-400/10  border-amber-400/30',  label: 'Decision'    },
  research:    { icon: <BookOpen size={14} />,      color: 'text-sky-400    bg-sky-400/10    border-sky-400/30',    label: 'Research'    },
  standard:    { icon: <Circle size={14} />,        color: 'text-slate-400  bg-slate-400/10  border-slate-400/30',  label: 'Standard'    },
};

const getTypeMeta = (type: string) =>
  NODE_TYPE_META[type] ?? NODE_TYPE_META['standard'];

const AgenticBranchModal = () => {
  const {
    agenticProposingNodeId,
    agenticProposals,
    agenticProposalsLoading,
    agenticProposeBranches,
    agenticExecuteBranches,
    clearAgenticProposals,
    nodes,
    loading,
    addToast,
  } = useStore();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // When new proposals arrive, select all by default
  useEffect(() => {
    if (agenticProposals.length > 0) {
      setSelected(new Set(agenticProposals.map((_, i) => i)));
    }
  }, [agenticProposals]);

  if (!agenticProposingNodeId) return null;

  const parentNode = nodes.find(n => n.id === agenticProposingNodeId);
  const isExecuting = loading['executeBranches'];

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleClose = () => {
    clearAgenticProposals();
    setSelected(new Set());
    setExpandedIdx(null);
  };

  const handleGenerate = () => {
    agenticProposeBranches(agenticProposingNodeId);
    setSelected(new Set());
  };

  const handleExecute = async () => {
    if (selected.size === 0) {
      addToast({ type: 'info', message: 'Select at least one branch to create' });
      return;
    }
    const chosenProposals = agenticProposals.filter((_, i) => selected.has(i));
    await agenticExecuteBranches(agenticProposingNodeId, chosenProposals);
    handleClose();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-[100]">
      <div className="bg-[#0f1117] w-full max-w-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-violet-900/30 to-transparent">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="text-violet-400" size={20} />
              AI Branch Planner
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              From: <span className="text-slate-300">{parentNode?.data.title ?? '…'}</span>
            </p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

          {/* Idle — no proposals yet */}
          {!agenticProposalsLoading && agenticProposals.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Sparkles size={28} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Let AI plan your next branches</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                  The AI will read your conversation and suggest 2–4 divergent directions to explore.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/30"
              >
                <Sparkles size={16} />
                Generate Suggestions
              </button>
            </div>
          )}

          {/* Loading */}
          {agenticProposalsLoading && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 size={32} className="text-violet-400 animate-spin" />
              <p className="text-sm text-slate-400">AI is brainstorming paths…</p>
            </div>
          )}

          {/* Proposals */}
          {!agenticProposalsLoading && agenticProposals.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">
                  {agenticProposals.length} suggestions — select which to create:
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(new Set(agenticProposals.map((_, i) => i)))} className="text-xs text-violet-400 hover:text-violet-300">All</button>
                  <span className="text-slate-600">·</span>
                  <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-300">None</button>
                </div>
              </div>

              <div className="space-y-2">
                {agenticProposals.map((proposal, idx) => {
                  const meta = getTypeMeta(proposal.node_type);
                  const isSelected = selected.has(idx);
                  const isExpanded = expandedIdx === idx;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-violet-500/50 bg-violet-500/5'
                          : 'border-white/8 bg-white/3 opacity-60'
                      }`}
                    >
                      <div
                        className="flex items-start gap-3 p-3.5"
                        onClick={() => toggleSelect(idx)}
                      >
                        {/* Checkbox */}
                        <div className={`mt-0.5 flex-shrink-0 transition-colors ${isSelected ? 'text-violet-400' : 'text-slate-600'}`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{proposal.title}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
                              {meta.icon}
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{proposal.description}</p>
                        </div>

                        {/* Expand toggle */}
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedIdx(isExpanded ? null : idx); }}
                          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors text-xs px-1.5 py-1 rounded hover:bg-white/10"
                        >
                          {isExpanded ? 'Less' : 'Preview'}
                        </button>
                      </div>

                      {/* Expanded starter message */}
                      {isExpanded && (
                        <div className="mx-3.5 mb-3.5 p-3 rounded-lg bg-black/30 border border-white/8">
                          <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                            <GitBranch size={12} />
                            AI starter message:
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed">{proposal.initial_message}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!agenticProposalsLoading && agenticProposals.length > 0 && (
          <div className="px-5 pb-5 pt-2 border-t border-white/8 flex items-center justify-between gap-3">
            <button
              onClick={handleGenerate}
              className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={13} />
              Regenerate
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting || selected.size === 0}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-violet-900/30"
              >
                {isExecuting ? (
                  <><Loader2 size={15} className="animate-spin" />Creating…</>
                ) : (
                  <><GitBranch size={15} />Create {selected.size} Branch{selected.size !== 1 ? 'es' : ''}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgenticBranchModal;
