import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRobot } from "../../context/robotProvider";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { setState } = useRobot();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setState("reset-password");
    }, []);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            // handle error
            return;
        }
        setLoading(true);

        try {
            await new Promise((res) => setTimeout(res, 1500));
            navigate("/auth/login");
        } catch (err) {
            console.error("Reset failed", err);
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
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 flex flex-col items-center">
            <motion.div variants={itemVariants} className="text-center space-y-2 w-full">
                <h2 className="text-xl font-bold">Secure New Key</h2>
                <p className="text-xs text-text-muted">Enter a strong, new password for your account.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4 w-full">
                <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                        New Password
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onFocus={() => setState("typing-password")}
                            onBlur={() => setState("reset-password")}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted/50 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                        Confirm Password
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onFocus={() => setState("typing-password")}
                            onBlur={() => setState("reset-password")}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted/50 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                    <motion.button
                        type="submit"
                        disabled={loading || !password || password !== confirmPassword}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : "Update Password"}
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
}
