import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, Compass, Activity, Navigation2 } from 'lucide-react';

interface Point { x: number; y: number; }

export function RadarDashboard() {
  const [roverPos, setRoverPos] = useState<Point>({ x: 50, y: 50 });
  const [targetIce, setTargetIce] = useState<Point>({ x: 80, y: 20 });
  const [deviation, setDeviation] = useState(0);
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Simulated radar pings and auto-correction
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate rover moving slightly off course due to terrain
      setRoverPos(prev => {
        const driftX = prev.x + (Math.random() - 0.5) * 2;
        const driftY = prev.y + (Math.random() - 0.5) * 2;
        
        // Calculate deviation from ideal path (simplified)
        const currentDeviation = Math.sqrt(Math.pow(driftX - 50, 2) + Math.pow(driftY - 50, 2));
        setDeviation(currentDeviation);

        if (currentDeviation > 5) {
          setIsCorrecting(true);
          // Auto-correct towards center line if deviated too much
          setTimeout(() => setIsCorrecting(false), 1500);
          return {
            x: driftX + (50 - driftX) * 0.5,
            y: driftY + (50 - driftY) * 0.5
          };
        }
        
        return { x: driftX, y: driftY };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calculate distance to nearest ice
  const distanceToIce = Math.sqrt(Math.pow(targetIce.x - roverPos.x, 2) + Math.pow(targetIce.y - roverPos.y, 2)).toFixed(1);

  return (
    <div className="w-full h-full p-8 flex flex-col text-white font-primary h-screen pt-24 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Radar className="text-[#00D9FF]" size={28} />
        <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#0055FF]">
          DFSAR Tracking & Navigation
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        
        {/* Main Radar Display */}
        <div className="col-span-1 lg:col-span-2 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-8 relative overflow-hidden backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(0,217,255,0.05)]">
          
          <div className="relative w-full max-w-[500px] aspect-square rounded-full border border-[#00D9FF]/20 flex items-center justify-center overflow-hidden">
            
            {/* Grid Rings */}
            <div className="absolute w-[75%] h-[75%] rounded-full border border-[#00D9FF]/10" />
            <div className="absolute w-[50%] h-[50%] rounded-full border border-[#00D9FF]/10" />
            <div className="absolute w-[25%] h-[25%] rounded-full border border-[#00D9FF]/10" />
            
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-[#00D9FF]/10" />
            <div className="absolute h-full w-[1px] bg-[#00D9FF]/10" />

            {/* Radar Sweep Animation */}
            <motion.div
              className="absolute inset-0 origin-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(0, 217, 255, 0.4) 10%, transparent 10%)'
              }}
            />

            {/* Target Ice Blip */}
            <div 
              className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#fff]"
              style={{ left: `${targetIce.x}%`, top: `${targetIce.y}%` }}
            >
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
            </div>

            {/* Rover Tracker */}
            <motion.div 
              className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
              animate={{ left: `${roverPos.x}%`, top: `${roverPos.y}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            >
              <Navigation2 size={24} className={`transform rotate-45 ${isCorrecting ? 'text-yellow-400' : 'text-[#00D9FF]'}`} />
              {isCorrecting && (
                <span className="absolute top-6 text-[10px] font-bold text-yellow-400 whitespace-nowrap bg-black/50 px-1 rounded animate-pulse">
                  AUTO-CORRECTING
                </span>
              )}
            </motion.div>

          </div>
        </div>

        {/* Telemetry Side Panel */}
        <div className="col-span-1 flex flex-col gap-6">
          
          {/* Status Box */}
          <div className="bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={16} /> Navigation Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-sm text-white/70">Trajectory Deviation</span>
                <span className={`font-mono font-bold ${deviation > 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {deviation.toFixed(2)}m
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-sm text-white/70">System State</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isCorrecting ? 'bg-yellow-400/20 text-yellow-400' : 'bg-green-400/20 text-green-400'}`}>
                  {isCorrecting ? 'CORRECTING' : 'OPTIMAL'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">Last Radar Ping</span>
                <span className="font-mono text-xs text-[#00D9FF] animate-pulse">LIVE</span>
              </div>
            </div>
          </div>

          {/* Ice Locator Box */}
          <div className="bg-gradient-to-br from-[#00D9FF]/10 to-transparent border border-[#00D9FF]/30 rounded-2xl p-6 backdrop-blur-xl flex-1 flex flex-col">
            <h3 className="text-sm text-[#00D9FF] uppercase tracking-wider mb-6 flex items-center gap-2">
              <Compass size={16} /> Nearest Ice Target
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold text-white tracking-tighter mb-2">
                {distanceToIce}
              </div>
              <div className="text-[#00D9FF] text-sm uppercase tracking-widest">Meters Away</div>
              
              <div className="w-full mt-8 bg-black/50 rounded-full h-2 overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#00D9FF] to-white"
                  animate={{ width: `${Math.max(0, 100 - (parseFloat(distanceToIce) / 2))}%` }}
                />
              </div>
              <div className="w-full flex justify-between mt-2 text-[10px] text-white/40 font-mono">
                <span>APPROACHING</span>
                <span>DESTINATION</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
