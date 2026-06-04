import { motion, AnimatePresence } from 'motion/react';
import { useMemo, useState, useEffect } from 'react';
import { Activity, Clock, Cpu, FileJson, ChevronRight, Download, Search, X, Pause, Play, Filter, Terminal, ArrowLeft, Info } from 'lucide-react';
import { iridiumClient } from '../../lib/websocket';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface ProfilerNodeData {
  id: string;
  name: string;
  duration: number;
  percentage: number;
  pluginName: string;
  color: string;
  rawString: string;
  minStr?: string;
  avgStr?: string;
  maxStr?: string;
  countStr?: string;
  children: ProfilerNodeData[];
}

interface ProfilerFile {
  filename: string;
  createdAt: string;
  size: number;
}

// Generate deterministic colors based on plugin name
function getPluginColor(pluginName: string) {
  let hash = 0;
  for (let i = 0; i < pluginName.length; i++) {
    hash = pluginName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hex to RGB to apply opacity for background, or just use HSL for better colors
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

export function Profiler() {
  const [search, setSearch] = useState('');
  const [isProfiling, setIsProfiling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [profilerFiles, setProfilerFiles] = useState<ProfilerFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProfilerFile | null>(null);
  const [traceData, setTraceData] = useState<any | null>(null);
  const [isLoadingTrace, setIsLoadingTrace] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Speedscope-like selected node
  const [selectedNode, setSelectedNode] = useState<ProfilerNodeData | null>(null);

  useEffect(() => {
    // Initial fetch
    iridiumClient.send('profiler_list');

    const handleList = (data: ProfilerFile[]) => {
      setProfilerFiles(data);
      setIsProfiling(false);
      setIsRecording(false);
    };

    const handleData = (data: any) => {
      setTraceData(data);
      setIsLoadingTrace(false);
    };

    const handleError = (err: any) => {
      setIsProfiling(false);
      setIsRecording(false);
      setIsLoadingTrace(false);
      setErrorMsg(err.message || 'An unknown error occurred');
      console.error('Profiler error:', err);
    };

    iridiumClient.on('profiler_list_data', handleList);
    iridiumClient.on('profiler_data', handleData);
    iridiumClient.on('error', handleError);

    return () => {
      iridiumClient.off('profiler_list_data', handleList);
      iridiumClient.off('profiler_data', handleData);
      iridiumClient.off('error', handleError);
    };
  }, []);

  const handleStartProfiler = () => {
    setIsRecording(true);
    setErrorMsg(null);
    iridiumClient.send('profiler_enable');
  };

  const handleStopProfiler = () => {
    setIsRecording(false);
    setIsProfiling(true); // "Saving..."
    iridiumClient.send('profiler_save');
    // Refresh list after 3 seconds to let game save it
    setTimeout(() => {
      iridiumClient.send('profiler_list');
    }, 3000);
  };

  const handleSelectFile = (file: ProfilerFile) => {
    setSelectedFile(file);
    setIsLoadingTrace(true);
    setTraceData(null);
    setErrorMsg(null);
    setSelectedNode(null);
    iridiumClient.send('profiler_load', { filename: file.filename });
  };

  const handleBackToList = () => {
    setSelectedFile(null);
    setTraceData(null);
    setSelectedNode(null);
  };

  const handleExportJson = () => {
    if (!traceData || !selectedFile) return;
    const blob = new Blob([JSON.stringify(traceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parsing trace data
  const { totalDuration, flatNodes } = useMemo(() => {
    if (!traceData) return { totalDuration: 0, flatNodes: [] };

    let totalDur = 0;
    const eventsArray = Array.isArray(traceData) ? traceData : (traceData.traceEvents || []);
    const xEvents = eventsArray.filter((e: any) => e.ph === 'X');
    
    for (const ev of xEvents) {
      if (ev.dur) totalDur += ev.dur;
    }

    const flatList: ProfilerNodeData[] = [];

    for (const ev of xEvents) {
      if (!ev.dur) continue;
      
      const match = ev.name.match(/\[(.*?)\]/);
      const pluginName = match ? match[1] : 'Unknown';
      
      let cleanName = ev.name.replace(/\[.*?\]/, '').trim();
      
      // Parse (min=...,avg=...,max=...,count=...)
      let minStr = "-", avgStr = "-", maxStr = "-", countStr = "-";
      const statsMatch = cleanName.match(/(.*?)\s+\((.*?)\)/);
      if (statsMatch) {
        cleanName = statsMatch[1].trim();
        const statsRaw = statsMatch[2]; // e.g. "min=0.00μs,avg=0.60ms,max=2.38ms,count=4"
        const parts = statsRaw.split(',');
        parts.forEach(p => {
          const [k, v] = p.split('=');
          if (k === 'min') minStr = v;
          if (k === 'avg') avgStr = v;
          if (k === 'max') maxStr = v;
          if (k === 'count') countStr = v;
        });
      }

      const node: ProfilerNodeData = {
        id: `${pluginName}-${cleanName}-${ev.dur}-${Math.random()}`,
        name: cleanName,
        duration: ev.dur,
        percentage: (ev.dur / totalDur) * 100,
        pluginName: pluginName,
        color: getPluginColor(pluginName),
        rawString: ev.name,
        minStr,
        avgStr,
        maxStr,
        countStr,
        children: []
      };

      flatList.push(node);
    }

    // Sort flat list by duration descending (Left Heavy style)
    flatList.sort((a, b) => b.duration - a.duration);

    let filtered = flatList;
    if (search.trim() !== '') {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(node => 
        node.name.toLowerCase().includes(lowerSearch) || 
        node.pluginName.toLowerCase().includes(lowerSearch)
      );
    }

    return { totalDuration: totalDur, flatNodes: filtered };
  }, [search, traceData]);

  // View: Recording
  if (isRecording || isProfiling) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-300 antialiased p-6">
        <div className="flex flex-col items-center justify-center border border-emerald-500/20 bg-emerald-500/5 rounded-lg py-20 w-full max-w-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 animate-pulse" />
          <div className="mb-4 p-3 rounded-full bg-emerald-500/20 animate-pulse">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-[15px] font-medium text-emerald-400 mb-1">
            {isProfiling ? "Saving profile dump..." : "Profiling in Progress..."}
          </p>
          <p className="text-[13px] text-zinc-400 mb-6 text-center max-w-md">
            {isProfiling ? "Waiting for game engine to flush data to disk." : "The game server is currently recording performance metrics."}
          </p>
          {isRecording && (
            <button 
              onClick={handleStopProfiler}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-md px-4 py-2 text-[13px] font-medium text-red-400 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Stop & Save
            </button>
          )}
        </div>
      </div>
    );
  }
  // Custom SVG icon requested by user
  const CustomFileIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
      <path fill="currentColor" d="M3 10c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172S21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828S16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172S3 17.771 3 14z" opacity=".5"/>
      <path fill="currentColor" d="M16.519 16.501c.175-.136.334-.295.651-.612l3.957-3.958c.096-.095.052-.26-.075-.305a4.3 4.3 0 0 1-1.644-1.034a4.3 4.3 0 0 1-1.034-1.644c-.045-.127-.21-.171-.305-.075L14.11 12.83c-.317.317-.476.476-.612.651q-.243.311-.412.666c-.095.2-.166.414-.308.84l-.184.55l-.292.875l-.273.82a.584.584 0 0 0 .738.738l.82-.273l.875-.292l.55-.184c.426-.142.64-.212.84-.308q.355-.17.666-.412Zm5.849-5.809a2.163 2.163 0 1 0-3.06-3.059l-.126.128a.52.52 0 0 0-.148.465c.02.107.055.265.12.452c.13.375.376.867.839 1.33s.955.709 1.33.839c.188.065.345.1.452.12a.53.53 0 0 0 .465-.148z"/>
      <path fill="currentColor" fillRule="evenodd" d="M7.25 9A.75.75 0 0 1 8 8.25h6.5a.75.75 0 0 1 0 1.5H8A.75.75 0 0 1 7.25 9m0 4a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75m0 4a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75" clipRule="evenodd"/>
    </svg>
  );

  // View: File List
  if (!selectedFile) {
    return (
      <div className="h-full w-full flex flex-col bg-[#09090b] text-zinc-300 antialiased">
        <div className="shrink-0 px-8 py-6 border-b border-zinc-800/60 flex justify-between items-center bg-[#09090b]">
          <h2 className="text-[16px] font-semibold text-zinc-100 flex items-center gap-2">
            Performance Profiler
          </h2>
          <button
            onClick={handleStartProfiler}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors bg-[#e4e4e7] text-[#18181b] hover:bg-[#d4d4d8] shadow-sm cursor-pointer"
          >
            <Play size={14} />
            New Snapshot
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
          {errorMsg && (
            <div className="w-full max-w-5xl mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {profilerFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800/80 rounded-xl py-32 w-full max-w-5xl">
              <div className="mb-4 text-zinc-600">
                <CustomFileIcon className="w-12 h-12" />
              </div>
              <p className="text-[14px] text-zinc-300 font-medium mb-1">No Profiler Data</p>
              <p className="text-[13px] text-zinc-500">Start a new profiling session to begin.</p>
            </div>
          ) : (
            <div className="w-full max-w-5xl flex flex-col gap-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[14px] font-medium text-zinc-300">Saved Profiles</h3>
                <span className="text-[13px] text-zinc-500">{profilerFiles.length} file(s)</span>
              </div>
              
              <div className="flex flex-col border border-zinc-800/60 rounded-xl overflow-hidden bg-[#09090b] shadow-sm">
                {/* Table Header */}
                <div className="flex items-center px-6 h-12 border-b border-zinc-800/60 bg-[#09090b]">
                  <div className="flex-1 text-[13px] font-medium text-zinc-400">File Name</div>
                  <div className="w-32 text-[13px] font-medium text-zinc-400 text-right">Size</div>
                  <div className="w-48 text-[13px] font-medium text-zinc-400 text-right">Created</div>
                </div>

                {/* Table Rows */}
                {profilerFiles.map((f, index) => {
                  const date = new Date(f.createdAt);
                  const today = new Date();
                  const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                  
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString()} ${timeStr}`;

                  return (
                    <button 
                      key={f.filename}
                      onClick={() => handleSelectFile(f)}
                      className={cn(
                        "flex items-center px-6 py-4 hover:bg-zinc-800/30 transition-all group text-left cursor-pointer",
                        index !== profilerFiles.length - 1 && "border-b border-zinc-800/40"
                      )}
                    >
                      <div className="flex-1 flex items-center gap-4">
                        <CustomFileIcon className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                        <span className="text-[14px] font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                          {f.filename}
                        </span>
                      </div>

                      <div className="w-32 text-[13px] text-zinc-400 text-right font-mono">
                        {(f.size / 1024).toFixed(1)} KB
                      </div>
                        
                      <div className="w-48 text-right flex justify-end items-center gap-4">
                        {isToday ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e4e4e7] text-[#18181b] text-[12px] font-semibold tracking-tight shadow-sm transition-colors cursor-pointer group-hover:bg-[#d4d4d8]">
                            {dateStr}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#27272a] text-zinc-200 text-[12px] font-medium tracking-tight shadow-sm border border-zinc-700/50 transition-colors cursor-pointer group-hover:bg-zinc-700/80">
                            {dateStr}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View: Trace Visualization
  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#09090b] text-zinc-300 antialiased">
      <div className="shrink-0 px-6 py-4 border-b border-zinc-800/60 bg-[#09090b]/90 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBackToList}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-zinc-400" />
              {selectedFile.filename}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportJson}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors border border-zinc-800/50"
            >
              <Download size={12} />
              Export JSON
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search traces..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 border-l border-zinc-800 pl-3 ml-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-300">{(totalDuration / 1000).toFixed(2)}ms Total</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingTrace ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Activity className="w-8 h-8 mb-4 animate-pulse text-emerald-500/50" />
              <p className="text-sm">Loading trace data...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
              <p>{errorMsg}</p>
            </div>
          ) : flatNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Terminal size={32} className="mb-3 opacity-50" />
              <p className="text-sm">No traces found</p>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-[2px] pb-32">
              {/* Timeline Header */}
              <div className="flex text-[10px] text-zinc-600 mb-2 border-b border-zinc-800/50 pb-2 relative h-4">
                <span className="absolute left-0">0ms</span>
                <span className="absolute left-1/4 -translate-x-1/2">{((totalDuration/1000) * 0.25).toFixed(1)}ms</span>
                <span className="absolute left-1/2 -translate-x-1/2">{((totalDuration/1000) * 0.5).toFixed(1)}ms</span>
                <span className="absolute left-3/4 -translate-x-1/2">{((totalDuration/1000) * 0.75).toFixed(1)}ms</span>
                <span className="absolute right-0">{(totalDuration/1000).toFixed(1)}ms</span>
              </div>

              {/* Waterfall Items */}
              {flatNodes.map((node) => {
                const maxDur = flatNodes[0].duration;
                const widthPct = Math.max((node.duration / maxDur) * 100, 0.5);
                const isSelected = selectedNode?.id === node.id;
                
                return (
                  <button 
                    key={node.id} 
                    onClick={() => setSelectedNode(node)}
                    className={cn(
                      "group relative w-full h-8 flex items-center bg-zinc-900/30 hover:bg-zinc-800/50 rounded-[4px] transition-all overflow-hidden text-left focus:outline-none",
                      isSelected && "ring-1 ring-emerald-500/50 bg-zinc-800/60"
                    )}
                  >
                    <div 
                      className={cn(
                        "absolute left-0 top-0 bottom-0 opacity-20 group-hover:opacity-30 transition-opacity",
                        isSelected && "opacity-40"
                      )}
                      style={{ width: `${widthPct}%`, backgroundColor: node.color }}
                    />
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: node.color }}
                    />
                    <div className="relative flex items-center justify-between w-full px-3 z-10 pointer-events-none">
                      <div className="flex items-center gap-3 min-w-0">
                        <span 
                          className="text-[11px] font-bold px-1.5 py-0.5 rounded text-zinc-900"
                          style={{ backgroundColor: node.color }}
                        >
                          {node.pluginName}
                        </span>
                        <span className="text-[12px] font-mono text-zinc-300 truncate">
                          {node.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0 px-2 py-0.5 rounded">
                        <span className="text-[11px] font-medium text-zinc-400">
                          {node.percentage.toFixed(1)}%
                        </span>
                        <span className="text-[11px] font-mono text-zinc-300">
                          {(node.duration / 1000).toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Speedscope-style Bottom Details Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 h-40 bg-[#09090b] border-t border-zinc-800/80 shadow-2xl flex flex-col z-20"
            >
              {/* Resizer Handle area (visual only for now) */}
              <div className="w-full h-1 bg-zinc-800/50 hover:bg-emerald-500/30 cursor-ns-resize transition-colors" />
              
              <div className="flex items-stretch h-full w-full font-mono">
                {/* Stats Table */}
                <div className="w-1/3 flex flex-col border-r border-zinc-800/80 bg-zinc-900/20 text-[11px]">
                  <div className="flex bg-[#0369a1] text-white">
                    <div className="flex-1 py-1 px-2 border-r border-blue-900/50 font-semibold">This Instance</div>
                    <div className="flex-1 py-1 px-2 font-semibold">All Instances</div>
                  </div>
                  <div className="flex bg-[#0284c7] text-white/90 border-b border-zinc-800/80">
                    <div className="flex-1 flex border-r border-blue-900/50">
                      <div className="flex-1 py-1 px-2 border-r border-blue-900/50">Total</div>
                      <div className="flex-1 py-1 px-2">Self</div>
                    </div>
                    <div className="flex-1 flex">
                      <div className="flex-1 py-1 px-2 border-r border-blue-900/50">Total</div>
                      <div className="flex-1 py-1 px-2">Self</div>
                    </div>
                  </div>
                  
                  {/* Time Row */}
                  <div className="flex bg-[#0ea5e9]/10 text-[#38bdf8] border-b border-zinc-800/80">
                    <div className="flex-1 flex border-r border-zinc-800/80">
                      <div className="flex-1 py-2 px-2 border-r border-zinc-800/80">{(selectedNode.duration / 1000).toFixed(2)}ms</div>
                      <div className="flex-1 py-2 px-2">{(selectedNode.duration / 1000).toFixed(2)}ms</div>
                    </div>
                    <div className="flex-1 flex">
                      <div className="flex-1 py-2 px-2 border-r border-zinc-800/80">{(selectedNode.duration / 1000).toFixed(2)}ms</div>
                      <div className="flex-1 py-2 px-2">{(selectedNode.duration / 1000).toFixed(2)}ms</div>
                    </div>
                  </div>

                  {/* Percentage Row */}
                  <div className="flex bg-[#0ea5e9]/10 text-[#38bdf8] border-b border-zinc-800/80">
                    <div className="flex-1 flex border-r border-zinc-800/80">
                      <div className="flex-1 py-2 px-2 border-r border-zinc-800/80">{selectedNode.percentage.toFixed(1)}%</div>
                      <div className="flex-1 py-2 px-2">{selectedNode.percentage.toFixed(1)}%</div>
                    </div>
                    <div className="flex-1 flex">
                      <div className="flex-1 py-2 px-2 border-r border-zinc-800/80">{selectedNode.percentage.toFixed(1)}%</div>
                      <div className="flex-1 py-2 px-2">{selectedNode.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>

                {/* Details / Mock Stack Trace */}
                <div className="flex-1 p-3 overflow-y-auto text-[11px] leading-relaxed text-zinc-400 bg-[#09090b]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2" style={{ backgroundColor: selectedNode.color }} />
                    <span className="text-zinc-200">{selectedNode.rawString}</span>
                  </div>
                  
                  <div className="pl-4 border-l-2 border-zinc-800 ml-1 space-y-1 mt-2">
                    <div className="text-zinc-500 flex items-center gap-2">
                      <Info className="w-3 h-3" />
                      SwiftlyS2 outputs aggregated profile data, not raw chronological timestamps.
                    </div>
                    <div className="text-emerald-500/80">
                      ▶ <strong>Count:</strong> {selectedNode.countStr} executions
                    </div>
                    <div className="text-zinc-400">
                      ▶ <strong>Average:</strong> {selectedNode.avgStr}
                    </div>
                    <div className="text-zinc-400">
                      ▶ <strong>Min:</strong> {selectedNode.minStr}
                    </div>
                    <div className="text-zinc-400">
                      ▶ <strong>Max:</strong> {selectedNode.maxStr}
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
