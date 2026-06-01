import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Ban,
  UserX,
  Trash2,
  Hash,
  Webhook,
  Globe,
  ShieldAlert,
  Bot,
  Key,
  Plus,
  Circle,
  Clock,
  Shield,
  Pencil,
} from 'lucide-react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const ease = [0.16, 1, 0.3, 1] as const;
const spring = { type: 'spring' as const, stiffness: 500, damping: 40 };

interface Module {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'enabled' | 'disabled';
  permissions: string;
  threshold: number;
  interval: string;
  punishment: string;
  triggers: number;
  lastTriggered: string | null;
}

const securityModules: Module[] = [
  {
    id: 'ban',
    name: 'mass-ban-protection',
    description:
      'Automatically prevents mass member ban sequences and suspends the initiator.',
    icon: Ban,
    status: 'enabled',
    permissions: 'Administrator',
    threshold: 3,
    interval: '10s',
    punishment: 'strip-roles',
    triggers: 12,
    lastTriggered: '2h ago',
  },
  {
    id: 'kick',
    name: 'mass-kick-protection',
    description:
      'Stops rapid member kicks within a short timeframe threshold.',
    icon: UserX,
    status: 'enabled',
    permissions: 'Administrator',
    threshold: 4,
    interval: '15s',
    punishment: 'strip-roles',
    triggers: 7,
    lastTriggered: '1d ago',
  },
  {
    id: 'role',
    name: 'mass-role-deletion',
    description:
      'Protects against unauthorized mass deletion or modification of server roles.',
    icon: Trash2,
    status: 'enabled',
    permissions: 'Administrator',
    threshold: 2,
    interval: '10s',
    punishment: 'ban',
    triggers: 3,
    lastTriggered: '5d ago',
  },
  {
    id: 'channel',
    name: 'channel-integrity',
    description:
      'Halts mass creation or deletion of channels to prevent server defacement.',
    icon: Hash,
    status: 'disabled',
    permissions: 'Administrator',
    threshold: 3,
    interval: '10s',
    punishment: 'strip-roles',
    triggers: 0,
    lastTriggered: null,
  },
  {
    id: 'webhook',
    name: 'webhook-watchdog',
    description:
      'Monitors and blocks suspicious mass webhook creation attempts.',
    icon: Webhook,
    status: 'enabled',
    permissions: 'Administrator',
    threshold: 3,
    interval: '30s',
    punishment: 'strip-roles',
    triggers: 5,
    lastTriggered: '3h ago',
  },
  {
    id: 'vanity',
    name: 'vanity-url-lock',
    description:
      'Instantly punishes users attempting to change or steal the server vanity URL.',
    icon: Globe,
    status: 'enabled',
    permissions: 'Server Owner',
    threshold: 1,
    interval: '0s',
    punishment: 'ban',
    triggers: 1,
    lastTriggered: '2w ago',
  },
  {
    id: 'emoji',
    name: 'emoji-protection',
    description:
      'Prevents mass emoji deletion. May be unstable due to strict Discord API rate limits.',
    icon: ShieldAlert,
    status: 'disabled',
    permissions: 'Administrator',
    threshold: 5,
    interval: '20s',
    punishment: 'strip-roles',
    triggers: 0,
    lastTriggered: null,
  },
  {
    id: 'botadd',
    name: 'anti-bot-addition',
    description: 'Blocks unauthorized OAuth2 bot additions to the server.',
    icon: Bot,
    status: 'disabled',
    permissions: 'Administrator',
    threshold: 1,
    interval: '0s',
    punishment: 'strip-roles',
    triggers: 0,
    lastTriggered: null,
  },
  {
    id: 'permissions',
    name: 'permission-guard',
    description:
      'Watches dangerous permissions (Admin, Ban, Kick) being granted to unauthorized roles.',
    icon: Key,
    status: 'enabled',
    permissions: 'Administrator',
    threshold: 2,
    interval: '10s',
    punishment: 'strip-roles',
    triggers: 9,
    lastTriggered: '6h ago',
  },
];

const recentEvents = [
  {
    id: 1,
    text: 'Blocked mass ban attempt',
    module: 'ban',
    time: '2m ago',
    severity: 'high' as const,
  },
  {
    id: 2,
    text: 'Webhook creation blocked',
    module: 'webhook',
    time: '3h ago',
    severity: 'medium' as const,
  },
  {
    id: 3,
    text: 'Permission grant reverted',
    module: 'permissions',
    time: '6h ago',
    severity: 'medium' as const,
  },
  {
    id: 4,
    text: '4 rapid kicks halted',
    module: 'kick',
    time: '1d ago',
    severity: 'high' as const,
  },
  {
    id: 5,
    text: 'Role deletion prevented',
    module: 'role',
    time: '5d ago',
    severity: 'high' as const,
  },
];

