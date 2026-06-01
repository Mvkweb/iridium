import { Database, Settings2, Copy, Github, Sparkles } from 'lucide-react';

export function Node2() {
  return (
    <div className="w-[400px] shrink-0 rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 bg-[#0A0A0A] rounded-t-xl">
        <div className="h-3 w-3 rounded-sm bg-[#F97316]" />
        <span className="text-xs font-medium text-zinc-200">Processing</span>
      </div>
      
      {/* Subheader */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 bg-[#141414]">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">getDataFromGithub</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors"><Sparkles className="h-3.5 w-3.5" /></button>
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors"><Copy className="h-3.5 w-3.5" /></button>
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors"><Settings2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 bg-[#0A0A0A] rounded-b-xl">
        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-zinc-300" />
            <span className="text-sm font-medium text-zinc-200">Marsipulami Hero</span>
          </div>
          <button className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider">Logout</button>
        </div>

        {/* Code Editor */}
        <div className="rounded-md border border-white/5 bg-[#141414] p-3 font-mono text-xs leading-relaxed overflow-hidden shadow-inner">
          <div className="flex">
            <div className="flex flex-col pr-4 text-right text-zinc-600 select-none border-r border-white/5 mr-4">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10</span>
              <span>11</span>
              <span>12</span>
              <span>13</span>
              <span>14</span>
            </div>
            <div className="flex flex-col text-zinc-300 whitespace-pre">
              <span className="text-zinc-500"># GitHub docs here:</span>
              <span className="text-zinc-500">https://docs.github.com/en/graphql</span>
              <span></span>
              <span><span className="text-[#3B82F6]">query</span> <span className="text-[#A855F7]">GetRepositories</span><span className="text-zinc-300">(</span></span>
              <span>  <span className="text-[#A855F7]">$owner</span><span className="text-zinc-400">: </span><span className="text-[#22C55E]">String!</span></span>
              <span>  <span className="text-[#A855F7]">$name</span><span className="text-zinc-400">: </span><span className="text-[#22C55E]">String!</span></span>
              <span><span className="text-zinc-300">) {'{'}</span></span>
              <span>  <span className="text-[#3B82F6]">repository</span><span className="text-zinc-300">(</span></span>
              <span>    <span className="text-[#F97316]">owner</span><span className="text-zinc-400">: </span><span className="text-[#A855F7]">$owner</span></span>
              <span>    <span className="text-[#F97316]">name</span><span className="text-zinc-400">: </span><span className="text-[#A855F7]">$name</span></span>
              <span>  <span className="text-zinc-300">) {'{'}</span></span>
              <span>    <span className="text-[#3B82F6]">id</span></span>
              <span>    <span className="text-[#3B82F6]">name</span></span>
              <span>  <span className="text-zinc-300">{'}'}</span></span>
              <span><span className="text-zinc-300">{'}'}</span></span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-4 text-xs font-medium">
              <button className="text-zinc-200">Inputs</button>
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors">Data</button>
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors">JSON</button>
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors">Settings</button>
            </div>
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors"><Settings2 className="h-3.5 w-3.5" /></button>
          </div>

          {/* JSON Output preview */}
          <div className="flex flex-col gap-2.5 text-xs font-mono bg-[#141414] p-3 rounded-md border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 font-sans font-medium text-xs">startTrigger.data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">workflowContext</span>
              <span className="text-[#3B82F6] bg-blue-500/10 px-1 rounded">{'{ }'}</span>
              <span className="text-zinc-500 text-[10px]">7 keys</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">workflowId</span>
              <span className="text-[#3B82F6]">4b8932f4-f9e1-4023-8118</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">name</span>
              <span className="text-[#3B82F6]">Rico Oktananda - GitHub to Slack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
