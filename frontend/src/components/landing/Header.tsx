import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { GanttChart, ArrowRight } from "lucide-react";

export default function Header({ minimal = false }: { minimal?: boolean }) {
    const { scrollY } = useScroll();

    // Smoothly transition background and border opacity based on scroll
    const backgroundColor = useTransform(
        scrollY,
        [0, 50],
        ["rgba(17, 19, 24, 0)", "rgba(17, 19, 24, 0.8)"]
    );
    const borderOpacity = useTransform(scrollY, [0, 50], ["rgba(255,255,255,0)", "rgba(255,255,255,0.1)"]);

    const navLinks = [
        { name: "Features", path: "/#features" },
        { name: "Pricing", path: "#" },
        { name: "Docs", path: "#" },
        { name: "Changelog", path: "/changelog" }
    ];

    return (
        <motion.header
            style={{ backgroundColor, borderColor: borderOpacity }}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-0 z-50 backdrop-blur-md border-b"
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* Logo Area */}
                <motion.div
                    whileHover="hover"
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <Link to="/" className="flex items-center gap-2">
                        <motion.div
                            variants={{
                                hover: { scale: 1.1, rotate: 5 }
                            }}
                            className="bg-primary/10 p-2 rounded-lg"
                        >
                            <GanttChart className="text-primary" size={22} />
                        </motion.div>
                        <span className="font-display text-xl font-bold tracking-tight">
                            SnapLM
                        </span>
                    </Link>
                </motion.div>

                {!minimal && (
                    <>
                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            {navLinks.map((item, i) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i + 0.3 }}
                                    whileHover={{ y: -1 }}
                                    className="text-sm font-medium text-text-secondary hover:text-white transition-colors relative"
                                >
                                    <Link to={item.path}>
                                        {item.name}
                                    </Link>
                                </motion.div>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <Link to="/auth/login">
                                <motion.button
                                    whileHover={{ x: -2 }}
                                    className="hidden sm:block text-sm font-medium text-text-muted hover:text-white transition-colors"
                                >
                                    Log in
                                </motion.button>
                            </Link>

                            <Link to="/auth/signup">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="bg-white text-black hover:bg-primary hover:text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-white/5 active:shadow-none"
                                >
                                    <span>Get Started</span>
                                    <motion.span
                                        variants={{
                                            initial: { x: 0 },
                                            hover: { x: 3 }
                                        }}
                                        initial="initial"
                                        whileHover="hover"
                                    >
                                        <ArrowRight size={16} />
                                    </motion.span>
                                </motion.button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </motion.header>
    );
}