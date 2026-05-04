import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRobot } from "../../context/robotProvider";

export default function Terms() {
    const navigate = useNavigate();
    const { setState } = useRobot();

    useEffect(() => {
        setState("terms");
    }, [setState]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-text-muted space-y-6 pb-8"
        >
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors mb-2 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Go Back
            </button>
            <div>
                <h1 className="text-2xl font-display font-bold text-white mb-2">Terms and Conditions</h1>
                <p className="text-sm">Last Updated: April 2026</p>
            </div>

            <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">1. Introduction</h2>
                <p className="text-sm leading-relaxed">
                    Welcome to SnapLM. These Terms and Conditions govern your use of our platform, which provides an advanced context engine for developers.
                    By accessing or using our services, you agree to comply with and be bound by these terms. If you do not agree with these terms, please do not use our services.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">2. Use of Service</h2>
                <p className="text-sm leading-relaxed">
                    You agree to use SnapLM only for lawful purposes and in accordance with these Terms. You are responsible for ensuring that all persons who access the platform through your internet connection are aware of these Terms and comply with them.
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Do not reverse engineer the platform.</li>
                    <li>Do not use the service for unauthorized data mining.</li>
                    <li>Ensure you respect local intellectual property laws.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">3. User Data and Privacy</h2>
                <p className="text-sm leading-relaxed">
                    Your privacy is important to us. We will index local branches and synchronize context as described in our documentation.
                    Rest assured, we employ strong encryption to secure your logic and data. For more details, please view our Privacy Policy.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">4. Account Security</h2>
                <p className="text-sm leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized use of your account.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">5. Intellectual Property</h2>
                <p className="text-sm leading-relaxed">
                    All original content, features, and functionality are the exclusive property of SnapLM and its licensors.
                    You may not reproduce, distribute, or create derivative works from any part of the service without explicit permission.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">6. Limitation of Liability</h2>
                <p className="text-sm leading-relaxed">
                    In no event shall SnapLM, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the service.
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-bold text-white">7. Changes to Terms</h2>
                <p className="text-sm leading-relaxed">
                    We reserve the right to modify or replace these Terms at any time. We will provide notice before new terms take effect. By continuing to use the service after those revisions become effective, you agree to be bound by the revised terms.
                </p>
            </section>
        </motion.div>
    );
}
