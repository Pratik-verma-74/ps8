import React from "react";
import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell() {
  return (
    <div className="relative h-screen w-full bg-[#030712] text-[#F8FAFC] overflow-hidden selection:bg-[#00D9FF]/30 selection:text-[#00D9FF]">
      {/* Background Map layer is handled by the Dashboard inside Outlet */}
      <AnimatePresence mode="wait">
        <motion.main
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-0"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Floating UI Layer */}
      <div className="pointer-events-none absolute inset-0 z-50">
        <TopNav />
        <Sidebar />
      </div>
    </div>
  );
}
