import { useState, type ReactElement } from "react"
import {
  UserCog,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Mail,
  Clock,
  Eye,
} from "lucide-react"

// =====================================================================================
// Types
// =====================================================================================

type UserRole = "Administrator" | "Social Worker" | "Encoder" | "Viewer"
type UserStatus = "active" | "inactive"

interface SystemUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  dateCreated: string
  lastLogin: string
  modulesAccess: string[]
}

// =====================================================================================
// Mock data
// =====================================================================================

const MOCK_USERS: SystemUser[] = [
  {
    id: "USR-001",
    name: "Admin User",
    email: "admin.user@govserve.qc.gov.ph",
    role: "Administrator",
    status: "active",
    dateCreated: "2025-11-02",
    lastLogin: "2026-08-22T16:40:00",
    modulesAccess: ["AICS", "PWD & Senior Citizen", "Solo Parent & Child Welfare", "Livelihood & Training", "Financial Aid", "Case Management", "Reports & Analytics"],
  },
  {
    id: "USR-002",
    name: "Jonalyn P.",
    email: "jonalyn.p@govserve.qc.gov.ph",
    role: "Encoder",
    status: "active",
    dateCreated: "2026-01-15",
    lastLogin: "2026-08-22T09:12:00",
    modulesAccess: ["AICS", "Livelihood & Training", "Solo Parent & Child Welfare"],
  },
  {
    id: "USR-003",
    name: "Ma. Teresa Lopez",
    email: "teresa.lopez@govserve.qc.gov.ph",
    role: "Social Worker",
    status: "active",
    dateCreated: "2026-02-20",
    lastLogin: "2026-08-21T14:05:00",
    modulesAccess: ["PWD & Senior Citizen", "Solo Parent & Child Welfare", "Case Management", "Appointments"],
  },
  {
    id: "USR-004",
    name: "Ronald Cruz",
    email: "ronald.cruz@govserve.qc.gov.ph",
    role: "Encoder",
    status: "inactive",
    dateCreated: "2026-03-10",
    lastLogin: "2026-06-30T10:22:00",
    modulesAccess: ["Financial Aid"],
  },
  {
    id: "USR-005",
    name: "Ivy Santos",
    email: "ivy.santos@govserve.qc.gov.ph",
    role: "Administrator",
    status: "active",
    dateCreated: "2025-12-05",
    lastLogin: "2026-08-20T08:47:00",
    modulesAccess: ["AICS", "PWD & Senior Citizen", "Solo Parent & Child Welfare", "Livelihood & Training", "Financial Aid", "Case Management", "Reports & Analytics", "Activity Log"],
  },
  {
    id: "USR-006",
    name: "Miguel Torres",
    email: "miguel.torres@govserve.qc.gov.ph",
    role: "Viewer",
    status: "active",
    dateCreated: "2026-05-18",
    lastLogin: "2026-08-18T11:30:00",
    modulesAccess: ["Reports & Analytics"],
  },
]

// =====================================================================================
// Theme
// =====================================================================================

const roleTheme: Record<UserRole, { chip: string; icon: ReactElement }> = {
  Administrator: { chip: "bg-indigo-100 text-indigo-700", icon: <Shield className="h-3.5 w-3.5" /> },
  "Social Worker": { chip: "bg-blue-100 text-blue-700", icon: <UserCog className="h-3.5 w-3.5" /> },
  Encoder: { chip: "bg-amber-100 text-amber-700", icon: <UserCog className="h-3.5 w-3.5" /> },
  Viewer: { chip: "bg-slate-100 text-slate-700", icon: <Eye className="h-3.5 w-3.5" /> },
}

const DEFAULT_ROLE_THEME = {
  chip: "bg-slate-100 text-slate-700",
  icon: <UserCog className="h-3.5 w-3.5" />,
}

