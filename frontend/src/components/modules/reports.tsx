import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  TrendingUp,
  Wallet,
  FileCheck2,
  Download,
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Line,
} from "recharts"



type ModuleKey =
  | "AICS"
  | "PWD & Senior Citizen"
  | "Solo Parent & Child Welfare"
  | "Livelihood & Training"

interface ModuleStat {
  module: ModuleKey
  total: number
  pending: number
  approved: number
  rejected: number
}

const MODULE_STATS: ModuleStat[] = [
  { module: "AICS", total: 184, pending: 37, approved: 129, rejected: 18 },
  { module: "PWD & Senior Citizen", total: 96, pending: 21, approved: 68, rejected: 7 },
  { module: "Solo Parent & Child Welfare", total: 58, pending: 14, approved: 39, rejected: 5 },
  { module: "Livelihood & Training", total: 4, pending: 2, approved: 1, rejected: 1 },
]

interface DisbursementSource {
  label: string
  amount: number
}

const DISBURSEMENT_SOURCES: DisbursementSource[] = [
  { label: "AICS", amount: 1284600 },
  { label: "Social pension", amount: 412300 },
  { label: "Educational assistance", amount: 296700 },
  { label: "Livelihood kit funding", amount: 155000 },
]

const RECENT_MONTHS = [
  { label: "Mar", applications: 142, disbursed: 1620000 },
  { label: "Apr", applications: 158, disbursed: 1745000 },
  { label: "May", applications: 171, disbursed: 1890500 },
  { label: "Jun", applications: 165, disbursed: 1802300 },
  { label: "Jul", applications: 189, disbursed: 2015800 },
  { label: "Aug", applications: 342, disbursed: 2148600 },
]

