import { AnimatePresence, motion } from 'motion/react';
import {
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock,
  Flame,
  Heart,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

const WEEK_LABEL = 'Mar 7 – 14';

/* ─── Data & Context ─────────────────────────────────────────────────────── */

const chartData = [
  { name: 'Mar 7', short: 'Fri', messages: 24000, reactions: 3000 },
  { name: 'Mar 8', short: 'Sat', messages: 26000, reactions: 3200 },
  { name: 'Mar 9', short: 'Sun', messages: 28000, reactions: 3800 },
  { name: 'Mar 10', short: 'Mon', messages: 41514, reactions: 5393 },
  { name: 'Mar 11', short: 'Tue', messages: 32000, reactions: 4100 },
  { name: 'Mar 12', short: 'Wed', messages: 29000, reactions: 3900 },
  { name: 'Mar 13', short: 'Thu', messages: 28000, reactions: 3800 },
  { name: 'Mar 14', short: 'Fri', messages: 31000, reactions: 4000 },
];

const chartAvg = Math.round(
  chartData.reduce((s, d) => s + d.messages, 0) / chartData.length,
);
const chartPeak = Math.max(...chartData.map((d) => d.messages));

// Updated with "extra" metadata for the collapsible rows
const channelsByMessages = [
  { channel: 'general', value: '189,198', pct: 85.77, change: '+122k', trend: 'up' as const, extra: { peak: '14:00 UTC', topUser: '@jonathan', speed: '42 msg/min' } },
  { channel: 'logs', value: '11,584', pct: 5.25, change: '+11k', trend: 'up' as const, extra: { peak: '00:00 UTC', topUser: 'SystemBot', speed: '12 msg/min' } },
  { channel: 'staff-chat', value: '4,561', pct: 2.07, change: '+4k', trend: 'up' as const, extra: { peak: '09:30 UTC', topUser: '@sarah_k', speed: '5 msg/min' } },
  { channel: 'self-promo', value: '3,168', pct: 1.44, change: '+1.8k', trend: 'up' as const, extra: { peak: '18:00 UTC', topUser: '@creator99', speed: '2 msg/min' } },
  { channel: 'bots', value: '2,917', pct: 1.32, change: '+1.4k', trend: 'up' as const, extra: { peak: '22:00 UTC', topUser: 'MusicBot', speed: '1 msg/min' } },
];

const channelsByReactions = [
  { channel: 'general', value: '37,850', pct: 89.81, change: '+26k', trend: 'up' as const, extra: { peak: '14:15 UTC', topEmote: '🔥', ratio: '1.5 rxn/msg' } },
  { channel: 'news', value: '1,385', pct: 3.29, change: '+1.3k', trend: 'up' as const, extra: { peak: '10:00 UTC', topEmote: '👀', ratio: '4.2 rxn/msg' } },
  { channel: 'staff-chat', value: '1,365', pct: 3.24, change: '+1.2k', trend: 'up' as const, extra: { peak: '09:45 UTC', topEmote: '✅', ratio: '0.8 rxn/msg' } },
  { channel: 'bots', value: '578', pct: 1.37, change: '+332', trend: 'up' as const, extra: { peak: 'Auto', topEmote: '🤖', ratio: '0.1 rxn/msg' } },
  { channel: 'quarantined', value: '267', pct: 0.63, change: '-26', trend: 'down' as const, extra: { peak: 'N/A', topEmote: '💀', ratio: '0.5 rxn/msg' } },
];

const stats = [
  { title: 'Messages', value: '220,576', prev: '74,595', change: '+145,981', pct: '+195.7%', trend: 'up' as const, icon: MessageSquare, dataKey: 'messages', color: '#93C5FD' },
  { title: 'Reactions', value: '42,146', prev: '12,461', change: '+29,685', pct: '+238.1%', trend: 'up' as const, icon: Heart, dataKey: 'reactions', color: '#F9A8D4' },
  { title: 'Voice Hours', value: '1,573', prev: '1,358', change: '+215', pct: '+15.8%', trend: 'up' as const, icon: Clock, dataKey: 'reactions', color: '#C4B5FD' },
  { title: 'Active Members', value: '6,054', prev: '2,766', change: '+3,288', pct: '+118.9%', trend: 'up' as const, icon: Users, dataKey: 'messages', color: '#86EFAC' },
];

const periods = ['Day', 'Week', 'Month', 'Year'] as const;
type Period = (typeof periods)[number];

const dotGridStyle: CSSProperties = {
  backgroundImage:
    'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const easeCustom = [0.16, 1, 0.3, 1];

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function Dashboard() {
  const [period, setPeriod] = useState<Period>('Week');

  const peakDay = useMemo(
    () => chartData.reduce((a, b) => (b.messages > a.messages ? b : a)),
    [],
  );
  const avgDaily = useMemo(() => Math.round(220576 / 7), []);
  const ratio = useMemo(() => (220576 / 42146).toFixed(1), []);

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] font-sans text-zinc-300 custom-scrollbar">
      <div className="mx-auto max-w-[1440px] px-5 py-7 lg:px-10 lg:py-9">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2.5 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-[13px] font-bold text-white">
                  5S
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </div>
              </div>

              <h1 className="text-[26px] font-semibold tracking-tight text-white lg:text-[30px]">
                Welcome back, Mvk
              </h1>
              <p className="mt-1 text-[13px] text-zinc-500">
                {WEEK_LABEL}, 2026 · Weekly snapshot for{' '}
                <span className="text-zinc-300">server</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/70 p-0.5">
                {periods.map((p) => {
                  const active = period === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className="relative rounded-[5px] px-3 py-1.5 text-[12px] font-medium"
                    >
                      {active && (
                        <motion.span
                          layoutId="period"
                          className="absolute inset-0 rounded-[5px] bg-zinc-100"
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 28,
                          }}
                        />
                      )}
                      <span
                        className={cn(
                          'relative z-10',
                          active ? 'text-zinc-900' : 'text-zinc-500',
                        )}
                      >
                        {p}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-[12px] text-zinc-500 transition-colors hover:text-zinc-300">
                <CalendarDays className="h-3.5 w-3.5" />
                {WEEK_LABEL}
              </button>
            </div>
          </div>
        </motion.header>

        {/* ── Stat cards ── */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <StatCard key={s.title} {...s} index={i} />
          ))}
        </div>

        {/* ── Chart + Pulse ── */}
        <div className="mb-4 grid grid-cols-1 gap-3.5 xl:grid-cols-12">
          <Panel delay={0.12} className="xl:col-span-8 p-5 pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[13px] font-medium text-zinc-200">
                  Engagement
                </h2>
                <p className="text-[11px] text-zinc-600">
                  Messages &amp; reactions per day
                </p>
              </div>

              <div className="flex items-center gap-5 text-[11px]">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="inline-block h-[2px] w-3 rounded-full bg-zinc-400" />
                  Messages
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600">
                  <span className="inline-block w-3 border-b border-dashed border-zinc-600" />
                  Reactions
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-end gap-2.5">
              <span className="text-[38px] font-semibold leading-none tracking-tight text-white lg:text-[42px]">
                262,722
              </span>
              <div className="mb-1.5">
                <span className="flex items-center gap-0.5 text-[12px] font-medium text-emerald-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  201.9%
                </span>
                <span className="text-[10px] text-zinc-600">vs prev week</span>
              </div>
            </div>

            <div className="relative mt-4 h-[260px] w-full lg:h-[290px]">
              <div
                className="pointer-events-none absolute inset-0 rounded-xl opacity-50"
                style={dotGridStyle}
              />

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 8, left: -16, bottom: 4 }}
                >
                  <defs>
                    <linearGradient
                      id="msg-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#D4D4D8"
                        stopOpacity={0.08}
                      />
                      <stop
                        offset="100%"
                        stopColor="#D4D4D8"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#52525B' }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={38}
                    tick={{ fontSize: 10, fill: '#3f3f46' }}
                    tickFormatter={(v: number) =>
                      `${(v / 1000).toFixed(0)}k`
                    }
                  />

                  <ReferenceLine
                    y={chartAvg}
                    stroke="#3f3f46"
                    strokeDasharray="3 4"
                    strokeWidth={1}
                    label={{
                      value: `avg ${(chartAvg / 1000).toFixed(1)}k`,
                      position: 'right',
                      fill: '#52525B',
                      fontSize: 9,
                    }}
                  />

                  <Tooltip
                    cursor={{
                      stroke: 'rgba(255,255,255,0.05)',
                      strokeWidth: 1,
                    }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const msg = payload.find(
                        (p: any) => p.dataKey === 'messages',
                      );
                      const rxn = payload.find(
                        (p: any) => p.dataKey === 'reactions',
                      );
                      const msgVal = Number(msg?.value ?? 0);
                      const rxnVal = Number(rxn?.value ?? 0);
                      const idx = chartData.findIndex(
                        (d) => d.name === msg?.payload?.name,
                      );
                      const prev =
                        idx > 0 ? chartData[idx - 1].messages : null;
                      const delta =
                        prev !== null
                          ? (((msgVal - prev) / prev) * 100).toFixed(1)
                          : null;

                      return (
                        <div className="min-w-[170px] rounded-lg border border-zinc-800 bg-[#111113] px-3 py-2.5 text-[11px] shadow-2xl">
                          <div className="mb-2 flex items-baseline justify-between gap-3">
                            <span className="font-medium text-zinc-300">
                              {msg?.payload?.name}
                            </span>
                            <span className="text-[10px] text-zinc-600">
                              {msg?.payload?.short}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Messages</span>
                              <span className="font-medium tabular-nums text-white">
                                {msgVal.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Reactions</span>
                              <span className="font-medium tabular-nums text-zinc-300">
                                {rxnVal.toLocaleString()}
                              </span>
                            </div>
                            {delta !== null && (
                              <>
                                <div className="my-0.5 h-px bg-zinc-800/80" />
                                <div className="flex justify-between">
                                  <span className="text-zinc-600">
                                    vs prev day
                                  </span>
                                  <span
                                    className={cn(
                                      'font-medium tabular-nums',
                                      Number(delta) >= 0
                                        ? 'text-emerald-400'
                                        : 'text-rose-400',
                                    )}
                                  >
                                    {Number(delta) >= 0 ? '+' : ''}
                                    {delta}%
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="reactions"
                    stroke="#3f3f46"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    fill="none"
                    dot={false}
                    activeDot={{
                      r: 3,
                      fill: '#18181B',
                      stroke: '#71717A',
                      strokeWidth: 1.5,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="#a1a1aa"
                    strokeWidth={1.5}
                    fill="url(#msg-fill)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: '#18181B',
                      stroke: '#d4d4d8',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Pulse */}
          <Panel delay={0.16} className="flex flex-col xl:col-span-4 p-5">
            <div className="mb-4">
              <h3 className="text-[13px] font-medium text-zinc-200">
                Server Pulse
              </h3>
              <p className="text-[11px] text-zinc-600">{WEEK_LABEL}</p>
            </div>

            <div className="mb-5">
              <div className="text-[30px] font-semibold tracking-tight text-white">
                {new Intl.NumberFormat('en', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                })
                  .format(avgDaily)
                  .toLowerCase()}
                <span className="ml-0.5 text-base font-normal text-zinc-600">
                  /day
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Average daily messages
              </p>
            </div>

            {/* Weekly volume bars */}
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                Daily volume
              </p>
              <div
                className="flex items-end gap-[3px]"
                style={{ height: 44 }}
              >
                {chartData.map((d, i) => {
                  const h = (d.messages / chartPeak) * 100;
                  const isPeak = d.messages === chartPeak;
                  return (
                    <motion.div
                      key={d.name}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{
                        duration: 0.4,
                        delay: 0.18 + i * 0.03,
                      }}
                      className={cn(
                        'flex-1 rounded-[2px]',
                        isPeak ? 'bg-zinc-300' : 'bg-zinc-800',
                      )}
                    />
                  );
                })}
              </div>
              <div className="mt-1 flex gap-[3px]">
                {chartData.map((d) => (
                  <span
                    key={d.name}
                    className="flex-1 text-center text-[8px] text-zinc-700"
                  >
                    {d.short}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <InfoRow
                label="Peak"
                value={peakDay.name}
                detail={`${peakDay.messages.toLocaleString()}`}
              />
              <InfoRow
                label="Msg / reaction"
                value={`${ratio} : 1`}
                detail="across all channels"
              />
              <InfoRow
                label="Most active"
                value={`#${channelsByMessages[0].channel}`}
                detail={`${channelsByMessages[0].pct}%`}
              />
            </div>
          </Panel>
        </div>

        {/* ── Collapsible Channel Lists ── */}
        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
          <CollapsibleList 
            delay={0.2} 
            title="Channel Velocity" 
            subtitle="Ranked by message throughput"
            icon={Zap}
            color="#93C5FD" 
            items={channelsByMessages} 
          />
          <CollapsibleList 
            delay={0.24} 
            title="Engagement Density" 
            subtitle="Ranked by reaction ratio"
            icon={Sparkles}
            color="#F9A8D4" 
            items={channelsByReactions} 
          />
        </div>

        {/* ── Footer ── */}
        <div className="mt-6 flex items-center justify-between border-t border-zinc-800/40 pt-4 text-[11px] text-zinc-700">
          <span>
            Data from <span className="text-zinc-500">5STAR</span> ·{' '}
            {WEEK_LABEL}, 2025
          </span>
          <span>Updated 16s ago</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Primitives ─────────────────────────────────────────────────────────── */

function Panel({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        'rounded-xl border border-zinc-800/70 bg-[#0c0c0e]',
        className,
      )}
    >
      {children}
    </motion.section>
  );
}

function InfoRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2.5">
      <div>
        <div className="text-[10px] text-zinc-600">{label}</div>
        <div className="text-[13px] font-medium text-zinc-200">{value}</div>
      </div>
      <span className="text-[11px] tabular-nums text-zinc-600">{detail}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  prev,
  change,
  pct,
  trend,
  icon: Icon,
  dataKey,
  color,
  index,
}: {
  title: string;
  value: string;
  prev: string;
  change: string;
  pct: string;
  trend: 'up' | 'down';
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  dataKey: string;
  color: string;
  index: number;
}) {
  const up = trend === 'up';
  const gradientId = `spark-${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 + index * 0.035 }}
      className="group relative overflow-hidden rounded-xl border border-zinc-800/70 bg-[#0c0c0e] p-4"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0.5}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">{title}</span>
          <Icon className="h-3.5 w-3.5 opacity-60" style={{ color }} />
        </div>

        <div className="mt-3 text-[22px] font-semibold leading-none tracking-tight text-white">
          {value}
        </div>

        <div className="mt-1 text-[10px] text-zinc-600">
          was {prev} last week
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span
            className={cn(
              'flex items-center gap-0.5 font-medium',
              up ? 'text-emerald-400' : 'text-rose-400',
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {change}
          </span>
          <span className="tabular-nums text-zinc-600">{pct}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Collapsible Interactive Lists ──────────────────────────────────────── */

function CollapsibleList({ title, subtitle, icon: Icon, color, items, delay }: any) {
  return (
    <Panel delay={delay} className="flex flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/20 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800/80 bg-[#0c0c0e] shadow-sm">
            <Icon className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-zinc-200">{title}</h3>
            <p className="text-[11px] text-zinc-500">{subtitle}</p>
          </div>
        </div>
        <button className="rounded border border-zinc-800/80 px-2 py-1 text-[10px] text-zinc-500 transition-colors hover:bg-zinc-800/40 hover:text-zinc-300">
          View Raw
        </button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-800/30">
        {items.map((item: any, i: number) => (
          <CollapsibleRow key={item.channel} item={item} index={i} color={color} delay={delay} />
        ))}
      </div>
    </Panel>
  );
}

function CollapsibleRow({ item, index, color, delay }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const up = item.trend === 'up';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: delay + (index * 0.05) }}
      className="group flex cursor-pointer flex-col bg-transparent transition-colors hover:bg-zinc-800/20"
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex select-none items-center justify-between px-5 py-3.5"
      >
        <div className="flex w-[140px] items-center gap-3">
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-600 transition-colors group-hover:text-zinc-400" />
          </motion.div>
          <span className="text-[12px] font-medium text-zinc-300">
            <span className="mr-0.5 font-mono text-zinc-600">#</span>{item.channel}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-6">
          <div className="hidden w-[100px] items-center justify-end gap-2 sm:flex">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-zinc-800/70 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(item.pct, 100)}%` }}
                transition={{ duration: 0.8, ease: easeCustom }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <span className="w-8 text-right font-mono text-[10px] text-zinc-500">{item.pct}%</span>
          </div>

          <span className="w-[80px] text-right font-mono text-[12px] text-zinc-300">{item.value}</span>
          
          <span className={cn(
            'flex w-[60px] items-center justify-end font-mono text-[11px]',
            up ? 'text-emerald-400' : 'text-rose-400'
          )}>
            {up ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
            {item.change}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeCustom }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-4 mt-1 grid grid-cols-3 gap-4 border-t border-dashed border-zinc-800/50 pl-[46px] pt-4">
              
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-zinc-600">
                  <Flame className="h-2.5 w-2.5" /> Peak Time
                </span>
                <span className="font-mono text-[12px] text-zinc-300">{item.extra.peak}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-zinc-600">
                  <Users className="h-2.5 w-2.5" /> Top Driver
                </span>
                <span className="truncate font-mono text-[12px] text-zinc-300">
                  {item.extra.topUser || item.extra.topEmote}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-zinc-600">
                  <Activity className="h-2.5 w-2.5" /> Rate
                </span>
                <span className="font-mono text-[12px] text-zinc-300">
                  {item.extra.speed || item.extra.ratio}
                </span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}