function getRoleTheme(role?: string) {
  if (!role) return DEFAULT_ROLE_THEME
  if (roleTheme[role as UserRole]) return roleTheme[role as UserRole]

  const lower = role.toLowerCase()
  if (lower.includes("admin")) return roleTheme["Administrator"]
  if (lower.includes("worker") || lower.includes("social")) return roleTheme["Social Worker"]
  if (lower.includes("encoder") || lower.includes("staff")) return roleTheme["Encoder"]
  if (lower.includes("viewer") || lower.includes("user")) return roleTheme["Viewer"]

  return DEFAULT_ROLE_THEME
}

const ROLE_OPTIONS: UserRole[] = ["Administrator", "Social Worker", "Encoder", "Viewer"]

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

function initials(name: string) {
  const parts = name.trim().split(" ")
  return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase()
}

// =====================================================================================
// User Card
// =====================================================================================

function UserCard({ u, onOpen }: { u: SystemUser; onOpen: (id: string) => void }) {
  const rt = getRoleTheme(u.role)
  return (
    <div
      className={`border rounded-xl p-4 transition-shadow hover:shadow-sm ${
        u.status === "active" ? "bg-white border-border" : "bg-slate-50/60 border-slate-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-sm font-semibold">
          {initials(u.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{u.name}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${rt?.chip || 'bg-slate-100 text-slate-700'}`}>
              {rt?.icon}
              {u.role}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {u.email}
          </p>
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last login: {formatDateTime(u.lastLogin)}
            </span>
            <span>{u.modulesAccess.length} module{u.modulesAccess.length !== 1 ? "s" : ""} access</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {u.status === "active" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {u.status === "active" ? "Active" : "Inactive"}
          </span>
          <button
            onClick={() => onOpen(u.id)}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// User Profile Modal
// =====================================================================================

function UserProfileModal({
  u,
  onClose,
  onUpdateRole,
  onToggleStatus,
}: {
  u: SystemUser
  onClose: () => void
  onUpdateRole: (id: string, role: UserRole) => void
  onToggleStatus: (id: string) => void
}) {
  const [role, setRole] = useState<UserRole>(u.role)
  const rt = getRoleTheme(u.role)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-base font-semibold">
              {initials(u.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{u.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{u.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${rt?.chip || 'bg-slate-100 text-slate-700'}`}>
                  {rt?.icon}
                  {u.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {u.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-colors text-xl font-light"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div>
              <p className="text-xs text-muted-foreground">Date Created</p>
              <p className="text-foreground font-medium mt-0.5">{u.dateCreated}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Login</p>
              <p className="text-foreground font-medium mt-0.5">{formatDateTime(u.lastLogin)}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {role !== u.role && (
              <button
                onClick={() => onUpdateRole(u.id, role)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Save Role Change
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Modules Access ({u.modulesAccess.length})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {u.modulesAccess.map((m) => (
                <span key={m} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-between gap-3">
          <button
            onClick={() => onToggleStatus(u.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              u.status === "active"
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {u.status === "active" ? "Deactivate Account" : "Activate Account"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// =====================================================================================
// Main Component
// =====================================================================================

export default function UserManagement() {
  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<"all" | UserRole>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | UserStatus>("all")

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null

  const handleUpdateRole = (id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u))
    )
  }

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole
    const matchStatus = filterStatus === "all" || u.status === filterStatus
    const matchSearch =
      searchTerm === "" ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchRole && matchStatus && matchSearch
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    admins: users.filter((u) => u.role === "Administrator").length,
    encoders: users.filter((u) => u.role === "Encoder").length,
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "blue" },
          { label: "Active", value: stats.active, color: "green" },
          { label: "Administrators", value: stats.admins, color: "indigo" },
          { label: "Encoders", value: stats.encoders, color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg p-4 bg-${stat.color}-50 border border-${stat.color}-200`}>
            <p className={`text-xs font-semibold text-${stat.color}-700 uppercase`}>{stat.label}</p>
            <p className={`text-3xl font-bold text-${stat.color}-700 mt-2`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 block"
            >
              <option value="all">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 block"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Users ({filtered.length})</h2>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <UserCard key={u.id} u={u} onOpen={setSelectedUserId} />
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserProfileModal
          u={selectedUser}
          onClose={() => setSelectedUserId(null)}
          onUpdateRole={handleUpdateRole}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  )
}