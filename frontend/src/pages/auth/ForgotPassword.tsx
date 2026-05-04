import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRobot } from "../../context/robotProvider";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const { setState } = useRobot();
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        setState("forgot-password");
    }, []);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await new Promise((res) => setTimeout(res, 1500));
            // e.g., navigate to a success state or back to login
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants} className="text-center">
                <h2 className="text-xl font-bold mb-2">Reset Password</h2>
                <p className="text-xs text-text-muted">Enter your email and we will send you a recovery link.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onFocus={() => setState("typing-email")}
                            onBlur={() => setState("forgot-password")}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/50"
                        />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-4 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Link"}
                    </motion.button>
                </motion.div>
            </form>

            <motion.div variants={itemVariants} className="text-center">
                <button
                    onClick={() => navigate("/auth/login")}
                    className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-white transition-colors mx-auto"
                >
                    <ArrowLeft size={16} /> Back to login
                </button>
            </motion.div>
        </motion.div>
    );
}
