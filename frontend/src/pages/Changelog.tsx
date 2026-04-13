import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Target, Bug, ArrowUpCircle } from "lucide-react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineDot from "@mui/lab/TimelineDot";

import Header from "../components/landing/Header";
import NetworkBackground from "../components/landing/NetworkBackground";
import { GanttChart } from "lucide-react";

const changelogData = [
  {
    version: "v2.1.0",
    date: "April 14, 2026",
    title: "The Performance Update",
    description: "Massive improvements to latency and agent context window allocation.",
    changes: [
      { type: "Feature", text: "Added support for up to 1M token context windows for customized agents.", icon: <Target size={16} /> },
      { type: "Improvement", text: "Inference latency reduced by another 12% globally.", icon: <Zap size={16} /> },
      { type: "Fix", text: "Resolved edge case dropping connections on multi-agent chaining.", icon: <Bug size={16} /> },
    ]
  },
  {
    version: "v2.0.0",
    date: "March 20, 2026",
    title: "Branching Intelligence",
    description: "Launch of our flagship feature: multi-branch LLM workspaces for unconstrained parallel reasoning.",
    changes: [
      { type: "Feature", text: "Introduced fully visual branch editor with drag-and-drop mechanics.", icon: <Target size={16} /> },
      { type: "Feature", text: "Added visual debugging tools for prompt execution steps.", icon: <Target size={16} /> },
      { type: "Improvement", text: "State persistence is now guaranteed sub-10ms across regions.", icon: <Zap size={16} /> }
    ]
  },
  {
    version: "v1.5.0",
    date: "February 05, 2026",
    title: "Enterprise Readiness",
    description: "Rollout of SOC2 Type II compliance controls and robust auditing capabilities.",
    changes: [
      { type: "Feature", text: "Granular Role-Based Access Control (RBAC) implementation.", icon: <Target size={16} /> },
      { type: "Feature", text: "SSO integrations for SAML, Okta, and Azure AD.", icon: <Target size={16} /> },
      { type: "Fix", text: "Rate limits UI reflecting accurately on API dashboards.", icon: <Bug size={16} /> }
    ]
  },
  {
    version: "v1.2.0",
    date: "December 12, 2025",
    title: "Developer Experience SDKs",
    description: "Expansion of support for major programming languages.",
    changes: [
      { type: "Feature", text: "Official Go and Python SDKs marked as stable.", icon: <Target size={16} /> },
      { type: "Improvement", text: "Typescript definitions overhaul for stricter inference typing.", icon: <Zap size={16} /> }
    ]
  },
  {
    version: "v1.0.0",
    date: "November 01, 2025",
    title: "General Availability",
    description: "SnapLM is officially out of Beta. A new era for LLM workflows.",
    changes: [
      { type: "Feature", text: "Public registration open.", icon: <Target size={16} /> },
      { type: "Feature", text: "Core semantic logic engine v1 deployed.", icon: <Target size={16} /> }
    ]
  }
];

const ChangeItem = ({ change }: { change: any }) => {
  const getColor = (type: string) => {
    switch (type) {
      case "Feature": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "Improvement": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "Fix": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      default: return "text-primary bg-primary/10 border-primary/20";
    }
  };

  return (
    <div className="flex items-start gap-3 mt-3">
      <div className={`mt-0.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 shrink-0 ${getColor(change.type)}`}>
        {change.icon}
        {change.type}
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{change.text}</p>
    </div>
  );
};

export default function ChangelogPage() {
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.2], [1, 0.2]);

  return (
    <div className="bg-background-dark text-white font-body min-h-screen selection:bg-primary/30 relative">
      <Header />
      
      {/* Background Hero Effects */}
      <motion.div style={{ y: yParallax, opacity: opacityFade }} className="fixed inset-0 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] z-0 pointer-events-none">
         <NetworkBackground />
      </motion.div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 z-10 text-center max-w-4xl mx-auto px-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-white/10 text-text-secondary text-sm font-medium mb-6">
            <ArrowUpCircle size={16} className="text-primary" /> <span>Constantly Evolving</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Changelog
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
            New updates and improvements to the SnapLM platform. We ship fast to keep you ahead.
          </p>
        </motion.div>
      </section>

      {/* Interactive sticky timeline wrapper */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-40">
         <Timeline position="alternate">
           {changelogData.map((release, index) => (
             <TimelineItem key={release.version}>
               <TimelineOppositeContent sx={{ m: 'auto 0', py: 4 }}>
                 <motion.div
                   initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ duration: 0.7, ease: "easeOut" }}
                   className="text-text-muted"
                 >
                    <span className="text-xl font-bold font-display text-primary/80">{release.version}</span>
                    <br />
                    <span className="text-sm uppercase tracking-widest font-semibold">{release.date}</span>
                 </motion.div>
               </TimelineOppositeContent>
               <TimelineSeparator>
                 <TimelineConnector className="!bg-white/10" />
                 <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                 >
                   <TimelineDot className="!bg-primary !shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
                     <Sparkles size={16} className="text-white" />
                   </TimelineDot>
                 </motion.div>
                 <TimelineConnector className="!bg-white/10" />
               </TimelineSeparator>
               <TimelineContent sx={{ py: 4, px: 3 }}>
                 <motion.div
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                   className={`bg-surface-elevated/50 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-primary/30 transition-all text-left ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}
                 >
                   <h3 className="text-2xl font-bold font-display mb-2">{release.title}</h3>
                   <p className="text-text-secondary mb-6 text-base">{release.description}</p>
                   
                   <div className="space-y-4">
                     {release.changes.map((change, i) => (
                       <ChangeItem key={i} change={change} />
                     ))}
                   </div>
                 </motion.div>
               </TimelineContent>
             </TimelineItem>
           ))}
         </Timeline>
      </section>

      {/* Footer Area, matching Home page */}
      <footer className="border-t border-white/5 bg-background-dark py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12">
              <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                      <GanttChart className="text-primary" size={24} />
                      <span className="font-display text-2xl font-bold">SnapLM</span>
                  </div>
                  <p className="text-text-secondary max-w-xs leading-relaxed">
                      The intelligent layer for the modern stack. Built by builders, for builders.
                  </p>
              </div>
              {["Product", "Developers", "Company"].map((title) => (
                  <div key={title}>
                      <h4 className="text-white font-bold mb-6">{title}</h4>
                      <ul className="space-y-4 text-text-secondary text-sm">
                          {["Link One", "Link Two", "Link Three"].map(link => (
                              <li key={link} className="hover:text-primary cursor-pointer transition-colors">{link}</li>
                          ))}
                      </ul>
                  </div>
              ))}
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
              <p>© 2026 SnapLM Inc. All rights reserved.</p>
              <div className="flex gap-8">
                  <span>Privacy Policy</span>
                  <span>Terms of Service</span>
                  <span>Cookie Settings</span>
              </div>
          </div>
      </footer>
    </div>
  );
}