// Hex equivalents of the Tailwind classes used elsewhere on the page, so the
// recharts SVGs match the chip/bar colors exactly.
const moduleColors: Record<ModuleKey, { bar: string; text: string; chip: string; hex: string }> = {
  AICS: { bar: "bg-blue-500", text: "text-blue-700", chip: "bg-blue-50 border-blue-200", hex: "#3b82f6" },
  "PWD & Senior Citizen": { bar: "bg-purple-500", text: "text-purple-700", chip: "bg-purple-50 border-purple-200", hex: "#a855f7" },
  "Solo Parent & Child Welfare": { bar: "bg-rose-500", text: "text-rose-700", chip: "bg-rose-50 border-rose-200", hex: "#f43f5e" },
  "Livelihood & Training": { bar: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-50 border-emerald-200", hex: "#10b981" },
}

const DEFAULT_MODULE_COLOR = {
  bar: "bg-slate-500",
  text: "text-slate-700",
  chip: "bg-slate-50 border-slate-200",
  hex: "#64748b",
}

function getModuleColors(key?: string) {
  if (!key) return DEFAULT_MODULE_COLOR
  if (moduleColors[key as ModuleKey]) return moduleColors[key as ModuleKey]

  const lower = key.toLowerCase()
  if (lower.includes("aics") || lower.includes("financial")) {
    return moduleColors["AICS"]
  }
  if (lower.includes("pwd") || lower.includes("senior")) {
    return moduleColors["PWD & Senior Citizen"]
  }
  if (lower.includes("solo") || lower.includes("child")) {
    return moduleColors["Solo Parent & Child Welfare"]
  }
  if (lower.includes("livelihood") || lower.includes("training") || lower.includes("skills")) {
    return moduleColors["Livelihood & Training"]
  }

  return DEFAULT_MODULE_COLOR
}

const DISBURSEMENT_COLOR = "#2563eb"

function peso(n: number) {
  return `₱${n.toLocaleString()}`
}

type RangeOption = "This Month" | "Last 3 Months" | "Last 6 Months" | "Year to Date"

// Small tooltip shells so the recharts defaults match the card's rounded/soft look.
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-soft text-xs">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          <span className="font-medium" style={{ color: p.color || p.payload?.fill }}>
            {p.name}:{" "}
          </span>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const [range, setRange] = useState<RangeOption>("Last 6 Months")
  // Controls whether the module progress bars have animated in yet. Starts
  // false so bars render at 0% width, then flips to true a tick after mount
  // so the browser animates the width change via the CSS transition below.
  const [barsAnimated, setBarsAnimated] = useState(false)

  const totals = useMemo(() => {
    const total = MODULE_STATS.reduce((s, m) => s + m.total, 0)
    const approved = MODULE_STATS.reduce((s, m) => s + m.approved, 0)
    const pending = MODULE_STATS.reduce((s, m) => s + m.pending, 0)
    const rejected = MODULE_STATS.reduce((s, m) => s + m.rejected, 0)
    const disbursed = DISBURSEMENT_SOURCES.reduce((s, d) => s + d.amount, 0)
    const decided = approved + rejected
    const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0
    return { total, approved, pending, rejected, disbursed, approvalRate }
  }, [])

  // Data shaped for the "Applications by program" doughnut chart.
  const moduleShareData = useMemo(
    () =>
      MODULE_STATS.map((m) => ({
        name: m.module,
        value: m.total,
        pct: totals.total > 0 ? Math.round((m.total / totals.total) * 100) : 0,
        fill: getModuleColors(m.module).hex,
      })),
    [totals.total]
  )

  // Data shaped for the disbursement bar chart.
  const disbursementData = useMemo(
    () =>
      DISBURSEMENT_SOURCES.map((d) => ({
        name: d.label,
        amount: d.amount,
        pct: totals.disbursed > 0 ? Math.round((d.amount / totals.disbursed) * 100) : 0,
      })),
    [totals.disbursed]
  )

  // Kick off the bar-fill animation shortly after first paint.
  useEffect(() => {
    const t = setTimeout(() => setBarsAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeOption)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option>This Month</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>Year to Date</option>
          </select>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Top-level stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileCheck2 className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Total applications</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{totals.total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">across all programs</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Approval rate</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{totals.approvalRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totals.approved.toLocaleString()} approved of {(totals.approved + totals.rejected).toLocaleString()} decided
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Pending review</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{totals.pending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">awaiting decision</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Wallet className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Total disbursed</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{peso(totals.disbursed)}</p>
          <p className="text-xs text-muted-foreground mt-1">this period</p>
        </div>
      </div>

      {/* Applications by module — doughnut chart + breakdown bars */}
      <div className="bg-card border border-border rounded-2xl shadow-soft p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Applications by program</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
          {/* Doughnut showing % share of total applications */}
          <div className="lg:col-span-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moduleShareData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {moduleShareData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip formatter={(v: number) => `${v} applications`} />}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Per-program breakdown, still showing pending/approved/rejected detail */}
          <div className="lg:col-span-3 space-y-4">
            {MODULE_STATS.map((m, idx) => {
              const colors = getModuleColors(m.module)
              const share = moduleShareData.find((d) => d.name === m.module)?.pct ?? 0
              const decided = m.approved + m.rejected
              const approvalPct = decided > 0 ? Math.round((m.approved / decided) * 100) : 0
              return (
                <div key={m.module}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${colors?.chip || 'bg-slate-50 border-slate-200'} ${colors?.text || 'text-slate-700'}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors?.hex || '#64748b' }} />
                      {m.module}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.total} total &middot; {share}% share &middot; {approvalPct}% approval
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors?.bar || 'bg-slate-500'} transition-[width] duration-1000 ease-out`}
                      style={{
                        width: `${barsAnimated ? share : 0}%`,
                        transitionDelay: `${idx * 120}ms`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground">
                    <span>{m.pending} pending</span>
                    <span>{m.approved} approved</span>
                    <span>{m.rejected} rejected</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Disbursement breakdown — horizontal bar chart */}
        <div className="bg-card border border-border rounded-2xl shadow-soft p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Disbursement by funding source</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={disbursementData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip formatter={(v: number) => peso(v)} />} />
                <Bar dataKey="amount" name="Disbursed" fill={DISBURSEMENT_COLOR} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">{peso(totals.disbursed)}</span>
          </div>
        </div>

        {/* Monthly trend — bars for applications, line for amount disbursed */}
        <div className="bg-card border border-border rounded-2xl shadow-soft p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Monthly application volume</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={RECENT_MONTHS} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v: number) => `₱${(v / 1e6).toFixed(1)}M`}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(v: number) => (v > 100000 ? peso(v) : `${v} applications`)}
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  yAxisId="left"
                  dataKey="applications"
                  name="Applications"
                  fill="#93c5fd"
                  radius={[4, 4, 0, 0]}
                  barSize={22}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="disbursed"
                  name="Disbursed"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Latest month ({RECENT_MONTHS[RECENT_MONTHS.length - 1].label}):{" "}
            <span className="font-semibold text-foreground">
              {RECENT_MONTHS[RECENT_MONTHS.length - 1].applications} applications
            </span>{" "}
            &middot;{" "}
            <span className="font-semibold text-foreground">
              {peso(RECENT_MONTHS[RECENT_MONTHS.length - 1].disbursed)} disbursed
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}