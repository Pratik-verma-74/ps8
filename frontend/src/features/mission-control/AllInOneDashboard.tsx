import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchMissionStats, fetchIceVolumeSublayer } from '../../utils/api';
import { Radio, ShieldAlert, Power, Compass, Activity, Database, Zap, Thermometer, Terminal } from 'lucide-react';

export function AllInOneDashboard() {
  const [stats, setStats] = useState({
    totalPoints: 5000,
    iceZones: 526,
    safeLanding: 1501,
    avgTemp: -134.7,
    battery: 98.0,
    solarEff: 94.2
  });

  const [switches, setSwitches] = useState({
    mainPower: true,
    radarSweep: true,
    commsLink: true,
    cryoHeaters: false
  });

  const [radarAngle, setRadarAngle] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    "SYS_BOOT: Pragyan-II Hardware Diagnostics Nominal.",
    "DFSAR: L/S-Band Radar locked onto Faustini Crater Sector 4.",
    "OHRC: High-resolution DEM alignment confirmed (<0.1m error).",
    "COMMS: Telemetry stream active with ISRO Deep Space Network."
  ]);

  useEffect(() => {
    async function loadData() {
      const s = await fetchMissionStats();
      if (s) {
        setStats(prev => ({
          ...prev,
          totalPoints: s.total_data_points || 5000,
          iceZones: s.high_ice_zones || 526,
          safeLanding: s.safe_landing_sites || 1501,
          avgTemp: s.avg_temperature ? (s.avg_temperature > 100 ? Number((s.avg_temperature - 273.15).toFixed(1)) : s.avg_temperature) : -134.7
        }));
      }
    }
    loadData();

    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 6) % 360);
      if (Math.random() > 0.7) {
        const msgs = [
          "RADAR: Subsurface dielectric anomaly detected (CPR > 1.45)",
          "THERMAL: PSR Shadow approach. External temp dropping nominal.",
          "POWER: Solar array gimbal adjusted +0.4° Azimuth.",
          "NAV: A* Path obstacle avoidance waypoint validated."
        ];
        const randomMsg = `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msgs[Math.floor(Math.random() * msgs.length)]}`;
        setLogs(prev => [...prev.slice(-6), randomMsg]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSwitch = (key: keyof typeof switches) => {
    setSwitches(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-[#111317] text-gray-200 font-primary pt-20 pb-12 px-6 select-none custom-scrollbar">
      
      {/* Outer Metallic Instrument Plate */}
      <div className="max-w-7xl mx-auto bg-gradient-to-b from-[#242830] via-[#1a1d24] to-[#121418] border-4 border-[#333945] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.2)] relative">
        
        {/* Corner Hardware Rivets */}
        <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-gradient-to-br from-[#6b7280] to-[#1f2937] border border-[#4b5563] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#111] rotate-45" /></div>
        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-gradient-to-br from-[#6b7280] to-[#1f2937] border border-[#4b5563] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#111] -rotate-45" /></div>
        <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-gradient-to-br from-[#6b7280] to-[#1f2937] border border-[#4b5563] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#111] rotate-12" /></div>
        <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-gradient-to-br from-[#6b7280] to-[#1f2937] border border-[#4b5563] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-center"><div className="w-2 h-0.5 bg-[#111] -rotate-12" /></div>

        {/* Top Cockpit Title & Toggle Switches Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-b from-[#1f232b] to-[#15181e] border-2 border-[#2c323d] rounded-2xl p-4 mb-6 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-t from-[#0d1015] to-[#252a33] border border-[#3b4252] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Compass className="text-[#00ffcc] animate-spin" size={28} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#00ffcc] font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]" /> ISRO CHANDRAYAAN-4 COCKPIT
              </div>
              <h1 className="text-2xl font-black tracking-wider text-gray-100 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Pragyan-II Tactical Command Console
              </h1>
            </div>
          </div>

          {/* Hardware Toggle Switch Bay */}
          <div className="flex gap-6 bg-[#0e1014] p-3 rounded-xl border border-[#232730] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
            {[
              { id: 'mainPower', label: 'MAIN PWR', active: switches.mainPower, color: '#00ff66' },
              { id: 'radarSweep', label: 'DFSAR RADAR', active: switches.radarSweep, color: '#00d9ff' },
              { id: 'commsLink', label: 'EARTH LINK', active: switches.commsLink, color: '#ffb700' },
              { id: 'cryoHeaters', label: 'HEATERS', active: switches.cryoHeaters, color: '#ff3366' }
            ].map(sw => (
              <div key={sw.id} onClick={() => toggleSwitch(sw.id as any)} className="flex flex-col items-center cursor-pointer group">
                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1 group-hover:text-white">{sw.label}</div>
                
                {/* Physical LED Indicator */}
                <div 
                  className="w-3 h-3 rounded-full mb-1 transition-all duration-300 border border-black"
                  style={{
                    backgroundColor: sw.active ? sw.color : '#222',
                    boxShadow: sw.active ? `0 0 10px ${sw.color}, inset 0 1px 2px white` : 'none'
                  }}
                />

                {/* Metallic Toggle Switch Body */}
                <div className="w-8 h-12 bg-gradient-to-b from-[#181a20] to-[#252933] rounded border border-[#3b4252] p-1 flex flex-col justify-between items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                  <div className={`w-6 h-5 rounded transition-all duration-200 shadow-md border ${sw.active ? 'bg-gradient-to-t from-[#3b4252] to-[#6b7280] border-gray-400 translate-y-0' : 'bg-gradient-to-b from-[#1f232b] to-[#111] border-gray-700 translate-y-5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Column Cockpit Bay */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Analog Gauges & Power Systems (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Round Gauge Box */}
            <div className="bg-gradient-to-b from-[#1c1f26] to-[#14161b] border-2 border-[#2d333f] rounded-2xl p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_8px_20px_rgba(0,0,0,0.5)] relative">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 border-b border-[#2d333f] pb-2 mb-4 flex items-center justify-between">
                <span>⚡ Power & Storage Gauge</span>
                <span className="text-[#00ff66] text-[10px]">NOMINAL</span>
              </div>

              <div className="flex justify-around items-center py-2">
                
                {/* Battery Dial Gauge */}
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full bg-[#0a0b0e] border-4 border-[#3b4252] shadow-[inset_0_5px_15px_rgba(0,0,0,0.9),0_2px_4px_rgba(255,255,255,0.1)] relative flex items-center justify-center">
                    <div 
                      className="absolute inset-2 rounded-full"
                      style={{
                        background: `conic-gradient(#00ff66 0% ${stats.battery}%, #1a1d24 ${stats.battery}% 100%)`
                      }}
                    />
                    <div className="absolute inset-4 rounded-full bg-[#15181e] border border-[#2d333f] flex flex-col items-center justify-center">
                      <span className="text-xl font-mono font-bold text-[#00ff66] drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]">{stats.battery}%</span>
                      <span className="text-[8px] font-mono text-gray-400 uppercase">BATTERY</span>
                    </div>
                  </div>
                </div>

                {/* Solar Dial Gauge */}
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full bg-[#0a0b0e] border-4 border-[#3b4252] shadow-[inset_0_5px_15px_rgba(0,0,0,0.9),0_2px_4px_rgba(255,255,255,0.1)] relative flex items-center justify-center">
                    <div 
                      className="absolute inset-2 rounded-full"
                      style={{
                        background: `conic-gradient(#ffb700 0% ${stats.solarEff}%, #1a1d24 ${stats.solarEff}% 100%)`
                      }}
                    />
                    <div className="absolute inset-4 rounded-full bg-[#15181e] border border-[#2d333f] flex flex-col items-center justify-center">
                      <span className="text-xl font-mono font-bold text-[#ffb700] drop-shadow-[0_0_8px_rgba(255,183,0,0.5)]">{stats.solarEff}%</span>
                      <span className="text-[8px] font-mono text-gray-400 uppercase">SOLAR ARR</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Thermal Segmented Display */}
            <div className="bg-gradient-to-b from-[#1c1f26] to-[#14161b] border-2 border-[#2d333f] rounded-2xl p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 border-b border-[#2d333f] pb-2 mb-4 flex items-center justify-between">
                <span>❄️ Cryogenic Thermal Bay</span>
                <span className="text-[#00d9ff] text-[10px]">STABLE</span>
              </div>

              <div className="bg-[#08090c] border-2 border-[#1c222c] rounded-xl p-4 shadow-[inset_0_0_15px_rgba(0,217,255,0.15)] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase">External Surface Temp</div>
                  <div className="text-3xl font-mono font-black text-[#00d9ff] tracking-tight drop-shadow-[0_0_10px_rgba(0,217,255,0.6)]">
                    {stats.avgTemp} °C
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 mt-1">PSR SHADOW EQUILIBRIUM</div>
                </div>
                <div className="flex gap-1 h-12 items-end">
                  {[30, 45, 60, 40, 80, 95, 70, 50].map((h, i) => (
                    <div key={i} className="w-2 bg-[#00d9ff]/40 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Center Column: Tactical DFSAR Radar Scope & CRT Screen (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-gradient-to-b from-[#1c1f26] to-[#14161b] border-2 border-[#2d333f] rounded-2xl p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_8px_20px_rgba(0,0,0,0.5)] flex-1 flex flex-col items-center justify-center relative">
              <div className="w-full text-xs font-mono font-bold uppercase tracking-widest text-gray-400 border-b border-[#2d333f] pb-2 mb-4 flex items-center justify-between">
                <span>🛰️ DFSAR L/S-Band Radar Scope</span>
                <span className="text-[#00ffcc] text-[10px] animate-pulse">SWEEPING</span>
              </div>

              {/* CRT Green Monitor Frame */}
              <div className="w-full aspect-square max-w-[300px] rounded-full bg-[#030d06] border-8 border-[#252a33] shadow-[inset_0_0_40px_rgba(0,255,102,0.4),0_5px_15px_rgba(0,0,0,0.9)] relative flex items-center justify-center overflow-hidden">
                
                {/* Radar Grid Lines */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-[#00ff66]/20" />
                <div className="absolute w-[50%] h-[50%] rounded-full border border-[#00ff66]/20" />
                <div className="absolute w-[20%] h-[20%] rounded-full border border-[#00ff66]/20" />
                <div className="absolute w-full h-[1px] bg-[#00ff66]/20" />
                <div className="absolute h-full w-[1px] bg-[#00ff66]/20" />

                {/* Sweeping Beam */}
                <div 
                  className="absolute inset-0 origin-center transition-transform duration-1000 ease-linear"
                  style={{
                    transform: `rotate(${radarAngle}deg)`,
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(0,255,102,0.4) 15%, transparent 15%)'
                  }}
                />

                {/* Ice Target Blips */}
                <div className="absolute top-[30%] left-[65%] w-3 h-3 bg-[#00ff66] rounded-full shadow-[0_0_10px_#00ff66] animate-ping" />
                <div className="absolute top-[70%] left-[40%] w-2 h-2 bg-[#00d9ff] rounded-full shadow-[0_0_8px_#00d9ff]" />

                {/* Rover Center Crosshair */}
                <div className="z-10 text-[#00ff66] font-mono text-[10px] font-bold bg-black/60 px-1.5 py-0.5 rounded border border-[#00ff66]/40">
                  ROVER [0,0]
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 mt-4 text-center font-mono text-xs">
                <div className="bg-[#0c0e12] p-2 rounded border border-[#232730]">
                  <span className="text-gray-500 text-[9px] block">ICE TARGET DIST</span>
                  <span className="text-[#00ff66] font-bold">42.8 Meters</span>
                </div>
                <div className="bg-[#0c0e12] p-2 rounded border border-[#232730]">
                  <span className="text-gray-500 text-[9px] block">DIELECTRIC CPR</span>
                  <span className="text-[#00d9ff] font-bold">1.68 (HIGH)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Digital LED Readout Bay & Mission Metrics (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-gradient-to-b from-[#1c1f26] to-[#14161b] border-2 border-[#2d333f] rounded-2xl p-5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_8px_20px_rgba(0,0,0,0.5)] flex-1 flex flex-col justify-between">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 border-b border-[#2d333f] pb-2 mb-4 flex items-center justify-between">
                <span>📊 ISRU Intelligence Telemetry</span>
                <span className="text-[#ffb700] text-[10px]">6-BACKBONE</span>
              </div>

              <div className="space-y-4">
                
                {/* Segmented LED Metric 1 */}
                <div className="bg-[#0a0c10] border-2 border-[#1c222c] rounded-xl p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Total Telemetry Soundings</span>
                    <span className="text-2xl font-mono font-bold text-white tracking-wider">{stats.totalPoints.toLocaleString()}</span>
                  </div>
                  <Database className="text-gray-500" size={24} />
                </div>

                {/* Segmented LED Metric 2 */}
                <div className="bg-[#0a0c10] border-2 border-[#1c222c] rounded-xl p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">High Probability Ice Zones</span>
                    <span className="text-2xl font-mono font-bold text-[#00ffcc] tracking-wider drop-shadow-[0_0_8px_rgba(0,255,204,0.5)]">{stats.iceZones} Craters</span>
                  </div>
                  <Activity className="text-[#00ffcc]" size={24} />
                </div>

                {/* Segmented LED Metric 3 */}
                <div className="bg-[#0a0c10] border-2 border-[#1c222c] rounded-xl p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase block">Safe Landing Sites (Slope &lt; 12°)</span>
                    <span className="text-2xl font-mono font-bold text-[#00ff66] tracking-wider drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]">{stats.safeLanding} Zones</span>
                  </div>
                  <ShieldAlert className="text-[#00ff66]" size={24} />
                </div>

              </div>

              {/* Hardware Push Button */}
              <button onClick={() => alert("Transmitting full mission report to ISRO Deep Space Network...")} className="w-full mt-4 py-3 bg-gradient-to-t from-[#1b5e20] to-[#2e7d32] hover:from-[#2e7d32] hover:to-[#388e3c] border-2 border-[#4caf50] rounded-xl font-mono font-bold text-xs uppercase tracking-widest text-white shadow-[0_4px_10px_rgba(46,125,50,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-0.5 transition-all">
                📡 Transmit Summary to ISRO HQ
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Console Bay: Dot Matrix Log Printer */}
        <div className="mt-6 bg-[#0c0e12] border-2 border-[#232730] rounded-2xl p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)]">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00ff66] mb-2 flex items-center gap-2">
            <Terminal size={14} /> Pragyan-II Live Hardware Datastream (Dot Matrix Printer Feed)
          </div>
          <div className="font-mono text-xs text-gray-400 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
            {logs.map((lg, i) => (
              <div key={i} className="border-b border-[#1f232b] pb-1 last:border-none">
                <span className="text-[#00d9ff]">&gt;</span> {lg}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
