import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, KeyRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useStore from "../../store";
import { useRobot } from "../../context/robotProvider";

export default function OTPAuth() {
    const [otp, setOtp] = useState("");
    const { setState } = useRobot();
    const [loading, setLoading] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    const verify2FA = useStore((state) => state.verify2FA);
    
    const tempToken = location.state?.tempToken;

    useEffect(() => {
        if (!tempToken) {
            navigate("/auth/login"); // Redirect if accessed directly without a token
        }
        setState("otp");
    }, [tempToken, navigate, setState]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await verify2FA(otp, tempToken);
            if (result.success) {
                setState("success");
                setTimeout(() => navigate("/app"), 1000);
            } else {
                setState("error");
            }
        } catch (err) {
            console.error(err);
            setState("error");
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
            <motion.div variants={itemVariants} className="text-center space-y-2">
                <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
                <p className="text-xs text-text-muted">Enter the 6-digit verification code sent to your device.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-1.5 object-center w-full flex flex-col items-center">
                    <div className="relative group w-full max-w-[250px]">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            <KeyRound size={20} />
                        </div>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={otp}
                            onFocus={() => setState("typing-password")}
                            onBlur={() => setState("otp")}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className="w-full text-center tracking-[0.5em] font-mono text-xl pl-12 pr-4 py-3 rounded-2xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/50"
                        />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                    <motion.button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-4 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify Identity"}
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
}
