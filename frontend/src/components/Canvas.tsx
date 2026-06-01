import { Layout, Workflow, AlignLeft, Link, Eye, Columns } from 'lucide-react';
import { motion, useMotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Node1 } from './Node1';
import { Node2 } from './Node2';
import { Node3 } from './Node3';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Use Math.exp for perfectly smooth, symmetrical zooming
      // Trackpad pinch-to-zoom sets e.ctrlKey = true
      const zoomSensitivity = e.ctrlKey ? 0.01 : 0.002;
      const currentScale = scale.get();
      let newScale = currentScale * Math.exp(-e.deltaY * zoomSensitivity);
      
      // Clamp scale between 10% and 400%
      newScale = Math.min(Math.max(newScale, 0.1), 4);

      const rect = container.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;

      const currentX = x.get();
      const currentY = y.get();

      // Calculate new translation to keep the cursor over the same point
      const ratio = newScale / currentScale;
      const newX = pointerX - (pointerX - currentX) * ratio;
      const newY = pointerY - (pointerY - currentY) * ratio;

      scale.set(newScale);
      x.set(newX);
      y.set(newY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scale, x, y]);

  return (
    <div ref={containerRef} className="relative flex-1 bg-[#0E0E0E] overflow-hidden">
      {/* Floating Toolbar */}
      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/10 bg-[#141414]/80 p-1 backdrop-blur-md z-10 shadow-xl">
        <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
          <Layout className="h-3.5 w-3.5" />
          Layout
        </button>
        <button className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm border border-white/5">
          <Workflow className="h-3.5 w-3.5" />
          Workflow
        </button>
        <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
          <AlignLeft className="h-3.5 w-3.5" />
          Tree view
        </button>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
          <Link className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
          <Columns className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Draggable Canvas Area */}
      <motion.div 
        className="absolute inset-0 cursor-grab active:cursor-grabbing origin-top-left"
        drag
        dragMomentum={false}
        dragElastic={0}
        style={{ x, y, scale }}
      >
        {/* Infinite-feeling dot pattern */}
        <div 
          className="absolute left-[-5000px] top-[-5000px] right-[-5000px] bottom-[-5000px]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', 
            backgroundSize: '24px 24px',
            backgroundPosition: 'center'
          }} 
        />

        <svg className="absolute top-0 left-0 h-[4000px] w-[4000px] pointer-events-none z-0">
          {/* Connection from Node1 to Node2 */}
          <path 
            d="M 720 166 C 740 166, 740 166, 760 166" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="2" 
            fill="none" 
          />
          {/* Connection from Node2 to Node3 */}
          <path 
            d="M 1160 166 C 1180 166, 1180 166, 1200 166" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="2" 
            fill="none" 
          />
        </svg>

        {/* Nodes are positioned relative to the draggable container. */}
        <div className="absolute left-[400px] top-[100px]">
          <Node1 />
        </div>
        <div className="absolute left-[760px] top-[100px]">
          <Node2 />
        </div>
        <div className="absolute left-[1200px] top-[100px]">
          <Node3 />
        </div>
      </motion.div>
    </div>
  );
}
