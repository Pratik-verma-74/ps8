import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, BatteryCharging, Thermometer, AlertTriangle, Zap } from 'lucide-react';
import { fetchMissionStats } from '../../utils/api';

export function SimulationDashboard() {
  const [battery, setBattery] = useState(98.0);
  const [temp, setTemp] = useState(-134.7);
  const [solarEff, setSolarEff] = useState(94.2);

  useEffect(() => {
    async function loadRealStats() {
      const stats = await fetchMissionStats();
      if (stats.avg_temperature) {
        // Convert Kelvin to Celsius if reported in Kelvin (>100)
        const t = stats.avg_temperature > 100 ? stats.avg_temperature - 273.15 : stats.avg_temperature;
        setTemp(Number(t.toFixed(1)));
      }
    }
    loadRealStats();

    const interval = setInterval(() => {
      // Simulate slight fluctuations in metrics around nominal setpoints
      setBattery(prev => Math.max(0, prev - (Math.random() * 0.1)));
      setTemp(prev => prev + (Math.random() * 0.4 - 0.2));
      setSolarEff(prev => Math.min(100, Math.max(0, prev + (Math.random() * 1.0 - 0.5))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full p-8 flex flex-col text-white font-primary h-screen pt-24 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Cpu className="text-[#00D9FF]" size={28} />
        <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#0055FF]">
          Power & Hazards Simulator
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        
        {/* Core Systems Vitals */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-6">
          
          {/* Battery Status */}
          <div className="col-span-2 md:col-span-1 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BatteryCharging size={100} />
            </div>
            <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10">
              <Zap size={16} /> Power Reserves
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <div className="text-6xl font-bold text-white mb-2">{battery.toFixed(1)}%</div>
              <div className={`text-sm ${battery > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                {battery > 50 ? 'OPTIMAL DRAIN' : 'CONSERVING POWER'}
              </div>
              
              <div className="w-full mt-8 bg-black/50 rounded-lg h-8 overflow-hidden border border-white/10 p-1 flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-sm transition-all duration-1000 ${i < Math.floor(battery / 10) ? 'bg-[#00D9FF] shadow-[0_0_10px_#00D9FF]' : 'bg-white/5'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Thermal Regulation */}
          <div className="col-span-2 md:col-span-1 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Thermometer size={100} />
            </div>
            <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10">
              <Thermometer size={16} /> Thermal Core
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <div className="text-6xl font-bold text-white mb-2">{temp.toFixed(1)}°C</div>
              <div className="text-sm text-blue-400">NOMINAL PSR TEMP</div>
              
              <div className="w-full mt-8 relative">
                <div className="h-2 bg-gradient-to-r from-blue-600 via-green-500 to-red-600 rounded-full" />
                <motion.div 
                  className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] border-2 border-black"
                  animate={{ left: `${((temp + 100) / 200) * 100}%` }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
              </div>
              <div className="w-full flex justify-between mt-2 text-[10px] text-white/40 font-mono">
                <span>-100°C</span>
                <span>+100°C</span>
              </div>
            </div>
          </div>

          {/* Solar Array Efficiency */}
          <div className="col-span-2 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex items-center gap-8">
            <div className="w-32 h-32 relative flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#eab308" 
                  strokeWidth="10"
                  strokeDasharray="283"
                  animate={{ strokeDashoffset: 283 - (283 * solarEff) / 100 }}
                  transition={{ duration: 1 }}
                  className="drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-yellow-500">
                {solarEff.toFixed(0)}%
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">Solar Array Alignment</h3>
              <p className="text-sm text-[#94A3B8] mb-4">Sun tracking active. Arrays are currently capturing optimal solar radiation for the given lunar latitude.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <div className="text-[10px] text-white/50 mb-1">AZIMUTH</div>
                  <div className="text-sm font-mono text-white">142.5°</div>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <div className="text-[10px] text-white/50 mb-1">ELEVATION</div>
                  <div className="text-sm font-mono text-white">45.2°</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Hazard Warning System */}
        <div className="col-span-1 bg-red-950/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl flex flex-col">
          <h3 className="text-sm text-red-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <AlertTriangle size={16} /> Hazard Detection System
          </h3>

          <div className="space-y-4 flex-1">
            {/* Active Alert */}
            <motion.div 
              className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex gap-4 items-start"
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="bg-red-500/20 p-2 rounded-lg text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-red-500 font-bold text-sm">Micro-Meteorite Shower</h4>
                <p className="text-red-400/70 text-xs mt-1">Detected localized impacts in Sector 4. Recommending holding traversal.</p>
                <div className="text-[10px] text-red-500/50 mt-2 font-mono">T-MINUS 14:22:00</div>
              </div>
            </motion.div>

            {/* Resolved Alerts */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-4 items-start opacity-60">
              <div className="bg-white/10 p-2 rounded-lg text-white/50">
                <Thermometer size={20} />
              </div>
              <div>
                <h4 className="text-white/70 font-bold text-sm">Extreme Shadow Cold</h4>
                <p className="text-white/50 text-xs mt-1">Rover entered PSR. Heaters engaged. Core temp stabilized.</p>
                <div className="text-[10px] text-white/30 mt-2 font-mono">RESOLVED - 2 HOURS AGO</div>
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold text-sm tracking-wider hover:bg-red-500/30 transition-colors mt-4">
            INITIATE LOCKDOWN MODE
          </button>
        </div>

      </div>
    </div>
  );
}
