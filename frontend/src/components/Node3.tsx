import { CheckCircle2, Send, Settings2, Plus } from 'lucide-react';

export function Node3() {
  return (
    <div className="w-[320px] shrink-0 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 bg-[#0A0A0A] rounded-t-xl">
        <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
        <span className="text-xs font-medium text-zinc-200">Output</span>
      </div>
      
      {/* Subheader */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 bg-[#141414]">
        <div className="flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">sendSlack</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors"><Settings2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 bg-[#0A0A0A] rounded-b-xl">
        {/* Slack User */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 border border-blue-500/30">
            <div className="h-2.5 w-2.5 bg-[#3B82F6] rounded-sm" />
          </div>
          <span className="text-sm font-medium text-zinc-200">Rico Okt...</span>
        </div>

        {/* Operation */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Operation</span>
          <div className="flex items-center gap-2 bg-[#141414] border border-white/5 p-2 rounded-md">
            <span className="text-xs font-medium text-[#22C55E] bg-green-500/10 px-1.5 py-0.5 rounded">Post</span>
            <span className="text-xs text-zinc-300 font-mono">/chat.postMessage</span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-1">Sends a message to a channel.</span>
        </div>

        {/* Form data */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Form data</span>
          <div className="flex flex-col gap-3 text-xs bg-[#141414] border border-white/5 p-3 rounded-md">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-400">channel</span>
              <span className="text-zinc-500">...</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-400">text</span>
              <span className="text-zinc-500">...</span>
            </div>
            <button className="flex items-center gap-1 text-[#3B82F6] hover:text-blue-400 transition-colors mt-1 w-fit">
              <Plus className="h-3.5 w-3.5" />
              Add parameter
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 border-b border-white/5 pb-2 text-xs font-medium">
            <button className="text-zinc-200">Inputs</button>
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors">Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}
