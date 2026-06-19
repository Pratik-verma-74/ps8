import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Cpu, 
  Globe, 
  Radar, 
  Mountain, 
  Navigation, 
  Route, 
  Cuboid, 
  MonitorPlay, 
  Radio, 
  FileText,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "ISRU Command", path: "/mission-control", icon: LayoutDashboard },
  { label: "PSRs Mapping", path: "/intelligence", icon: Globe },
  { label: "OHRC Morphology", path: "/twin", icon: Mountain },
  { label: "DFSAR Analytics", path: "/analytics/radar", icon: Radar },
  { label: "Ice Volume", path: "/science/ice-volume", icon: Cuboid },
  { label: "Landing Optimizer", path: "/planning/landing", icon: Navigation },
  { label: "Traverse Planner", path: "/planning/traverse", icon: Route },
  { label: "Power & Hazards", path: "/simulation", icon: Cpu },
  { label: "Telemetry Feed", path: "/telemetry", icon: Radio },
  { label: "Mission Reports", path: "/reports", icon: FileText },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sarProgress, setSarProgress] = useState(45);

  useEffect(() => {
    const timer = setInterval(() => {
      setSarProgress(prev => {
        if (prev >= 100) return 0;
        return prev + Math.floor(Math.random() * 3) + 1; // Increment by 1-3%
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isExpanded ? 240 : 64 }}
      className="absolute top-20 left-4 z-40 bg-[#0B1120]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg flex flex-col pointer-events-auto h-[calc(100vh-6.5rem)]"
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-6 w-6 h-6 bg-[#0B1120] border border-white/10 rounded-full flex items-center justify-center text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors shadow-md z-50"
      >
        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-5 py-3 transition-all duration-200 group relative whitespace-nowrap",
                isActive 
                  ? "text-[#00D9FF] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-[#00D9FF] before:rounded-r-full bg-[#00D9FF]/5"
                  : "text-[#94A3B8] hover:bg-white/5 hover:text-[#F8FAFC]"
              )
            }
          >
            <item.icon size={20} className="min-w-[20px] transition-colors group-hover:text-[#00D9FF]" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-medium text-sm font-primary tracking-wide"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </div>
      
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-white/10"
        >
          <div className="rounded-lg bg-white/5 p-3 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#94A3B8] font-primary tracking-wider uppercase">SAR Processing</span>
              <span className="text-[10px] text-[#00D9FF] font-primary font-bold">{Math.min(sarProgress, 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00D9FF] relative transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(sarProgress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
