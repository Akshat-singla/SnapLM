import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRobot } from "../../context/robotProvider";
import useStore from "../../store";

export default function Signup() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
    });
    const { setState } = useRobot();
    const signup = useStore((state) => state.signup);
    useEffect(() => {
        setState("signup");
    }, []);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const success = await signup(formData.email, formData.password);
        if (success) {
            navigate("/app");
        }
        setLoading(false);
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
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">

                {/* Full Name */}
                <motion.div variants={itemVariants} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                        Full Name
                    </label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary">
                            <User size={16} />
                        </div>
                        <input
                            type="text"
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            onFocus={() => setState("typing-name")}
                            onBlur={() => setState("signup")}
                            placeholder="John Doe"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 text-sm"
                        />
                    </div>
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                        Email
                    </label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary">
                            <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => setState("typing-email")}
                            onBlur={() => setState("signup")}
                            placeholder="name@company.com"
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 text-sm"
                        />
                    </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
                        Password
                    </label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            onFocus={() => setState("typing-password")}
                            onBlur={() => setState("signup")}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </motion.div>

                {/* Terms */}
                <motion.div variants={itemVariants} className="flex gap-2 text-[10px] text-text-muted">
                    <ShieldCheck size={14} className="text-primary mt-[2px]" />
                    <p>
                        By signing up, you agree to{" "}
                        <span className="text-white hover:underline cursor-pointer">Terms</span>.
                    </p>
                </motion.div>

                {/* Submit */}
                <motion.div variants={itemVariants}>
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Initializing...</span>
                            </>
                        ) : (
                            "Create"
                        )}
                    </motion.button>
                </motion.div>
            </form>

            {/* Footer */}
            <motion.div
                variants={itemVariants}
                className="text-center text-xs text-text-muted"
            >
                Already have an account?{" "}
                <button
                    onClick={() => navigate("/auth/login")}
                    className="text-primary font-semibold hover:text-primary-hover"
                >
                    Sign in
                </button>
            </motion.div>
        </motion.div>
    );
}