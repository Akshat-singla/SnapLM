import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ShieldCheck, ArrowRight, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Stepper, Step, StepLabel, Box } from "@mui/material";
import { useRobot } from "../../context/robotProvider";
import useStore from "../../store";
import { authApi } from "../../services/api/client";

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
    const [activeStep, setActiveStep] = useState(0);
    const [setupUri, setSetupUri] = useState("");
    const [setupSecret, setSetupSecret] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const addToast = useStore((state) => state.addToast);

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await signup(formData.email, formData.password);
        if (result.success) {
            try {
                const data = await authApi.setup2FA();
                setSetupUri(data.uri);
                setSetupSecret(data.secret);
                setState("otp"); // Triggers robot OTP state
                setActiveStep(1); // Advance to 2FA step
            } catch (err) {
                // If fetching 2FA fails, just proceed to app
                setState("success");
                setTimeout(() => navigate("/app"), 1000);
            }
        } else if (result.code === 'user_exists') {
            setState("user-exists");
        } else {
            setState("error");
        }
        setLoading(false);
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.enable2FA(verifyCode);
            addToast({ type: 'success', message: '2FA Enabled Successfully' });
            navigate("/app");
        } catch (err) {
            addToast({ type: 'error', message: 'Invalid 2FA code' });
            setState("error");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip2FA = () => {
        navigate("/app");
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
            {/* Stepper */}
            <Box sx={{ width: '100%', mb: 4, mt: -2 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{
                    '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.2)' },
                    '& .MuiStepIcon-root.Mui-active': { color: 'var(--color-primary)' },
                    '& .MuiStepIcon-root.Mui-completed': { color: 'var(--color-primary)' },
                    '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter', fontSize: '0.75rem', mt: 0.5 },
                    '& .MuiStepLabel-label.Mui-active': { color: 'white', fontWeight: 'bold' },
                    '& .MuiStepLabel-label.Mui-completed': { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }
                }}>
                    <Step key="account">
                        <StepLabel>Account</StepLabel>
                    </Step>
                    <Step key="security">
                        <StepLabel>2FA</StepLabel>
                    </Step>
                    <Step key="verify">
                        <StepLabel>Verify</StepLabel>
                    </Step>
                </Stepper>
            </Box>

            {activeStep === 0 ? (
                <>
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
                                className="w-full mt-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Initializing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Continue Securely</span>
                                        <ArrowRight size={16} />
                                    </>
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
                </>
            ) : activeStep === 1 ? (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
                        <p className="text-xs text-text-muted">Scan the QR code with Google Authenticator or Authy.</p>
                    </div>
                    
                    <div className="flex justify-center bg-white p-2 rounded-xl mx-auto shadow-md w-fit">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(setupUri)}`} 
                            alt="2FA QR Code" 
                            className="w-[110px] h-[110px]"
                        />
                    </div>
                    
                    <p className="text-[10px] text-center text-text-muted font-mono">{setupSecret}</p>

                    <div className="pt-1 flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveStep(2)}
                            className="w-full py-3 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                        >
                            Next Step
                        </button>

                        <button
                            type="button"
                            onClick={handleSkip2FA}
                            className="text-sm font-semibold text-text-muted hover:text-white transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                >
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-bold">Verify Code</h2>
                        <p className="text-xs text-text-muted">Enter the 6-digit code from your authenticator app.</p>
                    </div>

                    <form onSubmit={handleVerify2FA} className="space-y-4">
                        <div className="space-y-1.5 object-center w-full flex flex-col items-center mt-6 mb-2">
                            <div className="relative group w-full max-w-[250px]">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                                    <KeyRound size={20} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={verifyCode}
                                    onFocus={() => setState("typing-password")}
                                    onBlur={() => setState("otp")}
                                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                                    placeholder="000000"
                                    className="w-full text-center tracking-[0.5em] font-mono text-xl pl-12 pr-4 py-3 rounded-2xl bg-background-dark border border-surface-border text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/50"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-4 flex flex-col items-center gap-3 relative z-10">
                            <motion.button
                                type="submit"
                                disabled={loading || verifyCode.length < 6}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full py-4 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Finish"}
                            </motion.button>

                            <div className="flex w-full justify-between px-2 text-sm font-semibold text-text-muted pt-2 pb-8">
                                <button
                                    type="button"
                                    onClick={() => setActiveStep(1)}
                                    className="hover:text-white transition-colors"
                                >
                                    Back to QR
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSkip2FA}
                                    className="hover:text-white transition-colors"
                                >
                                    Skip setup
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            )}
        </motion.div>
    );
}