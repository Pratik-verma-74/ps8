import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Route, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Point { x: number; y: number; }
interface LandingZone extends Point { id: string; safe: boolean; }
interface IceDeposit extends Point { id: string; }

const LANDING_ZONES: LandingZone[] = [
  { id: 'LZ-1', x: 20, y: 30, safe: true },
  { id: 'LZ-2', x: 60, y: 40, safe: false }, // Hazard zone
  { id: 'LZ-3', x: 45, y: 75, safe: true },
];

const ICE_DEPOSITS: IceDeposit[] = [
  { id: 'ICE-A', x: 80, y: 20 },
  { id: 'ICE-B', x: 85, y: 80 },
];

export function PathPlanningDashboard() {
  const [selectedLZ, setSelectedLZ] = useState<LandingZone | null>(null);
  const [selectedIce, setSelectedIce] = useState<IceDeposit | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [pathCalculated, setPathCalculated] = useState(false);

  // Simulated path generation
  const generatePath = (start: Point, end: Point) => {
    // Generate some bezier curve control points for a smooth, avoidant path
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    // Add random curve to avoid "obstacles"
    const controlX = midX + (Math.random() * 20 - 10);
    const controlY = midY + (Math.random() * 20 - 10);
    return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
  };

  const handleStartPlanning = () => {
    if (!selectedLZ || !selectedIce) return;
    setIsPlanning(true);
    setPathCalculated(false);
    
    // Simulate AI processing time
    setTimeout(() => {
      setIsPlanning(false);
      setPathCalculated(true);
    }, 2000);
  };

  return (
    <div className="w-full h-full p-8 flex flex-col text-white font-primary h-screen pt-24 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Route className="text-[#00D9FF]" size={28} />
        <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#0055FF]">
          Landing & Traversal Planner
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        {/* Main Map Area */}
        <div className="col-span-1 lg:col-span-3 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-4 relative overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(0,217,255,0.05)]">
          
          {/* Topographical Map background simulation */}
          <div className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 20%, #0B1120 100%), repeating-radial-gradient(circle at 50% 50%, rgba(0, 217, 255, 0.1) 0, rgba(0, 217, 255, 0.1) 10px, transparent 10px, transparent 20px)'
            }}
          />

          {/* SVG Canvas for Paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
            <AnimatePresence>
              {pathCalculated && selectedLZ && selectedIce && (
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d={generatePath(selectedLZ, selectedIce)}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                  className="drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                />
              )}
            </AnimatePresence>
            
            {/* Rover animation along path */}
            {pathCalculated && selectedLZ && selectedIce && (
               <motion.circle
                  r="4"
                  fill="#fff"
                  className="drop-shadow-[0_0_10px_rgba(255,255,255,1)]"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2 }}
                  style={{ offsetPath: `path('${generatePath(selectedLZ, selectedIce)}')` } as any}
               />
            )}
          </svg>

          {/* Landing Zones */}
          {LANDING_ZONES.map(lz => (
            <div
              key={lz.id}
              className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group ${!lz.safe ? 'opacity-60' : ''}`}
              style={{ left: `${lz.x}%`, top: `${lz.y}%` }}
              onClick={() => lz.safe && setSelectedLZ(lz)}
            >
              <div className="relative">
                <div className={`absolute inset-0 rounded-full animate-pulse opacity-40 ${lz.safe ? 'bg-green-500' : 'bg-red-500'}`} />
                <Target size={24} className={`relative z-10 ${selectedLZ?.id === lz.id ? 'text-white' : (lz.safe ? 'text-green-500' : 'text-red-500')}`} />
              </div>
              <span className="mt-1 text-xs font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
                {lz.id} {lz.safe ? '(SAFE)' : '(HAZARD)'}
              </span>
            </div>
          ))}

          {/* Ice Deposits */}
          {ICE_DEPOSITS.map(ice => (
            <div
              key={ice.id}
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
              style={{ left: `${ice.x}%`, top: `${ice.y}%` }}
              onClick={() => setSelectedIce(ice)}
            >
              <div className={`w-5 h-5 rounded border-2 border-white transform rotate-45 transition-colors ${selectedIce?.id === ice.id ? 'bg-[#00D9FF] shadow-[0_0_20px_#00D9FF]' : 'bg-transparent'}`} />
              <span className="mt-2 text-xs text-[#00D9FF] font-medium bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
                {ice.id}
              </span>
            </div>
          ))}
        </div>

        {/* Side Panel */}
        <div className="col-span-1 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-white">Mission Planner</h2>
            <p className="text-sm text-[#94A3B8]">Select a safe landing zone, then select target ice deposit to calculate optimal traverse path.</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* LZ Selection */}
            <div className={`p-4 rounded-xl border ${selectedLZ ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
              <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldAlert size={16} /> Selected Landing Zone
              </h3>
              <div className="text-lg font-semibold text-white">
                {selectedLZ ? selectedLZ.id : <span className="text-white/30 italic">Awaiting selection...</span>}
              </div>
            </div>

            {/* Ice Selection */}
            <div className={`p-4 rounded-xl border ${selectedIce ? 'border-[#00D9FF]/50 bg-[#00D9FF]/10' : 'border-white/10 bg-white/5'}`}>
              <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Target size={16} /> Target Ice Deposit
              </h3>
              <div className="text-lg font-semibold text-white">
                {selectedIce ? selectedIce.id : <span className="text-white/30 italic">Awaiting selection...</span>}
              </div>
            </div>
          </div>

          <button
            disabled={!selectedLZ || !selectedIce || isPlanning}
            onClick={handleStartPlanning}
            className={`mt-auto w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2
              ${!selectedLZ || !selectedIce 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : isPlanning 
                  ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 animate-pulse'
                  : 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/50 hover:bg-[#00D9FF]/30 shadow-[0_0_20px_rgba(0,217,255,0.2)]'
              }`}
          >
            {isPlanning ? 'Calculating...' : pathCalculated ? 'Recalculate Path' : 'Generate Route'}
          </button>

          {pathCalculated && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-start gap-3"
            >
              <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold text-green-500">Path Confirmed</h4>
                <p className="text-xs text-green-500/70 mt-1">Autonomous route generated avoiding 2 hazard zones. Estimated traverse time: 4.2 hrs.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
