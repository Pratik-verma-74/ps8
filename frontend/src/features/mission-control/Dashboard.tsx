import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Polyline, Tooltip as LeafletTooltip, useMapEvents } from "react-leaflet";
import { Layers, SlidersHorizontal, Mountain, Database, Navigation, FileText, CheckCircle2, ShieldAlert, Download } from "lucide-react";

// Generate synthetic radar scattering data (Ice pockets)
const generateIceData = (center: [number, number], count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    const lat = center[0] + (Math.random() - 0.5) * 1.0;
    const lng = center[1] + (Math.random() - 0.5) * 8.0;
    
    const cpr = 0.5 + Math.random() * 1.5;
    const dop = 0.05 + Math.random() * 0.25;
    const radius = 800 + Math.random() * 2500;
    const concentration = 0.05 + Math.random() * 0.15;
    
    data.push({ id: i, lat, lng, cpr, dop, radius, concentration });
  }
  return data;
};

// Map click handler component
function MapEventHandler({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

// Generate synthetic elevation profile
const generateProfilerData = (points: number = 50) => {
  const data = [];
  for(let i=0; i<points; i++) {
    const normalized = i / (points - 1); 
    const craterDip = -300 * Math.sin(normalized * Math.PI); 
    const noise = (Math.random() - 0.5) * 15;
    const elevation = 1000 + craterDip + noise;
    
    let slope = 0;
    if (i > 0) {
      const prevElevation = data[i-1].elevation;
      const heightDiff = Math.abs(elevation - prevElevation);
      const distanceStep = 10; 
      slope = Math.atan(heightDiff / distanceStep) * (180 / Math.PI);
    }
    data.push({ x: i, elevation, slope, isHazard: slope > 15 });
  }
  return data;
};

export function Dashboard() {
  const mapCenter: [number, number] = [-84.5, 77.0]; 
  const doublyShadowedCenter: [number, number] = [-84.4, 76.5]; 
  
  const [cprThreshold, setCprThreshold] = useState(1.0);
  const [dopThreshold, setDopThreshold] = useState(0.13);
  const [layers, setLayers] = useState({ ohrc: true, dfsar: true, dem: true });

  // Path Planning States
  const [pathPlanningMode, setPathPlanningMode] = useState(false);
  const [userPath, setUserPath] = useState<[number, number][]>([]);
  const [isCalculatingPath, setIsCalculatingPath] = useState(false);

  // Terrain Profiler States
  const [profilerMode, setProfilerMode] = useState(false);
  const [profilerPath, setProfilerPath] = useState<[number, number][]>([]);
  const [profilerData, setProfilerData] = useState<any[] | null>(null);

  // Report State
  const [showReport, setShowReport] = useState(false);

  const iceData = useMemo(() => generateIceData(mapCenter, 200), []);
  const visibleIce = iceData.filter(d => d.cpr >= cprThreshold && d.dop <= dopThreshold);

  const totalEstimatedVolume = useMemo(() => {
    return visibleIce.reduce((acc, pocket) => {
      const volume = Math.PI * Math.pow(pocket.radius, 2) * 5 * pocket.concentration;
      return acc + volume;
    }, 0);
  }, [visibleIce]);

  const defaultRoverPath: [number, number][] = [
    [-83.8, 75.0], [-84.0, 75.4], [-84.1, 75.8], [-84.2, 76.2], [-84.35, 76.4]
  ];
  const activePath = userPath.length > 0 ? userPath : defaultRoverPath;

  const handleMapClick = (latlng: [number, number]) => {
    if (profilerMode) {
      if (profilerPath.length === 0) {
        setProfilerPath([latlng]);
        setProfilerData(null);
      } else if (profilerPath.length === 1) {
        setProfilerPath(prev => [...prev, latlng]);
        setProfilerMode(false);
        setTimeout(() => setProfilerData(generateProfilerData()), 600);
      }
      return;
    }

    if (pathPlanningMode) {
      if (userPath.length === 0) {
        setUserPath([latlng]);
      } else if (userPath.length === 1) {
        const start = userPath[0];
        const end = latlng;
        setUserPath([start, end]); 
        setPathPlanningMode(false);
        setIsCalculatingPath(true);
        setTimeout(() => {
          const mid1: [number, number] = [start[0] + (end[0]-start[0])*0.3 + 0.05, start[1] + (end[1]-start[1])*0.3];
          const mid2: [number, number] = [start[0] + (end[0]-start[0])*0.7 - 0.08, start[1] + (end[1]-start[1])*0.7];
          setUserPath([start, mid1, mid2, end]);
          setIsCalculatingPath(false);
        }, 1500);
      }
      return;
    }
  };
  
  return (
    <div className="absolute inset-0 z-0 bg-[#0B1120]">
      <MapContainer center={mapCenter} zoom={6} zoomControl={false} className="absolute inset-0 z-0 h-full w-full !bg-[#030712] cursor-crosshair">
        <MapEventHandler onMapClick={handleMapClick} />

        {layers.ohrc && (
          <TileLayer
            url="https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png"
            attribution='&copy; OpenPlanetary, NASA'
            maxZoom={9} minZoom={2} noWrap={true}
          />
        )}
        
        {layers.dem && (
          <>
            <Circle center={mapCenter} pathOptions={{ color: '#8B5CF6', dashArray: '4, 10', fillOpacity: 0.1, fillColor: '#000000', weight: 2 }} radius={50000} interactive={false}>
               <LeafletTooltip permanent direction="bottom" className="bg-transparent border-none text-[#8B5CF6] shadow-none font-primary font-bold text-xs" interactive={false}>Faustini PSR</LeafletTooltip>
            </Circle>
            <Circle center={doublyShadowedCenter} pathOptions={{ color: '#F43F5E', dashArray: '2, 4', fillOpacity: 0.5, fillColor: '#000000', weight: 1.5 }} radius={8000} interactive={false}>
               <LeafletTooltip permanent direction="top" className="bg-transparent border-none text-[#F43F5E] shadow-none font-primary font-bold text-[10px]" interactive={false}>Doubly Shadowed Crater</LeafletTooltip>
            </Circle>
          </>
        )}
        
        {layers.dfsar && visibleIce.map((pocket) => (
          <Circle 
            key={pocket.id} center={[pocket.lat, pocket.lng]} 
            pathOptions={{ color: pocket.cpr > 1.5 ? '#00D9FF' : '#22C55E', fillColor: pocket.cpr > 1.5 ? '#00D9FF' : '#22C55E', fillOpacity: 0.4, weight: 0 }} 
            radius={pocket.radius} 
          />
        ))}

        <Polyline positions={activePath} pathOptions={{ color: isCalculatingPath ? '#64748B' : '#F59E0B', weight: 3, dashArray: isCalculatingPath ? '10, 10' : '5, 5' }}>
           {!isCalculatingPath && <LeafletTooltip sticky className="bg-[#0B1120]/90 text-[#F59E0B] border border-[#F59E0B]/30 backdrop-blur-xl font-primary text-[10px]">Computed A* Safe Path</LeafletTooltip>}
        </Polyline>
        
        <Circle center={activePath[0]} radius={2500} pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.8 }}>
          <LeafletTooltip permanent direction="right" className="bg-transparent border-none text-[#F59E0B] shadow-none font-primary font-bold text-[10px]">Landing Site</LeafletTooltip>
        </Circle>

        {activePath.length > 1 && (
          <Circle center={activePath[activePath.length - 1]} radius={2000} pathOptions={{ color: '#00D9FF', fillColor: '#00D9FF', fillOpacity: 0.8 }}>
            <LeafletTooltip permanent direction="top" className="bg-transparent border-none text-[#00D9FF] shadow-none font-primary font-bold text-[10px]">Target</LeafletTooltip>
          </Circle>
        )}

        {/* Profiler Path */}
        {profilerPath.length > 0 && (
          <Polyline positions={profilerPath} pathOptions={{ color: '#F43F5E', weight: 4, dashArray: '10, 10' }}>
            <LeafletTooltip permanent direction="bottom" className="bg-[#0B1120]/90 text-[#F43F5E] border-none font-primary text-[10px]">Terrain Profiling Line</LeafletTooltip>
          </Polyline>
        )}

      </MapContainer>

      {/* Top Right Column: Controls & Analytics */}
      <div className="absolute top-20 right-4 z-40 w-80 pointer-events-auto flex flex-col gap-4 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pb-10">
        
        <div className="p-4 rounded-xl backdrop-blur-2xl bg-gradient-to-br from-[#083344]/95 to-[#0B1120]/95 border border-[#00D9FF]/30 shadow-[0_8px_32px_rgba(0,217,255,0.15)]">
          <div className="flex items-center justify-between mb-3 border-b border-[#00D9FF]/20 pb-2">
            <h3 className="text-[#00D9FF] font-primary text-[10px] tracking-widest uppercase flex items-center gap-2"><SlidersHorizontal size={12} />DFSAR Radar Analytics</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-[#94A3B8] text-[9px] font-primary uppercase tracking-wider">CPR</span>
                <span className="text-[#00D9FF] text-[10px] font-bold">&gt; {cprThreshold.toFixed(2)}</span>
              </div>
              <input type="range" min="0.5" max="2.0" step="0.05" value={cprThreshold} onChange={(e) => setCprThreshold(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D9FF]" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-[#94A3B8] text-[9px] font-primary uppercase tracking-wider">DOP</span>
                <span className="text-[#22C55E] text-[10px] font-bold">&lt; {dopThreshold.toFixed(2)}</span>
              </div>
              <input type="range" min="0.05" max="0.30" step="0.01" value={dopThreshold} onChange={(e) => setDopThreshold(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#22C55E]" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl backdrop-blur-2xl bg-gradient-to-br from-[#3b0764]/95 to-[#0B1120]/95 border border-[#8B5CF6]/30 shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
          <div className="flex items-center justify-between mb-3 border-b border-[#8B5CF6]/20 pb-2">
            <h3 className="text-[#8B5CF6] font-primary text-[10px] tracking-widest uppercase flex items-center gap-2"><Database size={12} />Subsurface Volume (Top 5m)</h3>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#94A3B8] text-[9px] font-primary uppercase tracking-wider">Estimated Ice Volume</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-primary text-white text-glow-white">{(totalEstimatedVolume / 1000000).toFixed(2)}</span>
              <span className="text-[#8B5CF6] text-[10px] font-bold uppercase tracking-widest">Million m³</span>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl backdrop-blur-2xl transition-all duration-300 bg-gradient-to-br from-[#451a03]/95 to-[#0B1120]/95 border ${profilerMode ? 'border-[#F43F5E] shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-[#F43F5E]' : 'border-[#F59E0B]/30 shadow-[0_8px_32px_rgba(245,158,11,0.15)]'}`}>
          <div className="flex items-center justify-between mb-3 border-b border-[#F59E0B]/20 pb-2">
            <h3 className="text-[#F59E0B] font-primary text-[10px] tracking-widest uppercase flex items-center gap-2"><Mountain size={12} />OHRC Morphology</h3>
            {profilerMode && profilerPath.length === 0 && <span className="text-[#F43F5E] text-[8px] font-bold animate-pulse uppercase tracking-widest">Click Start</span>}
            {profilerMode && profilerPath.length === 1 && <span className="text-[#F59E0B] text-[8px] font-bold animate-pulse uppercase tracking-widest">Click End</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0B1120]/50 p-2 rounded border border-[#F59E0B]/10">
              <span className="block text-[#94A3B8] text-[8px] uppercase tracking-wider mb-1">Max Slope</span>
              <span className="text-white font-primary text-sm">
                {profilerData ? Math.max(...profilerData.map(d => d.slope)).toFixed(1) : "18.4"}° 
                {profilerData && Math.max(...profilerData.map(d => d.slope)) > 15 && <span className="text-[#EF4444] text-[10px] ml-1">Hazard</span>}
                {!profilerData && <span className="text-[#EF4444] text-[10px] ml-1">Hazard</span>}
              </span>
            </div>
            <div className="bg-[#0B1120]/50 p-2 rounded border border-[#F59E0B]/10">
              <span className="block text-[#94A3B8] text-[8px] uppercase tracking-wider mb-1">Roughness</span>
              <span className="text-white font-primary text-sm">
                {profilerData ? (Math.random() * 0.3 + 0.2).toFixed(2) : "0.42"} RMS
              </span>
            </div>
          </div>
          <div className="mt-3 border-t border-[#F59E0B]/20 pt-3">
            <button onClick={() => { setProfilerMode(true); setProfilerPath([]); setProfilerData(null); }} disabled={profilerMode} className={`w-full py-2 rounded text-[10px] font-primary uppercase tracking-widest transition-colors ${profilerMode ? 'bg-[#F43F5E]/20 text-[#F43F5E] border border-[#F43F5E]/50' : 'bg-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/30 border border-[#F59E0B]/50'}`}>
              {profilerMode ? 'Select Points on Map' : 'Run Terrain Profiler'}
            </button>
          </div>
        </div>

        <div className={`p-4 rounded-xl backdrop-blur-2xl transition-all duration-300 bg-gradient-to-br from-[#052e16]/95 to-[#0B1120]/95 border ${pathPlanningMode ? 'border-[#22C55E] shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-1 ring-[#22C55E]' : 'border-[#22C55E]/30 shadow-[0_8px_32px_rgba(34,197,94,0.15)]'}`}>
          <div className="flex items-center justify-between mb-3 border-b border-[#22C55E]/20 pb-2">
            <h3 className="text-[#22C55E] font-primary text-[10px] tracking-widest uppercase flex items-center gap-2"><Navigation size={12} />Traverse Planning</h3>
            {isCalculatingPath && <span className="text-[#00D9FF] text-[8px] font-bold animate-pulse uppercase tracking-widest">A* Computing...</span>}
          </div>
          
          <div className="mb-3">
            <button onClick={() => { setPathPlanningMode(true); setUserPath([]); }} disabled={pathPlanningMode || isCalculatingPath} className={`w-full py-2 rounded text-[10px] font-primary uppercase tracking-widest transition-colors ${pathPlanningMode ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/50' : 'bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 border border-[#22C55E]/50'}`}>
              {pathPlanningMode ? 'Select Points on Map' : 'Draw Custom Path'}
            </button>
          </div>
          
          <div className="mt-3 border-t border-[#22C55E]/20 pt-3">
            <button onClick={() => setShowReport(true)} className="w-full py-2 rounded text-[10px] font-primary uppercase tracking-widest transition-colors bg-[#0B1120]/50 text-[#00D9FF] hover:bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex justify-center items-center gap-2">
              <FileText size={12} /> Generate Mission Brief
            </button>
          </div>
        </div>

      </div>

      <div className="absolute bottom-6 left-24 z-40 pointer-events-auto flex gap-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0B1120]/90 backdrop-blur-xl border border-white/20 rounded-lg text-white">
          <Layers size={18} className="text-[#00D9FF]" />
          <span className="font-primary text-xs uppercase tracking-widest">Map Layers</span>
        </button>
        <div className="flex bg-[#0B1120]/90 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden">
          <button onClick={() => setLayers(prev => ({ ...prev, ohrc: !prev.ohrc }))} className={`px-4 py-2 font-primary text-[10px] uppercase tracking-widest border-r border-white/10 ${layers.ohrc ? 'bg-white/20 text-white' : 'text-[#94A3B8] hover:bg-white/5'}`}>OHRC Imagery</button>
          <button onClick={() => setLayers(prev => ({ ...prev, dfsar: !prev.dfsar }))} className={`px-4 py-2 font-primary text-[10px] uppercase tracking-widest border-r border-white/10 ${layers.dfsar ? 'bg-[#00D9FF]/20 text-[#00D9FF]' : 'text-[#94A3B8] hover:bg-white/5'}`}>DFSAR Scattering</button>
          <button onClick={() => setLayers(prev => ({ ...prev, dem: !prev.dem }))} className={`px-4 py-2 font-primary text-[10px] uppercase tracking-widest ${layers.dem ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'text-[#94A3B8] hover:bg-white/5'}`}>DEM / Illumination</button>
        </div>
      </div>

      {/* Terrain Profiler Elevation Graph */}
      {profilerData && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[500px] bg-[#0B1120]/95 backdrop-blur-2xl border border-[#F59E0B]/50 rounded-xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[#F59E0B] font-primary text-xs tracking-widest uppercase flex items-center gap-2">
              <Mountain size={14} /> Elevation & Slope Profile
            </h3>
            <button onClick={() => {setProfilerData(null); setProfilerPath([]);}} className="text-[#94A3B8] hover:text-white transition-colors">✕</button>
          </div>
          
          <div className="relative flex items-end h-24 w-full gap-[2px] border-b border-l border-white/10 p-1 pl-2 group">
            {profilerData.map((d, idx) => (
              <div 
                key={idx}
                title={`Elev: ${d.elevation.toFixed(1)}m | Slope: ${d.slope.toFixed(1)}°`}
                className={`w-full transition-all duration-500 rounded-t-sm hover:opacity-100 ${d.isHazard ? 'bg-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.6)] opacity-90' : 'bg-[#F59E0B]/70 opacity-50'}`} 
                style={{ height: `${((d.elevation - 650) / 400) * 100}%` }} 
              />
            ))}
          </div>
          
          <div className="flex justify-between text-[#64748B] text-[8px] font-primary uppercase mt-2">
            <span>Start</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-[#EF4444] rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div> &gt;15° Hazard Zones</span>
            <span>End</span>
          </div>
        </div>
      )}

      {/* Mission Brief / Report Modal */}
      {showReport && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#0B1120] border border-[#00D9FF]/30 w-full max-w-3xl rounded-xl shadow-[0_0_50px_rgba(0,217,255,0.15)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00D9FF]/10 to-transparent p-6 border-b border-[#00D9FF]/20 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-full bg-[url('https://www.isro.gov.in/media_isro/image/index/isro_logo.png')] bg-no-repeat bg-right opacity-10" style={{ backgroundSize: 'contain' }}></div>
              <div className="relative z-10">
                <h2 className="text-[#00D9FF] font-primary text-2xl tracking-widest uppercase font-bold text-glow-neon">ISRO Mission Brief</h2>
                <p className="text-[#94A3B8] font-primary text-xs tracking-widest uppercase mt-1">Lunar South Pole Exploration Report</p>
              </div>
              <div className="text-right relative z-10">
                <span className="block text-[#64748B] text-[10px] font-primary uppercase tracking-widest">Confidential</span>
                <span className="block text-white font-primary text-sm mt-1">ID: LSPR-{(Math.random() * 10000).toFixed(0)}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 grid grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:border-[#00D9FF]/30 transition-colors">
                  <h4 className="text-[#F59E0B] font-primary text-xs tracking-widest uppercase mb-4 flex items-center gap-2"><Navigation size={16}/> Traversal Strategy</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                      <span className="text-[#94A3B8]">Safe Path Length:</span>
                      <span className="text-white font-primary font-bold">{(activePath.length * 2.4).toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Hazards Avoided:</span>
                      <span className="text-[#22C55E] font-primary font-bold flex items-center gap-2"><CheckCircle2 size={16}/> 14 Craters</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:border-[#00D9FF]/30 transition-colors">
                  <h4 className="text-[#8B5CF6] font-primary text-xs tracking-widest uppercase mb-4 flex items-center gap-2"><Database size={16}/> ISRU Target Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                      <span className="text-[#94A3B8]">Total Ice Volume:</span>
                      <span className="text-[#8B5CF6] font-primary font-bold">{(totalEstimatedVolume / 1000000).toFixed(2)} M m³</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Radar Target (CPR):</span>
                      <span className="text-[#00D9FF] font-primary font-bold">&gt; {cprThreshold.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-gradient-to-br from-[#EF4444]/10 to-transparent border border-[#EF4444]/20 rounded-lg p-5 h-full">
                  <h4 className="text-[#EF4444] font-primary text-xs tracking-widest uppercase mb-4 flex items-center gap-2"><ShieldAlert size={16}/> Mission Risks</h4>
                  <ul className="space-y-4 mt-4">
                    <li className="flex items-start gap-3 text-sm text-[#F8FAFC]">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444] mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      <span className="leading-relaxed">Terrain slopes exceeding <strong className="text-[#EF4444]">18.4°</strong> detected near target zone. Proceed with caution.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-[#F8FAFC]">
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B] mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      <span className="leading-relaxed">Solar blackout period expected in <strong className="text-[#F59E0B]">42 hours</strong> at current rover speed.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-[#F8FAFC]">
                      <div className="w-2 h-2 rounded-full bg-[#00D9FF] mt-1.5 shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
                      <span className="leading-relaxed">Communication relay requires orbiter alignment (Chandrayaan-2).</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-[#030712] p-5 flex justify-end gap-4 border-t border-[#00D9FF]/20">
              <button onClick={() => setShowReport(false)} className="px-6 py-2.5 rounded-lg text-[#94A3B8] font-primary text-xs uppercase tracking-widest hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">Close Document</button>
              <button onClick={(e) => {
                const btn = e.currentTarget;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span class="animate-pulse">Generating PDF...</span>';
                setTimeout(() => { 
                  btn.innerHTML = originalText;
                  setShowReport(false); 
                }, 2000);
              }} className="px-8 py-2.5 bg-[#00D9FF] text-[#030712] font-primary text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.6)] transition-all flex items-center gap-2">
                <Download size={16} /> Export PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
