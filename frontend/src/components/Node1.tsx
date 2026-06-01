import { Sparkles, Zap, Calendar, Settings2, Terminal } from 'lucide-react';

export function Node1() {
  return (
    <div className="w-[320px] shrink-0 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 bg-[#0A0A0A] rounded-t-xl">
        <Sparkles className="h-4 w-4 text-[#A855F7]" />
        <span className="text-xs font-medium text-zinc-200">with AI</span>
      </div>
      
      {/* Subheader */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 bg-[#141414]">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">startTrigger</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors"><Sparkles className="h-3.5 w-3.5" /></button>
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors"><Settings2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 bg-[#0A0A0A] rounded-b-xl">
        {/* Grok Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-zinc-200">Ø Grok</span>
            </div>
            <div className="flex items-center gap-1.5 rounded border border-white/10 bg-[#141414] px-2 py-1 text-[10px] font-medium text-zinc-300 shadow-sm">
              <Terminal className="h-3 w-3" />
              Grok 3.0
            </div>
          </div>

          <div className="text-xs text-zinc-400 leading-relaxed">
            Make sure to create a really good code
          </div>
        </div>

        {/* Trigger Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Trigger</span>
          <div className="flex items-center gap-2 rounded-md border border-white/5 bg-[#141414] px-3 py-2.5 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-300">At 5 minutes past the hour</span>
          </div>
        </div>

        {/* Test Headers */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Test Headers</span>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Authorization</span>
              <span className="font-mono text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">Bearer ghp_xxx</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Content-Type</span>
              <span className="font-mono text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">application/json</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">User-Agent</span>
              <span className="font-mono text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">Webhook/1.0</span>
            </div>
          </div>
        </div>

        {/* Test path parameter */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Test path parameter</span>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">owner</span>
              <span className="font-mono text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">openai</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">repo</span>
              <span className="font-mono text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">openai-python</span>
            </div>
          </div>
        </div>

        {/* Test JSON parameter */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Test JSON parameter</span>
          <div className="rounded-md border border-white/5 bg-[#141414] p-3 font-mono text-xs leading-relaxed">
            <div className="text-zinc-500">{'{'}</div>
            <div className="pl-4">
              <span className="text-[#F97316]">"owner"</span><span className="text-zinc-400">: </span><span className="text-[#22C55E]">"openai"</span><span className="text-zinc-400">,</span>
            </div>
            <div className="pl-4">
              <span className="text-[#F97316]">"name"</span><span className="text-zinc-400">: </span><span className="text-[#22C55E]">"openai-python"</span>
            </div>
            <div className="text-zinc-500">{'}'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
