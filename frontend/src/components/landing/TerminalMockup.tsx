export default function TerminalMockup() {
    return <>
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
        <div className="relative bg-surface-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <span className="ml-4 text-[10px] text-white/30 uppercase tracking-widest font-bold">Terminal View</span>
            </div>
            <div className="p-8 font-mono text-sm">
                <p className="text-primary mb-2">➜ ~/snap-project</p>
                <p className="text-text-secondary italic">{"// Initializing context-aware neural engine..."}</p>
                <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5">
                    <span className="text-blue-400">query:</span> <span className="text-white">"Optimize my AWS architecture for cost."</span>
                </div>
                <div className="mt-6 flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-text-muted">Analyzing infrastructure...</span>
                </div>
            </div>
        </div>
    </>
}