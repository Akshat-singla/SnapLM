import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, Cpu, Network, Zap } from "lucide-react";

const STEPS = [
    {
        step: "01",
        title: "Context Ingestion",
        tagline: "Total Awareness",
        content: "SnapLM doesn't just read text; it maps relationships. By ingesting documentation and codebases into semantic fragments, we prepare the engine for high-fidelity retrieval.",
        details: ["Multi-format support (PDF, MD, TS)", "Semantic chunking", "Metadata preservation"],
        icon: <Cpu className="text-primary" size={24} />
    },
    {
        step: "02",
        title: "Recursive Engine",
        tagline: "Intelligence Refined",
        content: "Our engine summarizes parent nodes into 'Context DNA'. This ensures that as you branch, the LLM retains the core mission without the noise of previous iterations.",
        details: ["85% noise reduction", "Automated pruning", "Cross-node referencing"],
        icon: <Network className="text-blue-400" size={24} />
    },
    {
        step: "03",
        title: "Inherited Branching",
        tagline: "Logical Scalability",
        content: "Spawn infinite reasoning paths. Each branch inherits its parent's state, allowing you to pivot workflows instantly while keeping the model grounded.",
        details: ["Zero-clutter inheritance", "Instant state forking", "Parallel execution"],
        icon: <Zap className="text-yellow-400" size={24} />
    },
];

export default function HowItWorks() {
    const targetRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"],
    });

    const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    return (
        <section ref={targetRef} className="relative h-[400vh] bg-background-dark">
            {/* The Sticky Canvas */}
            <div className="sticky top-0 z-10 h-screen w-full overflow-hidden flex items-center">
                {/* Background Progress Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] select-none">
                    <h2 className="text-[30vw] font-black uppercase tracking-tighter">
                        Process
                    </h2>
                </div>

                <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Left Side: Fixed Heading & Number */}
                    <div className="relative h-[300px] flex flex-col justify-center">
                        {STEPS.map((step, i) => {
                            const start = i / STEPS.length;
                            const end = (i + 1) / STEPS.length;
                            const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
                            const x = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [-50, 0, 0, 50]);

                            return (
                                <motion.div
                                    key={i}
                                    style={{ opacity, x }}
                                    className="absolute inset-0 flex flex-col justify-center"
                                >
                                    <span className="text-primary font-mono text-xl font-bold mb-4 tracking-widest">
                                        PHASE_{step.step}
                                    </span>
                                    <h3 className="text-5xl md:text-7xl font-display font-bold leading-tight">
                                        {step.title.split(' ').map((word, idx) => (
                                            <span key={idx} className={idx === 1 ? "text-white/40" : ""}>
                                                {word}{" "}
                                            </span>
                                        ))}
                                    </h3>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Right Side: Details & Content */}
                    <div className="relative h-[450px]">
                        {STEPS.map((step, i) => {
                            const start = i / STEPS.length;
                            const end = (i + 1) / STEPS.length;
                            const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
                            const y = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [100, 0, 0, -100]);

                            return (
                                <motion.div
                                    key={i}
                                    style={{ opacity, y }}
                                    className="absolute inset-0 flex flex-col justify-center bg-surface-elevated/20 backdrop-blur-xl border border-white/5 p-8 md:p-12 rounded-[48px]"
                                >
                                    <div className="mb-6 bg-background-dark w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10">
                                        {step.icon}
                                    </div>
                                    <p className="text-xl text-text-secondary leading-relaxed mb-8">
                                        {step.content}
                                    </p>

                                    <div className="space-y-4">
                                        {step.details.map((detail, idx) => (
                                            <div key={idx} className="flex items-center gap-3 text-sm font-medium text-white/70">
                                                <CheckCircle2 size={16} className="text-primary" />
                                                {detail}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Progress Bar */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-[2px] bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        style={{ scaleX: progress, originX: 0 }}
                        className="w-full h-full bg-primary"
                    />
                </div>
            </div>
        </section>
    );
}