export function Antinuke() {
  const [activeTab, setActiveTab] = useState<
    'modules' | 'whitelist' | 'admins'
  >('modules');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const enabledCount = securityModules.filter(
    (m) => m.status === 'enabled'
  ).length;
  const totalTriggers = securityModules.reduce(
    (acc, m) => acc + m.triggers,
    0
  );

  const filteredModules = securityModules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#09090b] text-zinc-300 antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#09090b]/90 backdrop-blur-lg">
        <div className="mx-auto max-w-[1200px] px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-zinc-400" />
            <span className="text-[13px] text-zinc-200 font-medium tracking-tight">
              Antinuke
            </span>
            <span className="text-zinc-700 text-[13px]">/</span>
            <span className="text-[13px] text-zinc-500">Configuration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
            <span className="text-[12px] text-zinc-500">Connected</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-6 pt-10 sm:pt-14 pb-32">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-600 font-mono mb-6">
            <Terminal className="w-3.5 h-3.5 text-zinc-600" />
            <span>system</span>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-zinc-500">antinuke</span>
          </div>
          <h1 className="text-[28px] font-semibold text-white mb-3 tracking-tight">
            Security Modules
          </h1>
          <p className="text-zinc-500 text-[14px] leading-relaxed max-w-lg">
            Configure protection modules and automated response thresholds for
            your server.
          </p>

          {/* Inline stats */}
          <div className="flex items-center gap-6 mt-6 text-[13px]">
            <span className="text-zinc-500">
              <span className="text-white font-medium">{enabledCount}</span>
              <span className="text-zinc-600">
                {' '}
                / {securityModules.length} active
              </span>
            </span>
            <span className="text-zinc-800">·</span>
            <span className="text-zinc-500">
              <span className="text-white font-medium">{totalTriggers}</span>
              <span className="text-zinc-600"> triggers total</span>
            </span>
            <span className="text-zinc-800">·</span>
            <span className="text-zinc-500">
              <span className="text-white font-medium">2</span>
              <span className="text-zinc-600"> whitelisted</span>
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10 items-start">
          {/* ─── Main ─── */}
          <main className="min-w-0">
            {/* Command */}
            <button
              onClick={() => handleCopy('/antinuke toggle <module_id>')}
              className="group w-full flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/50 hover:bg-zinc-900/80 px-4 py-3 font-mono text-[13px] mb-8 transition-colors"
            >
              <span className="text-zinc-500">
                <span className="text-zinc-300">/antinuke toggle</span>{' '}
                <span className="text-zinc-600">&lt;module_id&gt;</span>
              </span>
              <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors">
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 mb-6">
              {(
                [
                  { key: 'modules' as const, label: 'Modules' },
                  { key: 'whitelist' as const, label: 'Whitelist' },
                  { key: 'admins' as const, label: 'Admins' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative px-3 py-1.5 text-[13px] rounded-md transition-colors',
                    activeTab === tab.key
                      ? 'text-white'
                      : 'text-zinc-600 hover:text-zinc-400'
                  )}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-zinc-800/70 rounded-md"
                      initial={false}
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="h-px bg-zinc-800/40 mb-6" />

            {/* Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'modules' && (
                <motion.div
                  key="modules"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter modules..."
                      className="w-full bg-transparent border border-zinc-800/50 rounded-lg py-2 pl-9 pr-4 text-[13px] text-zinc-300 placeholder:text-zinc-700 font-mono focus:outline-none focus:border-zinc-700/60 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {filteredModules.map((module, i) => (
                      <ModuleRow
                        key={module.id}
                        module={module}
                        index={i}
                      />
                    ))}
                    {filteredModules.length === 0 && (
                      <div className="flex items-center justify-center py-16 text-zinc-700 font-mono text-[13px]">
                        No results for &ldquo;{search}&rdquo;
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'whitelist' && (
                <motion.div
                  key="whitelist"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] text-zinc-500">
                      Users and bots excluded from checks.
                    </p>
                    <button className="flex items-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-md px-2.5 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors">
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                  <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_48px] gap-4 px-4 py-2 bg-zinc-900/30 border-b border-zinc-800/40">
                      <span className="text-[11px] text-zinc-600 font-medium">
                        Entity
                      </span>
                      <span className="text-[11px] text-zinc-600 font-medium">
                        Type
                      </span>
                      <span />
                    </div>
                    <WhitelistRow
                      name="sys.jonathan"
                      id="948374920"
                      type="User"
                    />
                    <WhitelistRow
                      name="evelith.bot"
                      id="189284729"
                      type="Bot"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'admins' && (
                <motion.div
                  key="admins"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800/50 rounded-lg py-20">
                    <div className="mb-3 p-2 rounded-lg bg-zinc-900/50">
                      <Key className="w-4 h-4 text-zinc-600" />
                    </div>
                    <p className="text-[13px] text-zinc-400 mb-1">
                      No external admins
                    </p>
                    <p className="text-[12px] text-zinc-600 mb-5">
                      Only the server owner has access.
                    </p>
                    <button className="flex items-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-md px-3 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors">
                      <Plus className="w-3 h-3" />
                      Add Admin
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* ─── Sidebar ─── */}
          <aside className="hidden lg:flex flex-col gap-5 sticky top-16">
            {/* Activity */}
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/20">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/30">
                <span className="text-[12px] text-zinc-400 font-medium">
                  Activity
                </span>
                <Clock className="w-3 h-3 text-zinc-700" />
              </div>
              <div className="p-1">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-800/20 transition-colors group"
                  >
                    <div className="mt-[6px] shrink-0">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          event.severity === 'high'
                            ? 'bg-red-500/50'
                            : 'bg-yellow-500/40'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-zinc-500 leading-snug group-hover:text-zinc-400 transition-colors">
                        {event.text}
                      </p>
                      <span className="text-[11px] text-zinc-700 font-mono">
                        {event.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commands */}
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/20">
              <div className="px-4 py-3 border-b border-zinc-800/30">
                <span className="text-[12px] text-zinc-400 font-medium">
                  Commands
                </span>
              </div>
              <div className="p-2 space-y-1">
                <CommandRow cmd="/an status" />
                <CommandRow cmd="/an whitelist add <id>" />
                <CommandRow cmd="/an threshold ban 5" />
              </div>
            </div>

            {/* Module overview */}
            <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/20">
              <div className="px-4 py-3 border-b border-zinc-800/30">
                <span className="text-[12px] text-zinc-400 font-medium">
                  At a glance
                </span>
              </div>
              <div className="px-4 py-3 space-y-2">
                {securityModules.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-1 h-1 rounded-full shrink-0',
                        m.status === 'enabled'
                          ? 'bg-emerald-500/60'
                          : 'bg-zinc-700'
                      )}
                    />
                    <span className="text-[11px] text-zinc-600 font-mono flex-1 truncate">
                      {m.id}
                    </span>
                    {m.triggers > 0 && (
                      <span className="text-[10px] text-zinc-700 font-mono tabular-nums">
                        {m.triggers}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="mt-14 flex items-center justify-between text-[11px] text-zinc-800 font-mono">
          <span>antinuke · v2.4.1</span>
          <span>last sync just now</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Components ─── */

function CommandRow({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      onClick={() => {
        navigator.clipboard.writeText(cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="group flex items-center justify-between rounded-md px-3 py-2 cursor-pointer hover:bg-zinc-800/30 transition-colors"
    >
      <code className="text-[11px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors truncate">
        {cmd}
      </code>
      <span className="shrink-0 ml-2">
        {copied ? (
          <Check className="w-3 h-3 text-emerald-500/70" />
        ) : (
          <Copy className="w-3 h-3 text-zinc-800 group-hover:text-zinc-500 transition-colors" />
        )}
      </span>
    </div>
  );
}

function ModuleRow({ module, index }: { module: Module; index: number }) {
  const [enabled, setEnabled] = useState(module.status === 'enabled');
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState({
    threshold: module.threshold.toString(),
    interval: module.interval,
    punishment: module.punishment,
    cooldown: '30s',
  });
  const Icon = module.icon;

  const updateConfig =
    (key: keyof typeof config) => (value: string) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease, delay: index * 0.025 }}
      className={cn(
        'rounded-lg overflow-hidden transition-colors duration-150',
        expanded ? 'bg-zinc-900/40' : 'hover:bg-zinc-900/25'
      )}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 px-3.5 py-3 cursor-pointer select-none"
      >
        <Icon
          className={cn(
            'w-[15px] h-[15px] shrink-0 transition-colors',
            enabled ? 'text-zinc-500' : 'text-zinc-700'
          )}
        />

        <span
          className={cn(
            'font-mono text-[13px] transition-colors flex-1',
            enabled ? 'text-zinc-300' : 'text-zinc-600'
          )}
        >
          {module.name}
        </span>

        {module.triggers > 0 && (
          <span className="text-[11px] text-zinc-700 font-mono hidden sm:block tabular-nums">
            {module.triggers}
          </span>
        )}

        <div onClick={(e) => e.stopPropagation()} className="ml-1">
          <Switch enabled={enabled} setEnabled={setEnabled} />
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="ml-0.5"
        >
          <ChevronDown className="w-3.5 h-3.5 text-zinc-700" />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-4">
              <div className="border-t border-zinc-800/30 pt-3.5 ml-[27px]">
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-5">
                  {module.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mb-5">
                  <EditableConfigLine
                    label="Threshold"
                    value={config.threshold}
                    onChange={updateConfig('threshold')}
                  />
                  <EditableConfigLine
                    label="Interval"
                    value={config.interval}
                    onChange={updateConfig('interval')}
                  />
                  <EditableConfigLine
                    label="Punishment"
                    value={config.punishment}
                    onChange={updateConfig('punishment')}
                  />
                  <EditableConfigLine
                    label="Cooldown"
                    value={config.cooldown}
                    onChange={updateConfig('cooldown')}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-700">
                  <span>
                    requires{' '}
                    <span className="text-zinc-500">
                      {module.permissions.toLowerCase()}
                    </span>
                  </span>
                  {module.lastTriggered && (
                    <>
                      <span className="text-zinc-800">·</span>
                      <span>
                        last triggered{' '}
                        <span className="text-zinc-500">
                          {module.lastTriggered}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EditableConfigLine({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(value);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } else {
      setDraft(value);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] text-zinc-600">{label}</span>
        <AnimatePresence>
          {justSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
            >
              <Check className="w-2.5 h-2.5 text-emerald-400/70" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative h-7">
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 4, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
              transition={{ duration: 0.2, ease }}
              className="absolute inset-x-0"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                  }
                  if (e.key === 'Escape') {
                    setDraft(value);
                    setEditing(false);
                  }
                }}
                className="w-full h-7 bg-zinc-800/90 border border-zinc-700/60 rounded-md px-2.5 text-[12px] text-zinc-200 font-mono focus:outline-none focus:border-zinc-500/60 focus:ring-1 focus:ring-zinc-500/15 transition-all"
              />
            </motion.div>
          ) : (
            <motion.div
              key="display"
              onClick={() => setEditing(true)}
              className="absolute inset-x-0 flex items-center h-7 cursor-pointer"
              initial={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 4, filter: 'blur(3px)' }}
              transition={{ duration: 0.2, ease }}
            >
              <div className="relative flex items-center gap-1.5 rounded-md px-2.5 h-full overflow-hidden">
                {/* Slide-in highlight */}
                <motion.div
                  className="absolute inset-0 bg-zinc-800/50 rounded-md"
                  initial={false}
                  animate={{
                    clipPath: hovered
                      ? 'inset(0 0% 0 0)'
                      : 'inset(0 100% 0 0)',
                  }}
                  transition={{
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />

                <motion.span
                  className="relative z-10 font-mono text-[12px]"
                  initial={false}
                  animate={{
                    color: hovered ? '#e4e4e7' : '#a1a1aa',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {value}
                </motion.span>

                <motion.div
                  className="relative z-10"
                  initial={false}
                  animate={{
                    opacity: hovered ? 0.5 : 0,
                    x: hovered ? 0 : -6,
                  }}
                  transition={{
                    duration: 0.25,
                    ease: [0.16, 1, 0.3, 1],
                    delay: hovered ? 0.06 : 0,
                  }}
                >
                  <Pencil className="w-2.5 h-2.5 text-zinc-400" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Switch({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={cn(
        'relative w-8 h-[18px] rounded-full transition-colors duration-200 focus:outline-none',
        enabled ? 'bg-zinc-300' : 'bg-zinc-800'
      )}
    >
      <motion.div
        animate={{ x: enabled ? 14 : 2 }}
        transition={spring}
        className={cn(
          'absolute top-[2px] h-[14px] w-[14px] rounded-full transition-colors duration-200',
          enabled ? 'bg-zinc-950' : 'bg-zinc-600'
        )}
      />
    </button>
  );
}

function WhitelistRow({
  name,
  id,
  type,
}: {
  name: string;
  id: string;
  type: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_80px_48px] gap-4 px-4 py-2.5 border-b border-zinc-800/25 last:border-0 hover:bg-zinc-800/15 transition-colors">
      <div className="flex items-center gap-2 overflow-hidden">
        <Circle
          className={cn(
            'w-1.5 h-1.5 shrink-0 fill-current',
            type === 'Bot' ? 'text-blue-400/40' : 'text-emerald-400/40'
          )}
        />
        <span className="font-mono text-[13px] text-zinc-400 truncate">
          {name}
        </span>
        <span className="font-mono text-[11px] text-zinc-700 hidden sm:block">
          {id}
        </span>
      </div>
      <div className="flex items-center">
        <span className="text-[11px] text-zinc-600">{type}</span>
      </div>
      <div className="flex items-center justify-end">
        <button className="p-1 text-zinc-700 hover:text-red-400/60 transition-colors rounded">
          <UserX className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}