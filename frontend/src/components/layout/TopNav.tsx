import React, { useState, useEffect } from "react";
import { Activity, Menu, Settings, User, Search, Map } from "lucide-react";
import { cn } from "../../utils/cn";

export function TopNav() {
  const [metTime, setMetTime] = useState(45 * 3600 + 12 * 60 + 8); // 45:12:08 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setMetTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `T+ ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  return (
    <>
      {/* Top Left Floating Search/Command Bar */}
      <div className="absolute top-4 left-4 z-50 flex items-center shadow-lg pointer-events-auto">
        <div className="flex items-center bg-[#0B1120]/90 backdrop-blur-xl border border-white/10 rounded-l-xl h-12 px-4 gap-4">
          <button className="text-[#94A3B8] hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Search size={18} className="text-[#00D9FF]" />
            <input 
              type="text" 
              placeholder="Search crater, coordinate, dataset..." 
              className="bg-transparent border-none text-[#F8FAFC] font-primary text-sm placeholder:text-[#64748B] focus:outline-none w-64"
            />
          </div>
        </div>
        <div className="flex items-center justify-center h-12 px-4 bg-[#00D9FF]/20 border border-l-0 border-[#00D9FF]/50 rounded-r-xl cursor-pointer hover:bg-[#00D9FF]/30 transition-colors">
          <Map size={20} className="text-[#00D9FF]" />
        </div>
      </div>

      {/* Top Right Floating Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-4 bg-[#0B1120]/90 backdrop-blur-xl border border-white/10 rounded-xl h-12 px-4 shadow-lg">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-primary">MET</span>
            <span className="text-[#F8FAFC] font-primary font-bold text-sm tracking-widest">{formatTime(metTime)}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-[10px] text-[#22C55E] font-primary tracking-widest">NOMINAL</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#0B1120]/90 backdrop-blur-xl border border-white/10 rounded-xl h-12 px-2 shadow-lg">
          <button className="p-2 text-[#94A3B8] hover:text-[#00D9FF] transition-colors rounded-lg hover:bg-white/5">
            <Activity size={18} />
          </button>
          <button className="p-2 text-[#94A3B8] hover:text-[#00D9FF] transition-colors rounded-lg hover:bg-white/5">
            <Settings size={18} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button className="p-1.5 text-[#94A3B8] hover:text-white transition-colors rounded-full hover:bg-white/5 border border-white/10">
            <User size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
