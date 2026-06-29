import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Orbit } from 'lucide-react';
import { fetchIceVolumeSublayer } from '../../utils/api';
import type { IceRecord } from '../../utils/api';

interface Node {
  id: number | string;
  x: number;
  y: number;
  label: string;
  raw?: IceRecord;
}

export function IceMappingDashboard() {
  const [iceNodes, setIceNodes] = useState<Node[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  useEffect(() => {
    async function loadIce() {
      const data = await fetchIceVolumeSublayer();
      const mapped = data.slice(0, 10).map((r, i) => ({
        id: r.Crater_ID || i + 1,
        x: Math.min(85, Math.max(15, ((r.Longitude + 180) % 360) / 3.6)),
        y: Math.min(85, Math.max(15, ((r.Latitude + 90) / 2) * 70 + 15)),
        label: r.Crater_ID || `Sector ${i + 1}`,
        raw: r
      }));
      setIceNodes(mapped);
    }
    loadIce();
  }, []);

  const handleNodeClick = (node: Node) => {
    if (selectedNodes.find(n => n.id === node.id)) {
      setSelectedNodes(selectedNodes.filter(n => n.id !== node.id));
    } else if (selectedNodes.length < 2) {
      setSelectedNodes([...selectedNodes, node]);
    } else {
      setSelectedNodes([selectedNodes[1], node]);
    }
  };

  const calculateDistance = (n1: Node, n2: Node) => {
    // Assuming 1% = 10km for simulation
    const dx = n1.x - n2.x;
    const dy = n1.y - n2.y;
    return Math.sqrt(dx * dx + dy * dy) * 10;
  };

  return (
    <div className="w-full h-full p-8 flex flex-col text-white font-primary h-screen pt-24 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="text-[#00D9FF]" size={28} />
        <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#0055FF]">
          PSRs Ice Mapping
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        {/* Main Map Area */}
        <div className="col-span-1 lg:col-span-3 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-4 relative overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(0,217,255,0.05)]">
          
          <div className="absolute inset-0 opacity-20" 
            style={{ 
              backgroundImage: 'linear-gradient(#00D9FF 1px, transparent 1px), linear-gradient(90deg, #00D9FF 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }} 
          />

          {/* SVG Canvas for Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {selectedNodes.length === 2 && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                x1={`${selectedNodes[0].x}%`}
                y1={`${selectedNodes[0].y}%`}
                x2={`${selectedNodes[1].x}%`}
                y2={`${selectedNodes[1].y}%`}
                stroke="#00D9FF"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="drop-shadow-[0_0_10px_rgba(0,217,255,0.8)]"
              />
            )}
            
            {/* Display Distance text on the line */}
            {selectedNodes.length === 2 && (
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                x={`${(selectedNodes[0].x + selectedNodes[1].x) / 2}%`}
                y={`${(selectedNodes[0].y + selectedNodes[1].y) / 2 - 2}%`}
                fill="#fff"
                fontSize="14"
                textAnchor="middle"
                className="font-bold drop-shadow-md"
              >
                {calculateDistance(selectedNodes[0], selectedNodes[1]).toFixed(1)} km
              </motion.text>
            )}
          </svg>

          {/* Ice Nodes */}
          {iceNodes.map(node => {
            const isSelected = selectedNodes.find(n => n.id === node.id);
            return (
              <div
                key={node.id}
                className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onClick={() => handleNodeClick(node)}
              >
                <div className="relative">
                  {/* Outer pulse */}
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${isSelected ? 'bg-green-400' : 'bg-[#00D9FF]'}`} />
                  {/* Core */}
                  <div className={`w-4 h-4 rounded-full border-2 border-black relative z-10 transition-colors ${isSelected ? 'bg-green-400 shadow-[0_0_15px_#4ade80]' : 'bg-[#00D9FF] shadow-[0_0_15px_#00D9FF]'}`} />
                </div>
                <span className="mt-2 text-xs text-[#94A3B8] font-medium group-hover:text-white transition-colors bg-black/50 px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap">
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Side Panel */}
        <div className="col-span-1 bg-[#0B1120]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-white">Ice Node Analysis</h2>
            <p className="text-sm text-[#94A3B8]">Select two nodes on the map to calculate the traversal distance between hidden ice deposits.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Orbit size={16} /> Selected Nodes
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                <span className="text-sm">Point A</span>
                <span className="text-sm font-semibold text-[#00D9FF]">{selectedNodes[0]?.label || 'None'}</span>
              </div>
              <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                <span className="text-sm">Point B</span>
                <span className="text-sm font-semibold text-[#00D9FF]">{selectedNodes[1]?.label || 'None'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#00D9FF]/20 to-transparent rounded-xl p-5 border border-[#00D9FF]/30 mt-auto">
            <h3 className="text-sm text-[#00D9FF] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Navigation size={16} /> Calculated Distance
            </h3>
            <div className="text-4xl font-bold text-white tracking-wider">
              {selectedNodes.length === 2 
                ? `${calculateDistance(selectedNodes[0], selectedNodes[1]).toFixed(1)}` 
                : '0.0'}
              <span className="text-lg text-[#94A3B8] ml-2">km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
