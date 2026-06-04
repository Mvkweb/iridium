import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { iridiumClient } from '../lib/websocket';
import {
  Plus,
  LayoutTemplate,
  Component,
  Database,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Home,
  BarChart2,
  Fingerprint,
  DoorOpen,
  ShieldAlert,
  Users,
  MessageSquare,
  Star,
  Headphones,
  Award,
  Bell,
  SmilePlus,
  Command,
  Lightbulb,
  List,
  Music,
  Camera,
  Youtube,
  LogOut,
  Download,
  ChevronRight,
  Workflow,
} from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

export function Sidebar({ activeItem, setActiveItem }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, setForceRender] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setForceRender(prev => prev + 1);
    iridiumClient.on('profile_updated', handleUpdate);
    return () => iridiumClient.off('profile_updated', handleUpdate);
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 48 : 280 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full shrink-0 border-r border-white/10 bg-[#0A0A0A] overflow-hidden group text-zinc-300 font-sans selection:bg-white/10"
    >
      {/* Far left icon strip */}
      <div className="flex w-12 shrink-0 flex-col items-center border-r border-white/10 py-4 gap-4 bg-[#0A0A0A] z-20">
        <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5 text-zinc-400 transition-colors">
          <Plus className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5 text-zinc-400 transition-colors">
          <LayoutTemplate className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5 text-zinc-400 transition-colors">
          <Component className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5 text-zinc-400 transition-colors">
          <Database className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5 text-zinc-400 transition-colors">
          <Settings className="h-4 w-4" />
        </button>

        <div className="mt-auto">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5 text-zinc-400 transition-colors"
            title="Toggle Sidebar"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Inner sidebar */}
      <motion.div
        initial={false}
        animate={{ opacity: isCollapsed ? 0 : 1 }}
        transition={{
          duration: isCollapsed ? 0.15 : 0.3,
          delay: isCollapsed ? 0 : 0.1,
        }}
        className="flex w-[232px] shrink-0 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <SidebarSection title="Server" defaultOpen>
            <div className="px-2 pb-2 space-y-[2px]">
              <NavItem
                icon={<Home />}
                label="Overview"
                active={activeItem === 'Overview'}
                onClick={() => setActiveItem('Overview')}
              />
              <NavItem
                icon={<Workflow />}
                label="Workflow"
                active={activeItem === 'Workflow'}
                onClick={() => setActiveItem('Workflow')}
              />
              <NavItem
                icon={<Settings />}
                label="Settings"
                active={activeItem === 'Settings'}
                onClick={() => setActiveItem('Settings')}
              />
              <NavItem
                icon={<ProfilerIcon />}
                label="Profiler"
                active={activeItem === 'Profiler'}
                onClick={() => setActiveItem('Profiler')}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Security" defaultOpen>
            <div className="px-2 pb-2 space-y-[2px]">
              <NavItem
                icon={<Fingerprint />}
                label="Antinuke"
                active={activeItem === 'Antinuke'}
                onClick={() => setActiveItem('Antinuke')}
              />
              <NavItem
                icon={<DoorOpen />}
                label="Join Gate"
                active={activeItem === 'Join Gate'}
                onClick={() => setActiveItem('Join Gate')}
              />
              <NavItem
                icon={<ShieldAlert />}
                label="Fake Permissions"
                active={activeItem === 'Fake Permissions'}
                onClick={() => setActiveItem('Fake Permissions')}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Configuration" defaultOpen>
            <div className="px-2 pb-2 space-y-[2px]">
              <NavItem
                icon={<Users />}
                label="Roles"
                active={activeItem === 'Roles'}
                onClick={() => setActiveItem('Roles')}
              />
              <NavItem
                icon={<MessageSquare />}
                label="Messages"
                active={activeItem === 'Messages'}
                onClick={() => setActiveItem('Messages')}
              />
              <NavItem
                icon={<Star />}
                label="Starboard"
                active={activeItem === 'Starboard'}
                onClick={() => setActiveItem('Starboard')}
              />
              <NavItem
                icon={<Headphones />}
                label="VoiceMaster"
                active={activeItem === 'VoiceMaster'}
                onClick={() => setActiveItem('VoiceMaster')}
              />
              <NavItem
                icon={<Award />}
                label="Level Rewards"
                active={activeItem === 'Level Rewards'}
                onClick={() => setActiveItem('Level Rewards')}
              />
              <NavItem
                icon={<Bell />}
                label="Bump Reminder"
                active={activeItem === 'Bump Reminder'}
                onClick={() => setActiveItem('Bump Reminder')}
              />
              <NavItem
                icon={<SmilePlus />}
                label="Reaction Triggers"
                active={activeItem === 'Reaction Triggers'}
                onClick={() => setActiveItem('Reaction Triggers')}
              />
              <NavItem
                icon={<Command />}
                label="Command Aliases"
                active={activeItem === 'Command Aliases'}
                onClick={() => setActiveItem('Command Aliases')}
              />
              <NavItem
                icon={<Lightbulb />}
                label="Suggestions"
                active={activeItem === 'Suggestions'}
                onClick={() => setActiveItem('Suggestions')}
              />
              <NavItem
                icon={<List />}
                label="Logging"
                active={activeItem === 'Logging'}
                onClick={() => setActiveItem('Logging')}
              />
            </div>
          </SidebarSection>

          <SidebarSection title="Integrations">
            <div className="px-2 pb-2 space-y-[2px]">
              <NavItem
                icon={<Music />}
                label="TikTok"
                active={activeItem === 'TikTok'}
                onClick={() => setActiveItem('TikTok')}
              />
              <NavItem
                icon={<Camera />}
                label="Instagram"
                active={activeItem === 'Instagram'}
                onClick={() => setActiveItem('Instagram')}
              />
              <NavItem
                icon={<Youtube />}
                label="YouTube"
                active={activeItem === 'YouTube'}
                onClick={() => setActiveItem('YouTube')}
              />
            </div>
          </SidebarSection>
        </div>

        {/* Download card */}
        <div className="px-3 py-2 border-t border-white/5">
          <div className="relative rounded-md overflow-hidden bg-[#141414] border border-white/5 p-3 hover:bg-white/[0.05] transition-colors cursor-pointer group/card">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Download className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-zinc-200 group-hover/card:text-white transition-colors">
                  Idk something here
                </span>
                <span className="text-[11px] text-zinc-500">v0.1.0 • Windows</span>
              </div>
            </div>
          </div>
        </div>

        {/* User profile footer */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-full bg-[#141414] flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
              {iridiumClient.steamAvatar ? (
                <img src={iridiumClient.steamAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-zinc-300">
                  {iridiumClient.steamName ? iridiumClient.steamName[0].toUpperCase() : '?'}
                </span>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-[2px] border-[#0A0A0A]" />
            </div>
            <div className="flex flex-col truncate flex-1 leading-tight">
              <span className="text-[13px] font-medium text-zinc-200 truncate">
                {iridiumClient.steamName || 'Steam User'}
              </span>
              <span className="text-[11px] text-zinc-500 truncate">
                {iridiumClient.steamId ? `@${iridiumClient.steamId}` : '@unknown'}
              </span>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('iridium_token');
                window.location.reload();
              }}
              className="h-7 w-7 rounded-md hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors ml-auto shrink-0 group/logout"
            >
              <LogOut className="h-3.5 w-3.5 group-hover/logout:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Invisible drag / double-click handle */}
      <div
        onDoubleClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500/30"
        title="Double click to toggle"
      />
    </motion.div>
  );
}

/* ── Subcomponents ───────────────────────────────────────────────── */

function SidebarSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/5 transition-colors"
      >
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 relative
        ${
          active
            ? 'bg-white/[0.07] text-white'
            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
        }
      `}
    >
      <div
        className={`shrink-0 flex items-center justify-center ${
          active ? 'text-zinc-200' : 'text-zinc-500'
        }`}
      >
        {React.cloneElement(icon, {
          className: 'h-[16px] w-[16px] stroke-[2px]',
        } as React.HTMLAttributes<SVGElement>)}
      </div>
      <span className="truncate">{label}</span>

      {active && (
        <motion.div
          layoutId="active-nav-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-zinc-300"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

function ProfilerIcon(props: React.HTMLAttributes<SVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M2 9.26c0 3.748 4.02 7.711 6.962 10.11C10.294 20.458 10.96 21 12 21s1.706-.543 3.038-1.63C17.981 16.972 22 13.009 22 9.26C22 3.35 16.5.663 12 5.5C7.5.663 2 3.349 2 9.26" opacity=".5"/>
      <path fill="currentColor" d="M10.093 10.747q.133-.191.23-.325c.056.097.119.21.194.348l1.71 3.109c.166.302.33.598.493.813c.175.23.482.546.975.555s.813-.294.996-.518c.172-.208.345-.498.523-.794l.055-.092c.221-.368.36-.598.483-.764c.113-.154.179-.204.228-.231s.125-.058.315-.077c.206-.02.474-.02.904-.02H18a.75.75 0 0 0 0-1.5h-.834c-.387 0-.73 0-1.016.027a2.2 2.2 0 0 0-.91.264a2.2 2.2 0 0 0-.694.644c-.171.232-.347.525-.546.857l-.048.08c-.087.144-.159.264-.224.368l-.21-.377l-1.709-3.108c-.154-.28-.307-.56-.463-.764c-.17-.224-.462-.52-.93-.545c-.467-.025-.789.237-.982.442c-.177.186-.36.448-.543.71l-.31.442c-.227.324-.37.526-.493.672a.8.8 0 0 1-.223.203c-.046.024-.118.05-.293.066c-.19.018-.438.018-.834.018H6a.75.75 0 0 0 0 1.5h.768c.357 0 .674 0 .94-.024c.29-.026.571-.085.85-.23c.28-.145.489-.343.676-.564c.173-.205.354-.464.559-.757z"/>
    </svg>
  );
}