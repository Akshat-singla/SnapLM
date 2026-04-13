import { motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Zap, Brain, ArrowRight, GanttChart, Code2, ShieldCheck, Globe } from "lucide-react";
import StickyUpdate from "../components/landing/StickyUpdate";
import StaggeredText from "../components/animated/StaggeredText";
import TerminalMockup from "../components/landing/TerminalMockup";
import HowItWorks from "../components/landing/HowItWorks";
import Header from "../components/landing/Header";
import NetworkBackground from "../components/landing/NetworkBackground";

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function HomePage() {
    return (
        <div className="bg-background-dark text-white font-body min-h-screen selection:bg-primary/30">
            <StickyUpdate />

            {/* Navbar */}
            <Header />

            {/* Hero Section */}
            <section className="relative pt-20 pb-32">
                <div className="absolute inset-0 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] z-0">
                    <NetworkBackground />
                </div>

                {/* Dynamic Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
                            <Sparkles size={14} /> <span>v2.0 is now live</span>
                        </div>
                        <h2 className="font-display text-4xl lg:text-7xl font-bold">
                            <StaggeredText text="Your Branching LLM workspace" /><br />
                        </h2>
                        <p className="text-text-secondary text-xl max-w-lg leading-relaxed">
                            Deploy custom LLM agents, automate complex chains, and scale your intelligence without the overhead.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link to="/auth/signup">
                                <button className="bg-primary hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] px-8 py-4 rounded-2xl text-white font-bold flex items-center gap-3 transition-all">
                                    Start Building <ArrowRight size={20} />
                                </button>
                            </Link>
                            <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer">
                                <button className="bg-surface-elevated/50 border border-white/10 px-8 py-4 rounded-2xl hover:bg-surface-elevated transition-colors backdrop-blur-sm">
                                    Watch the Keynote
                                </button>
                            </a>
                        </div>
                    </motion.div>

                    {/* Enhanced Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative group"
                    >
                        <TerminalMockup />
                    </motion.div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-32">
                <div className="text-center mb-20">
                    <h3 className="text-4xl md:text-5xl font-display font-bold mb-4">Powerful from day one.</h3>
                    <p className="text-text-secondary text-lg">Everything you need to create and run fail proof LLMs.</p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-6 gap-4"
                >
                    {/* Feature 1: Large */}
                    <motion.div variants={itemVariants} className="md:col-span-3 bg-surface-elevated border border-white/10 p-8 rounded-3xl hover:border-primary/50 transition-colors">
                        <Brain className="text-primary mb-6" size={32} />
                        <h4 className="text-2xl font-bold mb-3">Semantic Logic Engine</h4>
                        <p className="text-text-secondary">Our engine understands intent, not just keywords. Build workflows that feel like they have a PhD in your business logic.</p>
                    </motion.div>

                    {/* Feature 2: Small */}
                    <motion.div variants={itemVariants} className="md:col-span-3 bg-surface-elevated border border-white/10 p-8 rounded-3xl hover:border-primary/50 transition-colors">
                        <Zap className="text-yellow-400 mb-6" size={32} />
                        <h4 className="text-2xl font-bold mb-3">Sub-100ms Latency</h4>
                        <p className="text-text-secondary">Edge-optimized inference ensures your users never see a loading spinner. Speed is a feature.</p>
                    </motion.div>

                    {/* Feature 3: Medium */}
                    <motion.div variants={itemVariants} className="md:col-span-2 bg-surface-elevated border border-white/10 p-8 rounded-3xl">
                        <Code2 className="text-blue-400 mb-4" size={24} />
                        <h4 className="text-xl font-bold mb-2">SDK First</h4>
                        <p className="text-text-secondary text-sm">Python, TS, and Go support out of the box.</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="md:col-span-2 bg-surface-elevated border border-white/10 p-8 rounded-3xl">
                        <ShieldCheck className="text-green-400 mb-4" size={24} />
                        <h4 className="text-xl font-bold mb-2">Enterprise Security</h4>
                        <p className="text-text-secondary text-sm">SOC2 Type II compliant and end-to-end encrypted.</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="md:col-span-2 bg-surface-elevated border border-white/10 p-8 rounded-3xl">
                        <Globe className="text-purple-400 mb-4" size={24} />
                        <h4 className="text-xl font-bold mb-2">Global Scale</h4>
                        <p className="text-text-secondary text-sm">Deploy to 20+ regions with a single click.</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* How it works? */}
            <HowItWorks />

            {/* CTA Section */}
            <section className="max-w-5xl mx-auto px-6 py-32">
                <div className="relative overflow-hidden bg-primary rounded-[40px] p-12 md:p-20 text-center shadow-2xl shadow-primary/20">
                    {/* Background Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10"
                    >
                        <h3 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                            Ready to build the <br />future of software?
                        </h3>
                        <p className="text-white/80 mt-6 text-lg max-w-xl mx-auto font-medium">
                            Join 10,000+ developers building context-aware applications with SnapLM.
                        </p>
                        <Link to="/auth/signup">
                            <button className="mt-10 bg-white text-primary hover:bg-background-dark hover:text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                                Get Your API Key — Free
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-background-dark py-20">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <GanttChart className="text-primary" size={24} />
                            <span className="font-display text-2xl font-bold">SnapLM</span>
                        </div>
                        <p className="text-text-secondary max-w-xs leading-relaxed">
                            The intelligent layer for the modern stack. Built by builders, for builders.
                        </p>
                    </div>
                    {["Product", "Developers", "Company"].map((title) => (
                        <div key={title}>
                            <h4 className="text-white font-bold mb-6">{title}</h4>
                            <ul className="space-y-4 text-text-secondary text-sm">
                                {["Link One", "Link Two", "Link Three"].map(link => (
                                    <li key={link} className="hover:text-primary cursor-pointer transition-colors">{link}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
                    <p>© 2026 SnapLM Inc. All rights reserved.</p>
                    <div className="flex gap-8">
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                        <span>Cookie Settings</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}