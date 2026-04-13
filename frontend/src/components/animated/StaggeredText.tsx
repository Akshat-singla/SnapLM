import { motion } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05, // Delay between each letter
            delayChildren: 0.1,
        },
    },
};

const child = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" } },
};

export default function StaggeredText({ text }) {
    return (
        <motion.h1 variants={container} initial="hidden" animate="visible">
            {text.split(" ").map((letter: String, index: Number) => (
                <motion.span key={index} variants={child}>
                    {letter === " " ? "\u00A0" : letter} {/* Use non-breaking space for gaps */}
                </motion.span>
            ))}
        </motion.h1>
    );
}   