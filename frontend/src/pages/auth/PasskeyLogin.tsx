import { useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Smartphone } from "lucide-react";
import { useRobot } from "../../context/robotProvider";
import { useNavigate } from "react-router-dom";

export default function PasskeyLogin() {
    const { setState } = useRobot();
    const navigate = useNavigate();

    useEffect(() => {
        setState("passkey");
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 flex flex-col items-center justify-center">
            <motion.div variants={itemVariants} className="text-center space-y-2">
                <h2 className="text-xl font-bold">Passkey Login</h2>
                <p className="text-xs text-text-muted">Scan securely with your trusted mobile device.</p>
            </motion.div>

            <motion.div 
                variants={itemVariants} 
                className="relative bg-white p-6 rounded-[32px] shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center"
            >
                {/* QR Code Placeholder */}
                <div className="absolute inset-0 bg-primary/5 rounded-[32px] animate-pulse" />
                <QrCode size={180} className="text-black relative z-10" strokeWidth={1.2} />
                
                {/* Little overlay icon */}
                <div className="absolute bg-white p-2 rounded-xl shadow-lg border border-black/5 z-20">
                    <Smartphone size={24} className="text-primary" />
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <button
                    onClick={() => navigate("/auth/login")}
                    className="text-xs font-bold text-text-muted hover:text-white uppercase tracking-widest transition-colors mt-4"
                >
                    Use Password Instead
                </button>
            </motion.div>
        </motion.div>
    );
}
