import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/landing/Header";
import AssistantRobot from "../components/animated/AssistantRobot";

export default function AuthLayout() {
    return (
        <div className="h-screen bg-background-dark text-white font-body overflow-hidden selection:bg-primary/30">

            {/* Header */}
            <div className="fixed top-0 left-0 w-full z-50">
                <Header minimal />
            </div>

            <div className="flex h-full pt-16">
                {/* LEFT: Canvas */}
                <div className="hidden lg:flex flex-1 relative items-center justify-center bg-background-dark">

                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-30" />

                    <div className="absolute w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center gap-12 max-w-md">
                        <AssistantRobot />

                        {/* <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl font-display font-bold">
                                The Context Engine
                            </h2>
                            <p className="text-sm text-text-muted mt-3 leading-relaxed">
                                Our AI is indexing your local branches. Sign in to sync your logic and resume building.
                            </p>
                        </motion.div> */}
                    </div>

                    <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background-dark to-transparent z-20" />
                </div>

                {/* RIGHT: Auth Panel */}
                {/* RIGHT: Auth Panel Container */}
                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    /* FIXED: 
                       - Removed 'bg-background-dark'
                       - Removed 'border-l'
                       - Removed 'shadow' from this outer container
                    */
                    className="w-full lg:w-[560px] flex flex-col items-center justify-center px-6 md:px-12 relative z-30"
                >
                    {/* Inner Container: Centered vertically */}
                    <div className="w-full max-w-sm my-auto">

                        {/* THE FLOATING CARD 
            This is the only part that will have a background.
        */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            /* Added 'glass-panel' here for the background.
                               Increased rounding to [48px] for a more premium look.
                            */
                            className="glass-panel p-8 md:p-10 rounded-[48px] border border-white/10 shadow-2xl relative"
                        >
                            {/* Inner Glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                            <div className="max-h">
                                <Outlet />
                            </div>
                        </motion.div>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-10 flex flex-col items-center gap-6"
                        >
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                                <span className="text-primary hover:text-white cursor-pointer transition-colors">
                                    Help
                                </span>
                                <div className="w-1 h-1 bg-surface-border rounded-full" />
                                <span className="text-text-muted hover:text-white cursor-pointer transition-colors">
                                    Terms
                                </span>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}