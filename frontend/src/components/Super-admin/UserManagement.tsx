import { useState, useMemo } from "react"
import {
  Search, Plus, MoreVertical, ShieldCheck, UserCog, UserRound,
  Mail, Calendar, X, Trash2, Ban, CheckCircle2
} from "lucide-react"

type Role = "super_admin" | "staff" | "user"
type Status = "active" | "inactive"

interface AppUser {
  id: number
  name: string
  email: string
  role: Role
  status: Status
  joined: string
}

const ROLE_META: Record<Role, { label: string; icon: typeof ShieldCheck; badge: string; dot: string }> = {
  super_admin: { label: "Super Admin", icon: ShieldCheck, badge: "bg-blue-100 text-blue-700", dot: "bg-blue-600" },
  staff: { label: "Staff", icon: UserCog, badge: "bg-purple-100 text-purple-700", dot: "bg-purple-600" },
  user: { label: "Resident", icon: UserRound, badge: "bg-green-100 text-green-700", dot: "bg-green-600" }
}

// ---- Dummy seed data (palitan mo na lang later ng galing sa API) ----
const SEED_USERS: AppUser[] = [
  { id: 1, name: "Admin Reyes", email: "admin.reyes@qc.gov.ph", role: "super_admin", status: "active", joined: "Jan 12, 2024" },
  { id: 2, name: "Maria Santos", email: "maria.santos@qc.gov.ph", role: "staff", status: "active", joined: "Feb 03, 2024" },
  { id: 3, name: "Juan Dela Cruz", email: "juan.delacruz@qc.gov.ph", role: "staff", status: "active", joined: "Feb 15, 2024" },
  { id: 4, name: "Liza Cruz", email: "liza.cruz@qc.gov.ph", role: "staff", status: "inactive", joined: "Mar 01, 2024" },
  { id: 5, name: "Mark Villanueva", email: "mark.villanueva@gmail.com", role: "user", status: "active", joined: "Mar 20, 2024" },
  { id: 6, name: "Angela Torres", email: "angela.torres@gmail.com", role: "user", status: "active", joined: "Apr 02, 2024" },
  { id: 7, name: "Ricardo Bautista", email: "ricardo.bautista@gmail.com", role: "user", status: "active", joined: "Apr 18, 2024" },
  { id: 8, name: "Nenita Ramos", email: "nenita.ramos@gmail.com", role: "user", status: "inactive", joined: "May 05, 2024" },
  { id: 9, name: "Carlo Mendoza", email: "carlo.mendoza@gmail.com", role: "user", status: "active", joined: "May 22, 2024" },
  { id: 10, name: "Grace Aquino", email: "grace.aquino@qc.gov.ph", role: "staff", status: "active", joined: "Jun 10, 2024" }
]

export default function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>(SEED_USERS)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user" as Role })

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === "all" || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const counts = useMemo(() => ({
    all: users.length,
    super_admin: users.filter((u) => u.role === "super_admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    user: users.filter((u) => u.role === "user").length
  }), [users])

  const changeRole = (id: number, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    setOpenMenuId(null)
  }

  const toggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u))
    )
    setOpenMenuId(null)
  }

  const removeUser = (id: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setOpenMenuId(null)
  }

  const addUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return
    setUsers((prev) => [
      {
        id: Math.max(...prev.map((u) => u.id)) + 1,
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        status: "active",
        joined: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      },
      ...prev
    ])
    setNewUser({ name: "", email: "", role: "user" })
    setShowAddModal(false)
  }

  return (
    <div>
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-600 mt-1">Manage accounts and assign roles across the system</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition"
          >
            <Plus size={18} /> Add User
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Role Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setRoleFilter("all")}
            className={`text-left bg-white rounded-xl border p-6 transition-all ${
              roleFilter === "all" ? "border-slate-900 shadow-md" : "border-slate-200 hover:shadow-md"
            }`}
          >
            <p className="text-slate-600 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-slate-900">{counts.all}</p>
          </button>
          <button
            onClick={() => setRoleFilter("super_admin")}
            className={`text-left bg-white rounded-xl border p-6 transition-all ${
              roleFilter === "super_admin" ? "border-blue-600 shadow-md" : "border-slate-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-blue-600" />
              <p className="text-slate-600 text-sm">Super Admins</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{counts.super_admin}</p>
          </button>
          <button
            onClick={() => setRoleFilter("staff")}
            className={`text-left bg-white rounded-xl border p-6 transition-all ${
              roleFilter === "staff" ? "border-purple-600 shadow-md" : "border-slate-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCog size={16} className="text-purple-600" />
              <p className="text-slate-600 text-sm">Staff</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{counts.staff}</p>
          </button>
          <button
            onClick={() => setRoleFilter("user")}
            className={`text-left bg-white rounded-xl border p-6 transition-all ${
              roleFilter === "user" ? "border-green-600 shadow-md" : "border-slate-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserRound size={16} className="text-green-600" />
              <p className="text-slate-600 text-sm">Residents</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{counts.user}</p>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const meta = ROLE_META[u.role]
                  const RoleIcon = meta.icon
                  return (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${meta.dot} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                            {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              <RoleIcon size={13} className="text-slate-400" />
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail size={12} /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${meta.badge}`}
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="staff">Staff</option>
                          <option value="user">Resident</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                            u.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-slate-400"}`}></span>
                          {u.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 flex items-center gap-1.5">
                          <Calendar size={13} /> {u.joined}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                          <MoreVertical size={18} className="text-slate-500" />
                        </button>
                        {openMenuId === u.id && (
                          <div className="absolute right-6 top-12 z-20 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-left">
                            <button
                              onClick={() => toggleStatus(u.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {u.status === "active" ? (
                                <>
                                  <Ban size={15} /> Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={15} /> Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => removeUser(u.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={15} /> Remove user
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      Walang user na nahanap na tumutugma sa "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-4">
          Showing {filtered.length} of {users.length} users
        </p>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. juan@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Resident</option>
                  <option value="staff">Staff</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}