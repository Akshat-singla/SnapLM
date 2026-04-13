import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import robotConfig from "../../utils/robotConsts";
import { useRobot } from "../../context/robotProvider";

export default function AssistantRobot() {
    const robotRef = useRef<HTMLDivElement>(null);
    const eyeContainerRef = useRef<HTMLDivElement>(null);
    const pupilRef = useRef<HTMLDivElement>(null);
    const { state } = useRobot();
    const current = robotConfig[state] || robotConfig.idle;
    
    const stateRef = useRef(state);
    stateRef.current = state;

    useEffect(() => {
        if (state === "typing-password") {
            gsap.killTweensOf(pupilRef.current, "scaleY");
            gsap.to(pupilRef.current, { scaleY: 0.05, duration: 0.3 });
        } else {
            gsap.killTweensOf(pupilRef.current, "scaleY");
            gsap.to(pupilRef.current, { scaleY: 1, duration: 0.3 });
        }
    }, [state]);

    useEffect(() => {
        // Floating animation for the entire robot
        gsap.to(robotRef.current, {
            y: -15,
            rotation: 2,
            duration: 3.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Blinking logic
        let blinkTimeout: NodeJS.Timeout;
        const blink = () => {
            if (stateRef.current === "typing-password") {
                blinkTimeout = setTimeout(blink, 2000);
                return;
            }
            if (pupilRef.current) {
                gsap.to(pupilRef.current, {
                    scaleY: 0.1,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        blinkTimeout = setTimeout(blink, Math.random() * 4000 + 2000); // 2-6 sec random blink
                    }
                });
            }
        };
        blinkTimeout = setTimeout(blink, 2000);

        // Eye tracking logic
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const target = eyeContainerRef.current;
            const pupil = pupilRef.current;
            if (!target || !pupil) return;

            const rect = target.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Distance from center
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            
            // Constrain movement within the socket (max radius ~ 12px)
            const MAX_RADIUS = 16;
            const angle = Math.atan2(deltaY, deltaX);
            const dist = Math.min(Math.hypot(deltaX, deltaY) / 15, MAX_RADIUS);

            const moveX = Math.cos(angle) * dist;
            const moveY = Math.sin(angle) * dist;

            gsap.to(pupil, {
                x: moveX,
                y: moveY,
                duration: 0.6,
                ease: "power3.out"
            });
            
            // Parallax effect for the main pod
            gsap.to(target, {
                x: moveX * 0.3,
                y: moveY * 0.3,
                duration: 1,
                ease: "power2.out"
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            clearTimeout(blinkTimeout);
        }
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-10 w-full"
        >
            {/* Pulsing Status Text */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300">
                <div className="flex items-center gap-3" style={{ color: current.color }}>
                    <div className="relative flex items-center justify-center">
                        <div className="w-2 h-2 bg-current rounded-full shadow-[0_0_8px_currentColor]" />
                        <div className="absolute w-6 h-6 bg-current opacity-40 rounded-full animate-ping" />
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.span 
                            key={state}
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-mono font-bold tracking-[0.3em] uppercase transition-colors duration-500"
                            style={{ textShadow: `0 0 12px ${current.color}90` }}
                        >
                            {state.replace(/-/g, "_")}
                        </motion.span>
                    </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                    <motion.p 
                        key={state + "-desc"}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                        className="text-sm text-text-muted font-medium tracking-wide"
                    >
                        {current.text}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Robot Container */}
            <div className="relative flex items-center justify-center w-80 h-80">
                <div ref={robotRef} className="relative flex items-center justify-center w-full h-full">

                    {/* 3D Orbital Rings w/ Dynamic Colors */}
                    <div className="absolute w-[120%] h-[120%] perspective-[1000px] flex items-center justify-center pointer-events-none transition-colors duration-700" style={{ color: current.color }}>
                        <motion.div
                            animate={{ rotateZ: 360, rotateX: 60, rotateY: 20 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute w-full h-full rounded-full border-[1.5px] border-current opacity-20 shadow-[0_0_15px_currentColor]"
                            style={{ transformStyle: "preserve-3d" }}
                        />
                        <motion.div
                            animate={{ rotateZ: -360, rotateX: 60, rotateY: -20 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[85%] h-[85%] rounded-full border-[1.5px] border-current opacity-15 border-dashed"
                            style={{ transformStyle: "preserve-3d" }}
                        />
                        <motion.div
                            animate={{ rotateZ: 360, rotateX: 75, rotateY: 45 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[70%] h-[70%] rounded-full border-[1px] border-current opacity-30"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Traveling node on the inner ring */}
                            <div className="absolute -top-[3px] left-1/2 w-2 h-2 bg-current rounded-full shadow-[0_0_10px_currentColor] drop-shadow-md" />
                        </motion.div>
                    </div>

                    {/* The Main Robot Pod */}
                    <motion.div
                        animate={{ scale: current.scale }}
                        className={`relative w-44 h-44 bg-surface-dark/80 backdrop-blur-3xl border border-white/10 rounded-[56px] flex items-center justify-center overflow-hidden transition-all duration-700 ${current.glow}`}
                    >                
                        {/* Glass glare effect */}
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-[56px]" />
                        
                        {/* Inner glowing core background keyed to state color */}
                        <div 
                            className="absolute inset-0 opacity-80 mix-blend-screen pointer-events-none transition-colors duration-700"
                            style={{ background: `radial-gradient(circle at top right, ${current.color}33 0%, transparent 70%)` }}
                        />
                        
                        {/* Diagonal tech scanner line */}
                        <motion.div
                            animate={{ y: ["-100%", "200%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute w-[150%] h-1 bg-current opacity-20 rotate-45 pointer-events-none blur-sm"
                            style={{ color: current.color }}
                        />

                        {/* Eye Container (moves slightly for parallax) */}
                        <div 
                            ref={eyeContainerRef} 
                            className="relative z-10 w-24 h-24 bg-background-dark/90 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-[inset_0_8px_32px_rgba(0,0,0,0.8)] filter drop-shadow-sm transition-colors duration-700"
                        >
                            {/* Eye Socket Inner Glow */}
                            <div 
                                className="absolute inset-0 rounded-full opacity-10 transition-colors duration-700" 
                                style={{ boxShadow: `inset 0 0 20px ${current.color}` }} 
                            />

                            {/* The Interactive Pupil */}
                            <div
                                ref={pupilRef}
                                className="relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-colors duration-700 drop-shadow-lg"
                                style={{
                                    background: `radial-gradient(circle at 30% 30%, ${current.color}, #000 120%)`,
                                    boxShadow: `0 0 25px ${current.color}99`
                                }}
                            >
                                {/* Mechanical / Iris detailing */}
                                <div className="absolute inset-0 border-[2px] border-white/20 rounded-full opacity-60" />
                                <div className="w-3 h-3 bg-white/90 rounded-full -mt-2 -ml-2 shadow-[0_0_12px_white]" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}