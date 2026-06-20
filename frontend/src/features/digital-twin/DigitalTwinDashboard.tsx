import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mountain, Layers, Maximize, Activity } from 'lucide-react';

export function DigitalTwinDashboard() {
  const [elevationData, setElevationData] = useState<number[]>([]);

  useEffect(() => {
    // Generate some random elevation data for the profile chart
    const data = Array.from({ length: 50 }, () => Math.floor(Math.random() * 40) + 10);
    setElevationData(data);

    const interval = setInterval(() => {
      setElevationData(prev => {
        const newData = [...prev.slice(1), Math.floor(Math.random() * 40) + 10];
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full p-8 flex flex-col text-white font-primary h-screen pt-24 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Mountain className="text-[#00D9FF]" size={28} />
        <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#0055FF]">
          OHRC Morphology Twin
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        {/* 3D Terrain Visualizer */}
        <div className="col-span-1 lg:col-span-3 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-4 relative overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(0,217,255,0.05)] flex flex-col">
          
          <div className="flex justify-between items-center z-10 px-4 py-2 border-b border-white/10">
            <h2 className="text-sm uppercase tracking-widest text-[#94A3B8] flex items-center gap-2">
              <Layers size={16} /> Surface Render
            </h2>
            <div className="flex gap-2">
              <span className="text-[10px] bg-[#00D9FF]/20 text-[#00D9FF] px-2 py-1 rounded border border-[#00D9FF]/30">HIGH-RES</span>
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded">WIREFRAME</span>
            </div>
          </div>

          <div className="flex-1 relative perspective-1000 flex items-center justify-center overflow-hidden">
            {/* Pseudo 3D Grid */}
            <motion.div 
              className="absolute w-[200%] h-[200%] border border-[#00D9FF]/30"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 217, 255, 0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 217, 255, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                transformStyle: 'preserve-3d',
                transform: 'rotateX(60deg) rotateZ(45deg)',
              }}
              animate={{ 
                backgroundPosition: ['0px 0px', '50px 50px'] 
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              {/* Simulated Crater */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-red-500/50 bg-red-500/10 shadow-[inset_0_0_50px_rgba(255,0,0,0.2)] flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border border-red-500/80 bg-red-500/20 shadow-[inset_0_0_30px_rgba(255,0,0,0.4)]" />
              </div>
            </motion.div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent pointer-events-none" />
            
            {/* Scanning Laser */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-1 bg-[#00D9FF] shadow-[0_0_20px_#00D9FF]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>

        {/* Analytics Side Panel */}
        <div className="col-span-1 flex flex-col gap-6">
          
          {/* Elevation Profile */}
          <div className="bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex-1 flex flex-col">
            <h3 className="text-sm text-[#00D9FF] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={16} /> Elevation Profile
            </h3>
            
            <div className="flex-1 flex items-end gap-1 mb-4 h-32 border-b border-l border-white/20 pb-1 pl-1">
              {elevationData.map((val, idx) => (
                <motion.div
                  key={idx}
                  className="w-full bg-gradient-to-t from-[#00D9FF]/20 to-[#00D9FF] rounded-t-sm"
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ type: "tween", duration: 0.2 }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="text-xs text-[#94A3B8] mb-1">Max Depth</div>
                <div className="text-xl font-bold text-red-400">-42.5m</div>
              </div>
              <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="text-xs text-[#94A3B8] mb-1">Max Height</div>
                <div className="text-xl font-bold text-green-400">+18.2m</div>
              </div>
            </div>
          </div>

          {/* Composition Scanner */}
          <div className="bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Maximize size={16} /> Surface Composition
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Regolith (Basaltic)</span>
                  <span className="text-[#00D9FF]">68%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D9FF] w-[68%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Anorthosite</span>
                  <span className="text-purple-400">22%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 w-[22%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Ice (H2O)</span>
                  <span className="text-green-400">10%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 w-[10%]" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
