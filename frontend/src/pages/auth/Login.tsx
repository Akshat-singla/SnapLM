import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, Smartphone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRobot } from "../../context/robotProvider";
import useStore from "../../store";
import { authApi } from "../../services/api/client";
import { startAuthentication } from '@simplewebauthn/browser';

export default function Login() {
    const [email, setEmail] = useState("");
    const { setState } = useRobot();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setState("login");
    }, []);


    const navigate = useNavigate();
    const location = useLocation();
    const login = useStore((state) => state.login);
    
    const from = location.state?.from || "/app";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(email, password);
        if (result.success) {
            setState("success");
            setTimeout(() => navigate(from), 1000);
        } else if (result.code === 'requires_2fa') {
            navigate("/auth/2FA", { state: { tempToken: result.tempToken, from } });
        } else if (result.code === 'invalid_credentials') {
            setState("error");
        } else {
            setState("error");
        }
        setLoading(false);
    };

    // Passkey Login implementation
    const handlePasskeyLogin = async () => {
        setLoading(true);
        setState("thinking");

        try {
            // If email is empty, we do "Discoverable Credentials" (Resident Keys)
            const queryEmail = email || null;
            
            const generateResp = await authApi.generatePasskeyAuthentication(queryEmail || "");
            const asseResp = await startAuthentication(generateResp);
            const verifyResp = await authApi.verifyPasskeyAuthentication(queryEmail || "", asseResp);
            
            if (verifyResp.success) {
                // If user didn't enter email, we might want to update the local state with what the backend found
                if (!email && verifyResp.user?.email) {
                    setEmail(verifyResp.user.email);
                }
                
                useStore.getState().checkAuth(); // update store
                setState("success");
                setTimeout(() => navigate(from), 1000);
            }
        } catch (err: any) {
            console.error("Passkey Error:", err);
            setState("error");
            if (err.name === "NotAllowedError") {
                // User cancelled or timed out
                setState("login");
            }
        } finally {
            setLoading(false);
            if (useStore.getState().user === null && !loading) {
               // Stay in login if not successful
            }
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
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
            className="space-y-5"
        >
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-muted ml-1">
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            onFocus={() => setState("typing-email")}
                            onBlur={() => setState("login")}
                            placeholder="name@company.com"
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted/50 text-sm"
                        />
                    </div>
                </motion.div>

                {/* Password Input */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
                            Password
                        </label>
                        <button 
                            type="button" 
                            onClick={() => navigate("/auth/forgot")}
                            className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                        >
                            Forgot?
                        </button>
                    </div>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onFocus={() => {
                                setState("typing-password");
                            }}
                            onBlur={() => {
                                setState("login");
                            }}
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }} placeholder="••••••••"
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

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-1">
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Establishing Context...</span>
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </motion.button>
                </motion.div>
            </form>

            <motion.div variants={itemVariants} className="text-center">
                <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={loading}
                    className="text-xs font-bold text-text-muted hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center mx-auto disabled:opacity-50"
                >
                    Sign in with Passkey
                </button>
            </motion.div>

            {/* Footer */}
            <motion.div
                variants={itemVariants}
                className="text-center text-xs text-text-muted pt-2 border-t border-surface-border"
            >
                New to the workspace?{" "}
                <button
                    onClick={() => navigate("/auth/signup")}
                    className="text-primary font-bold hover:text-primary-hover transition-colors"
                >
                    Create an account
                </button>
            </motion.div>
        </motion.div>
    );
}