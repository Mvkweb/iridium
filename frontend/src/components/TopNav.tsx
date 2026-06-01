import { Search, Play, MoreHorizontal, Command, Hexagon } from 'lucide-react';

export function TopNav() {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#0A0A0A] px-4 text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#3B82F6] text-white">
            <Hexagon className="h-3.5 w-3.5 fill-current" />
          </div>
          <span className="font-medium text-zinc-100">Iridium Dashboard</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2 text-zinc-400">
          <span>Page 1</span>
          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">Draft</span>
        </div>
      </div>

      <div className="flex w-[400px] items-center rounded-md border border-white/10 bg-[#141414] px-3 py-1.5 text-zinc-400 focus-within:border-white/20 focus-within:text-zinc-200 transition-colors">
        <Search className="mr-2 h-3.5 w-3.5" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full bg-transparent outline-none placeholder:text-zinc-600"
        />
        <div className="flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px]">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/5 transition-colors">
          <MoreHorizontal className="h-4 w-4 text-zinc-400" />
        </button>
        <button className="flex h-7 items-center gap-1.5 rounded-md border border-white/10 bg-[#141414] px-3 hover:bg-white/5 transition-colors">
          <Play className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-200">Run</span>
        </button>
      </div>
    </div>
  );
}
