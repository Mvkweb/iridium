import { motion, AnimatePresence } from 'motion/react';
import { useMemo, useState, useEffect } from 'react';
import {
  Activity, Clock, Download, Search, X, Pause, Play,
  Terminal, ArrowLeft, Info, Circle
} from 'lucide-react';
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

function getPluginColor(pluginName: string) {
  let hash = 0;
  for (let i = 0; i < pluginName.length; i++) {
    hash = pluginName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 62%)`;
}

const CS2Icon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M21.71 3.235a.02.02 0 0 1-.022-.022c.002-.081.004-.37.005-.424c0-.129-.143-.183-.212-.083l-.229.333a.02.02 0 0 1-.02.01h-6.55a.047.047 0 0 1-.048-.046l-.013-.177a.048.048 0 0 1 .056-.048l.335.032a.06.06 0 0 0 .063-.045l.244-.989a.05.05 0 0 0-.03-.054l-.227-.085a.04.04 0 0 1-.026-.03c-.041-.171-.377-1.323-1.993-1.58c-.787-.125-1.302.21-1.577.478a1.6 1.6 0 0 0-.302.41l-.097.212a2 2 0 0 0-.046.234l.051.982a.11.11 0 0 0 .043.085l.354.153l-.196.325a.055.055 0 0 1-.053.04s-.417.01-.622.02c-.386.015-1.245.485-1.878 1.838l-.724 1.55a.07.07 0 0 1-.068.04l-.578.001c-.035 0-.073.028-.088.06L6.364 9a.11.11 0 0 0 .017.108l.627.392a.06.06 0 0 1 .02.058l-.328.967a.2.2 0 0 1-.023.062l-.435.382a.1.1 0 0 0-.035.06l-.598 1.53a.06.06 0 0 1-.06.045l-.336.002a.163.163 0 0 0-.162.149l-.201 2.288l-.016.121l-.158.908a.13.13 0 0 1-.034.055l-.558.427a4.8 4.8 0 0 0-.767 1.001l-1.86 3.924a.8.8 0 0 0-.078.322l.132.235c.002.084-.032.456-.07.53l-.624 1.09a.1.1 0 0 0-.003.085l.03.07l.094.187L2.829 24c.118.011.247-.14.251-.3l.103-1.297l-.027-.195l3.606-4.232c.095-.114.222-.317.286-.45l1.719-3.79a.17.17 0 0 1 .1-.088l.109-.035a.17.17 0 0 1 .183.053c.15.181.504.781.676 1.032c.143.208.85 1.23 1.158 1.567c.086.093.349.198.466.27a.083.083 0 0 1 .03.112l-1.03 1.808l-.455 2.136a1 1 0 0 0-.036.152l-.412 1.483c.003.188-.14.286-.153.507l-.15 1.084a.06.06 0 0 0 .059.061l2.544.014q.142-.001.286-.006l.075-.007c.124-.016.563-.076.75-.15a.6.6 0 0 0 .227-.13c.185-.194.2-.278.203-.398a.3.3 0 0 0-.028-.105a.12.12 0 0 0-.06-.047l-1.18-.356a.37.37 0 0 1-.19-.134l-.317-.47a.09.09 0 0 1 .018-.097l.618-.609a.2.2 0 0 0 .048-.072l1.904-4.488c.089-.285.059-.605 0-.944c-.044-.25-.686-1.326-.854-1.624l-1.286-2.251c-.079-.138-.19-.133-.228-.276l-.073-1.118a.04.04 0 0 1 .036-.05l.33-.028a.1.1 0 0 0 .075-.048l1.147-2.155a.1.1 0 0 0-.002-.094l-.235-.29a.09.09 0 0 1-.001-.088l.352-.38a.054.054 0 0 1 .073-.02l.934.526a.4.4 0 0 0 .186.05c.26-.001.686-.154.908-.29a.4.4 0 0 0 .139-.148l.458-1.07c.006-.014.027-.012.03.003l.127.595a.064.064 0 0 0 .079.05l1.35-.3a.066.066 0 0 0 .05-.078l-.319-1.344a.07.07 0 0 1 .01-.054l.13-.203a.3.3 0 0 0 .037-.082l.159-.725a.04.04 0 0 1 .04-.032l3.732.005a.09.09 0 0 0 .093-.093v-.634a.02.02 0 0 1 .022-.021h1.439a.047.047 0 0 0 .046-.047V3.28a.047.047 0 0 0-.046-.047h-1.44z" />
  </svg>
);

const CustomFileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M3 10c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172S21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828S16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172S3 17.771 3 14z" opacity=".5" />
    <path fill="currentColor" d="M16.519 16.501c.175-.136.334-.295.651-.612l3.957-3.958c.096-.095.052-.26-.075-.305a4.3 4.3 0 0 1-1.644-1.034a4.3 4.3 0 0 1-1.034-1.644c-.045-.127-.21-.171-.305-.075L14.11 12.83c-.317.317-.476.476-.612.651q-.243.311-.412.666c-.095.2-.166.414-.308.84l-.184.55l-.292.875l-.273.82a.584.584 0 0 0 .738.738l.82-.273l.875-.292l.55-.184c.426-.142.64-.212.84-.308q.355-.17.666-.412Zm5.849-5.809a2.163 2.163 0 1 0-3.06-3.059l-.126.128a.52.52 0 0 0-.148.465c.02.107.055.265.12.452c.13.375.376.867.839 1.33s.955.709 1.33.839c.188.065.345.1.452.12a.53.53 0 0 0 .465-.148z" />
    <path fill="currentColor" fillRule="evenodd" d="M7.25 9A.75.75 0 0 1 8 8.25h6.5a.75.75 0 0 1 0 1.5H8A.75.75 0 0 1 7.25 9m0 4a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75m0 4a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75" clipRule="evenodd" />
  </svg>
);

// ── Shared primitives ────────────────────────────────────────────────────────

const Dot = ({ className }: { className?: string }) => (
  <span className={cn('inline-block w-2 h-2 rounded-full', className)} />
);

function RecordingDot() {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
      <span className="relative rounded-full w-2 h-2 bg-red-500" />
    </span>
  );
}

// ── Toolbar shared across views ───────────────────────────────────────────────

function Toolbar({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="shrink-0 h-12 px-5 flex items-center justify-between border-b border-zinc-800/70 bg-zinc-950">
      <div className="flex items-center gap-3">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

// ── Pill badge ────────────────────────────────────────────────────────────────

function Pill({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'white' | 'ghost';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none select-none',
        variant === 'default' && 'bg-zinc-900 border border-zinc-800 text-zinc-400',
        variant === 'white' && 'bg-zinc-100 text-zinc-900',
        variant === 'ghost' && 'text-zinc-500',
      )}
    >
      {children}
    </span>
  );
}

// ── Plugin chip ───────────────────────────────────────────────────────────────

function PluginChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide whitespace-nowrap"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      {name}
    </span>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/80 text-[11px] text-zinc-500">
      {icon}
      <span className="text-zinc-400 font-medium">{label}</span>
    </span>
  );
}

// ── Server badge ──────────────────────────────────────────────────────────────

function ServerBadge() {
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/80 text-[11px] text-zinc-400 font-medium">
      <CS2Icon className="w-3 h-3 text-zinc-500" />
      CS2
      <span className="flex items-center gap-1 text-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    </span>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function HDivider() {
  return <div className="h-px bg-zinc-800/70 w-full" />;
}

function VDivider() {
  return <div className="w-px bg-zinc-800/70 self-stretch" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export function Profiler() {
  const [search, setSearch] = useState('');
  const [isProfiling, setIsProfiling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [profilerFiles, setProfilerFiles] = useState<ProfilerFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProfilerFile | null>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const [isLoadingTrace, setIsLoadingTrace] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ProfilerNodeData | null>(null);

  useEffect(() => {
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
      setErrorMsg(err.message || 'Unknown error');
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
    setIsProfiling(true);
    iridiumClient.send('profiler_save');
    setTimeout(() => iridiumClient.send('profiler_list'), 3000);
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

  const { totalDuration, flatNodes } = useMemo(() => {
    if (!traceData) return { totalDuration: 0, flatNodes: [] };

    const eventsArray = Array.isArray(traceData) ? traceData : (traceData.traceEvents || []);
    const xEvents = eventsArray.filter((e: any) => e.ph === 'X');
    let totalDur = xEvents.reduce((s: number, e: any) => s + (e.dur || 0), 0);

    const flatList: ProfilerNodeData[] = [];

    for (const ev of xEvents) {
      if (!ev.dur) continue;
      const match = ev.name.match(/\[(.*?)\]/);
      const pluginName = match ? match[1] : 'Unknown';
      let cleanName = ev.name.replace(/\[.*?\]/, '').trim();

      let minStr = '–', avgStr = '–', maxStr = '–', countStr = '–';
      const statsMatch = cleanName.match(/(.*?)\s+\((.*?)\)/);
      if (statsMatch) {
        cleanName = statsMatch[1].trim();
        statsMatch[2].split(',').forEach((p: string) => {
          const [k, v] = p.split('=');
          if (k === 'min') minStr = v;
          if (k === 'avg') avgStr = v;
          if (k === 'max') maxStr = v;
          if (k === 'count') countStr = v;
        });
      }

      flatList.push({
        id: `${pluginName}-${cleanName}-${ev.dur}-${Math.random()}`,
        name: cleanName,
        duration: ev.dur,
        percentage: (ev.dur / totalDur) * 100,
        pluginName,
        color: getPluginColor(pluginName),
        rawString: ev.name,
        minStr, avgStr, maxStr, countStr,
        children: [],
      });
    }

    flatList.sort((a, b) => b.duration - a.duration);

    const q = search.trim().toLowerCase();
    const filtered = q
      ? flatList.filter(n => n.name.toLowerCase().includes(q) || n.pluginName.toLowerCase().includes(q))
      : flatList;

    return { totalDuration: totalDur, flatNodes: filtered };
  }, [search, traceData]);

  // ── Recording / Saving ──────────────────────────────────────────────────────
  if (isRecording || isProfiling) {
    return (
      <div className="h-full w-full flex flex-col bg-zinc-950 text-zinc-300 antialiased">
        <Toolbar
          left={
            <>
              <span className="text-[13px] font-semibold text-zinc-100">Profiler</span>
              <VDivider />
              <ServerBadge />
            </>
          }
          right={
            isProfiling ? (
              <Pill>
                <Dot className="bg-amber-400 animate-pulse" />
                Saving…
              </Pill>
            ) : (
              <Pill>
                <RecordingDot />
                <span className="text-red-400">Recording</span>
              </Pill>
            )
          }
        />

        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 text-center max-w-sm">
            {/* icon ring */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                <Activity className="w-6 h-6 text-zinc-400" />
              </div>
              {isRecording && (
                <span className="absolute -top-1 -right-1">
                  <RecordingDot />
                </span>
              )}
            </div>

            <div>
              <p className="text-[15px] font-semibold text-zinc-100 mb-2">
                {isProfiling ? 'Saving snapshot…' : 'Recording in progress'}
              </p>
              <p className="text-[13px] text-zinc-500 leading-relaxed">
                {isProfiling
                  ? 'Waiting for the server to flush profiler data to disk.'
                  : 'The CS2 server is capturing performance data across all plugins.'}
              </p>
            </div>

            {isRecording && (
              <button
                onClick={handleStopProfiler}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-[12px] font-medium text-zinc-300 transition-all"
              >
                <Pause className="w-3 h-3 fill-current text-zinc-400" />
                Stop & save
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── File list ───────────────────────────────────────────────────────────────
  if (!selectedFile) {
    return (
      <div className="h-full w-full flex flex-col bg-zinc-950 text-zinc-300 antialiased">
        <Toolbar
          left={
            <>
              <span className="text-[13px] font-semibold text-zinc-100">Profiler</span>
              <VDivider />
              <ServerBadge />
            </>
          }
          right={
            <button
              onClick={handleStartProfiler}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-[12px] font-semibold transition-colors"
            >
              <Play size={10} className="fill-current" />
              New snapshot
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-5 mt-4 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-[12px] text-red-400 flex items-center gap-2"
              >
                <Circle size={8} className="fill-red-500 text-red-500 shrink-0" />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {profilerFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100%-1px)] gap-3 text-center py-32">
              <div className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                <CustomFileIcon className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-zinc-300">No snapshots yet</p>
                <p className="text-[12px] text-zinc-600 mt-0.5">Start a session to capture performance data.</p>
              </div>
            </div>
          ) : (
            <div className="p-5">
              {/* subtle section label */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium">Snapshots</span>
                <span className="text-[11px] text-zinc-700">{profilerFiles.length}</span>
              </div>

              <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
                {/* header row */}
                <div className="grid grid-cols-[1fr_80px_160px_20px] px-4 h-9 items-center bg-zinc-900/60 border-b border-zinc-800/80">
                  {['Filename', 'Size', 'Created', ''].map((h) => (
                    <span key={h} className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider last:col-span-1">
                      {h}
                    </span>
                  ))}
                </div>

                {profilerFiles.map((f, i) => {
                  const date = new Date(f.createdAt);
                  const today = new Date();
                  const isToday =
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateLabel = isToday
                    ? `Today ${timeStr}`
                    : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;

                  return (
                    <button
                      key={f.filename}
                      onClick={() => handleSelectFile(f)}
                      className={cn(
                        'w-full grid grid-cols-[1fr_80px_160px_20px] px-4 py-3 items-center text-left group transition-colors hover:bg-zinc-900/50',
                        i !== profilerFiles.length - 1 && 'border-b border-zinc-800/60',
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CustomFileIcon className="w-4 h-4 text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors" />
                        <span className="text-[13px] font-medium text-zinc-300 group-hover:text-zinc-100 truncate transition-colors">
                          {f.filename}
                        </span>
                      </div>

                      <span className="text-[12px] font-mono text-zinc-600">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>

                      <div>
                        {isToday ? (
                          <Pill variant="white">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {dateLabel}
                          </Pill>
                        ) : (
                          <Pill>{dateLabel}</Pill>
                        )}
                      </div>

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-zinc-700 group-hover:text-zinc-500 transition-all opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
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

  // ── Trace view ──────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-zinc-950 text-zinc-300 antialiased">
      {/* Top toolbar */}
      <Toolbar
        left={
          <>
            <button
              onClick={handleBackToList}
              className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors -ml-1"
            >
              <ArrowLeft size={14} />
            </button>
            <VDivider />
            <CustomFileIcon className="w-4 h-4 text-zinc-600" />
            <span className="text-[13px] font-semibold text-zinc-100">{selectedFile.filename}</span>
            <VDivider />
            <ServerBadge />
          </>
        }
        right={
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-[12px] font-medium text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <Download size={11} />
            Export
          </button>
        }
      />

      {/* Search + stats bar */}
      <div className="shrink-0 flex items-center gap-3 px-5 h-11 border-b border-zinc-800/70 bg-zinc-950">
        <div className="relative w-64">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter traces…"
            className="w-full pl-7 pr-7 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-[12px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <StatChip
            icon={<Clock className="w-3 h-3" />}
            label={`${(totalDuration / 1000).toFixed(2)} ms total`}
          />
          <StatChip
            icon={<Activity className="w-3 h-3" />}
            label={`${flatNodes.length} traces`}
          />
        </div>
      </div>

      {/* Main scroll area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto">
          {isLoadingTrace ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
              <Activity className="w-5 h-5 animate-pulse" />
              <p className="text-[12px]">Loading trace…</p>
            </div>
          ) : errorMsg ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[12px] text-red-400">{errorMsg}</p>
            </div>
          ) : flatNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
              <Terminal size={20} className="opacity-40" />
              <p className="text-[12px]">No traces found</p>
            </div>
          ) : (
            <div className={cn('pb-2', selectedNode && 'pb-56')}>
              {/* Column header */}
              <div className="sticky top-0 z-10 grid grid-cols-[280px_1fr_60px_96px] items-center px-5 h-8 bg-zinc-950 border-b border-zinc-800/70">
                <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Trace</span>
                <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-3">Relative weight</span>
                <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider text-right">Share</span>
                <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider text-right pr-5">Duration</span>
              </div>

              {flatNodes.map((node, idx) => {
                const maxDur = flatNodes[0].duration;
                const widthPct = Math.max((node.duration / maxDur) * 100, 0.5);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    className={cn(
                      'w-full grid grid-cols-[280px_1fr_60px_96px] items-center px-5 py-2.5 text-left transition-colors focus:outline-none group',
                      idx !== flatNodes.length - 1 && 'border-b border-zinc-800/40',
                      isSelected ? 'bg-zinc-900/70' : 'hover:bg-zinc-900/40',
                    )}
                  >
                    {/* Plugin + name */}
                    <div className="flex items-center gap-2 min-w-0 pr-3">
                      <PluginChip name={node.pluginName} color={node.color} />
                      <span className="text-[12px] font-mono text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">
                        {node.name}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="px-3">
                      <div className="relative h-4 rounded overflow-hidden">
                        {/* track */}
                        <div
                          className="absolute inset-0 rounded opacity-[0.06]"
                          style={{ backgroundColor: node.color }}
                        />
                        {/* fill */}
                        <div
                          className="absolute inset-y-0 left-0 rounded transition-all"
                          style={{
                            width: `${widthPct}%`,
                            background: `linear-gradient(90deg, color-mix(in srgb, ${node.color} 40%, transparent), color-mix(in srgb, ${node.color} 20%, transparent))`,
                          }}
                        />
                        {/* left cap */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l"
                          style={{ backgroundColor: node.color, opacity: isSelected ? 1 : 0.7 }}
                        />
                      </div>
                    </div>

                    {/* Share */}
                    <span className="text-[11px] font-mono text-zinc-500 text-right">
                      {node.percentage.toFixed(1)}%
                    </span>

                    {/* Duration */}
                    <span className="text-[12px] font-mono text-zinc-300 text-right pr-5 group-hover:text-zinc-100 transition-colors">
                      {(node.duration / 1000).toFixed(2)}ms
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 z-20 bg-zinc-950 border-t border-zinc-800/80"
              style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.5)' }}
            >
              {/* handle */}
              <div className="flex justify-center py-2 cursor-ns-resize">
                <div className="w-6 h-0.5 rounded-full bg-zinc-800" />
              </div>

              {/* panel header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PluginChip name={selectedNode.pluginName} color={selectedNode.color} />
                  <span className="text-[12px] font-mono text-zinc-200 truncate">{selectedNode.name}</span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="ml-4 p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              </div>

              <HDivider />

              {/* 4-stat grid */}
              <div className="grid grid-cols-4">
                {[
                  { label: 'Duration', value: `${(selectedNode.duration / 1000).toFixed(3)}ms` },
                  { label: 'Share', value: `${selectedNode.percentage.toFixed(2)}%` },
                  { label: 'Avg', value: selectedNode.avgStr ?? '–' },
                  { label: 'Executions', value: selectedNode.countStr ?? '–' },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={cn(
                      'flex flex-col px-5 py-4',
                      i !== 3 && 'border-r border-zinc-800/70',
                    )}
                  >
                    <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-1.5">{label}</span>
                    <span className="text-[14px] font-mono font-semibold text-zinc-100">{value}</span>
                  </div>
                ))}
              </div>

              <HDivider />

              {/* log-style detail */}
              <div className="px-5 py-3 space-y-1.5 font-mono text-[11px]">
                <div className="flex gap-3">
                  <span className="text-zinc-700 shrink-0 select-none">min</span>
                  <span className="text-zinc-400">{selectedNode.minStr}</span>
                  <span className="text-zinc-700 shrink-0 select-none ml-3">max</span>
                  <span className="text-zinc-400">{selectedNode.maxStr}</span>
                  <span className="text-zinc-700 shrink-0 select-none ml-3">avg</span>
                  <span className="text-zinc-400">{selectedNode.avgStr}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 pt-0.5">
                  <Info size={9} className="shrink-0" />
                  <span>SwiftlyS2 emits aggregated profile data, not raw timestamps.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
