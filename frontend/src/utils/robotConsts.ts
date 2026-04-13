const robotConfig: Record<string, { text: string; glow: string; scale: number; color: string }> = {
    login: {
        text: "Awaiting credentials...",
        glow: "shadow-[0_0_60px_rgba(19,91,236,0.2)]",
        scale: 1,
        color: "#135bec", // primary blue
    },
    signup: {
        text: "Initializing new identity...",
        glow: "shadow-[0_0_80px_rgba(34,197,94,0.25)]",
        scale: 1.05,
        color: "#22c55e", // green-500
    },
    "typing-email": {
        text: "Analyzing email pattern...",
        glow: "shadow-[0_0_80px_rgba(59,130,246,0.3)]",
        scale: 1.03,
        color: "#3b82f6", // blue-500
    },
    "typing-name": {
        text: "Verifying identity format...",
        glow: "shadow-[0_0_80px_rgba(245,158,11,0.3)]",
        scale: 1.03,
        color: "#f59e0b", // amber-500
    },
    "typing-password": {
        text: "Encrypting credentials...",
        glow: "shadow-[0_0_80px_rgba(168,85,247,0.3)]",
        scale: 1.02,
        color: "#a855f7", // purple-500
    },
    "forgot-password": {
        text: "Searching recovery routes...",
        glow: "shadow-[0_0_60px_rgba(249,115,22,0.2)]",
        scale: 1,
        color: "#f97316", // orange-500
    },
    "reset-password": {
        text: "Ready for new security key...",
        glow: "shadow-[0_0_80px_rgba(139,92,246,0.3)]",
        scale: 1.02,
        color: "#8b5cf6", // violet-500
    },
    otp: {
        text: "Awaiting security token...",
        glow: "shadow-[0_0_80px_rgba(14,165,233,0.3)]",
        scale: 1.04,
        color: "#0ea5e9", // sky-500
    },
    passkey: {
        text: "Scanning biometric passkey...",
        glow: "shadow-[0_0_80px_rgba(16,185,129,0.3)]",
        scale: 1.05,
        color: "#10b981", // emerald-500
    },
    "user-exists": {
        text: "Identity collision detected.",
        glow: "shadow-[0_0_80px_rgba(244,63,94,0.3)]",
        scale: 1,
        color: "#f43f5e", // rose-500
    },
    "email-sent": {
        text: "Courier dispatched securely.",
        glow: "shadow-[0_0_80px_rgba(56,189,248,0.3)]",
        scale: 1.05,
        color: "#38bdf8", // light blue
    },
    success: {
        text: "Access granted.",
        glow: "shadow-[0_0_100px_rgba(34,197,94,0.4)]",
        scale: 1.08,
        color: "#22c55e", // green-500
    },
    error: {
        text: "Authentication failed.",
        glow: "shadow-[0_0_100px_rgba(239,68,68,0.4)]",
        scale: 0.95,
        color: "#ef4444", // red-500
    },
    idle: {
        text: "Listening for context...",
        glow: "shadow-[0_0_60px_rgba(19,91,236,0.15)]",
        scale: 1,
        color: "#135bec", // primary blue
    },
};

export default robotConfig;