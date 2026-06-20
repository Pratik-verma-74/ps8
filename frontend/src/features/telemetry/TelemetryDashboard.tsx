import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radio, Terminal, FileText, Download, CheckCircle2 } from 'lucide-react';

const LOG_MESSAGES = [
  "SYS_INIT: Boot sequence nominal.",
  "COMMS: Establishing link with Earth station...",
  "COMMS: Link established. Ping 1.2s",
  "NAV: Recalibrating IMU sensors...",
  "NAV: IMU calibration complete. Error margin < 0.01%",
  "THERMAL: Heater #2 engaged in Sector Alpha",
  "RADAR: Sweeping for obstacles. Clear path for 50m.",
  "POWER: Solar array tracking sun. Efficiency 94%.",
  "SCIENCE: Spectrometer analyzing regolith sample.",
  "WARNING: Minor voltage drop detected in Drive Motor B.",
  "SYS: Voltage drop compensated. Resuming nominal operation."
];

export function TelemetryDashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const newLog = `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)]}`;
      setLogs(prev => [...prev.slice(-40), newLog]);
      
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      index++;
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full p-8 flex flex-col text-white font-primary h-screen pt-24 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Radio className="text-[#00D9FF]" size={28} />
        <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#0055FF]">
          Mission Telemetry & Reports
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        
        {/* Live Telemetry Feed (Hacker Style) */}
        <div className="col-span-1 lg:col-span-2 bg-[#0B1120] border border-[#00D9FF]/20 rounded-2xl p-0 relative overflow-hidden shadow-[0_0_30px_rgba(0,217,255,0.05)] flex flex-col">
          
          <div className="bg-[#00D9FF]/10 p-3 border-b border-[#00D9FF]/20 flex justify-between items-center">
            <h2 className="text-sm font-mono text-[#00D9FF] flex items-center gap-2">
              <Terminal size={16} /> // ROVER_SYS_LOG_STREAM
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-500">REC</span>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar"
          >
            {logs.map((log, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`mb-2 ${
                  log.includes('WARNING') ? 'text-yellow-400' : 
                  log.includes('SYS') ? 'text-green-400' : 
                  'text-[#00D9FF]/80'
                }`}
              >
                {log}
              </motion.div>
            ))}
            {logs.length === 0 && <span className="text-white/30 animate-pulse">Waiting for datastream...</span>}
          </div>
          
          {/* Overlay scanline effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20" />
        </div>

        {/* Mission Reports Panel */}
        <div className="col-span-1 flex flex-col gap-6">
          
          <div className="bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex-1 flex flex-col">
            <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-6 flex items-center gap-2">
              <FileText size={16} /> Generated Reports
            </h3>
            
            <div className="space-y-4 flex-1">
              {/* Report Item 1 */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:border-[#00D9FF]/30 transition-all cursor-pointer group flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-bold text-sm group-hover:text-[#00D9FF] transition-colors">Traverse Path Alpha</h4>
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
                <div className="text-xs text-[#94A3B8] mb-4">Complete route analysis from Landing Zone 3 to Ice Deposit B.</div>
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-[10px] font-mono text-white/50">PDF • 2.4 MB</span>
                  <Download size={14} className="text-[#00D9FF]" />
                </div>
              </div>

              {/* Report Item 2 */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:border-[#00D9FF]/30 transition-all cursor-pointer group flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-bold text-sm group-hover:text-[#00D9FF] transition-colors">Ice Deposit Scan</h4>
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
                <div className="text-xs text-[#94A3B8] mb-4">Volumetric estimation of Sector Gamma ice resources.</div>
                <div className="mt-auto flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-[10px] font-mono text-white/50">JSON • 1.1 MB</span>
                  <Download size={14} className="text-[#00D9FF]" />
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 rounded-xl font-bold text-sm tracking-wider hover:bg-[#00D9FF]/20 transition-colors mt-6 flex items-center justify-center gap-2">
              <Radio size={16} /> TRANSMIT ALL TO ISRO
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
