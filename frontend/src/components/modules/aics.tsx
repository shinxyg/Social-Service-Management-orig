import { useMemo, useState } from "react"
import { StatCard, ServiceCard, StatusBadge, PageHeader } from "../ui/shared"
import { AICSApplicationWizard, type AICSApplicationResult, type AICSApplicantInfo } from "../wizards/application-wizard"
import { Tabs } from "../ui/tabs"
import { FileText, ClipboardCheck } from "lucide-react"

const stats = [
  { label: "Applications this month", value: "184" },
  { label: "Pending review", value: "37" },
  { label: "Approved", value: "129" },
  { label: "Released", value: "₱1,842,300" },
]

const assistanceTypes = [
  { label: "Medical assistance", desc: "Hospital bills, medicines, laboratory and confinement expenses" },
  { label: "Burial assistance", desc: "Funeral and burial cost support for indigent families" },
  { label: "Educational assistance", desc: "School supplies, tuition and allowance for students in crisis" },
  { label: "Transportation assistance", desc: "Fare and travel support for medical referrals or emergencies" },
]

const initialApplications = [
  { name: "Marites A. Bautista", type: "Medical assistance", filed: "Jul 28, 2026", amount: "₱8,500", status: "Pending" },
  { name: "Rodrigo S. Villanueva", type: "Burial assistance", filed: "Jul 27, 2026", amount: "₱10,000", status: "Approved" },
  { name: "Jennalyn P. Cruz", type: "Educational assistance", filed: "Jul 26, 2026", amount: "₱3,000", status: "Released" },
  { name: "Efren M. Delos Santos", type: "Transportation assistance", filed: "Jul 25, 2026", amount: "₱1,200", status: "Approved" },
  { name: "Aiza R. Fernandez", type: "Medical assistance", filed: "Jul 24, 2026", amount: "₱15,000", status: "For interview" },
]

const pendingSubmissions: AICSApplicantInfo[] = [
  {
    name: "Liza P. Gonzales",
    address: "Purok 3, Barangay San Isidro",
    contact: "0917 234 5678",
    type: "Medical assistance",
    narrative: "Nahospital ang asawa ko dahil sa stroke, kailangan ng pambayad sa gamot.",
  },
  {
    name: "Noel A. Ramirez",
    address: "Zone 2, Barangay Bagong Pag-asa",
    contact: "0928 456 1230",
    type: "Educational assistance",
    narrative: "Anak ko malapit na mag-enroll pero wala kaming pambayad ng school fees.",
  },
]

export default function AICS() {
  const [view, setView] = useState<"dashboard" | "picker" | "wizard">("dashboard")
  const [applications, setApplications] = useState(initialApplications)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState<AICSApplicantInfo | null>(null)

  const handleSubmit = (result: AICSApplicationResult) => {
    setApplications((prev) => [
      { name: result.name || "Unnamed applicant", type: result.type, filed: "Jul 31, 2026", amount: result.amount, status: result.status },
      ...prev,
    ])
    setSelectedSubmission(null)
  }

  const tabItems = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of applications) counts[a.status] = (counts[a.status] ?? 0) + 1
    return [
      { value: "all", label: "All", count: applications.length },
      { value: "Pending", label: "Pending", count: counts["Pending"] ?? 0 },
      { value: "For interview", label: "For interview", count: counts["For interview"] ?? 0 },
      { value: "Approved", label: "Approved", count: counts["Approved"] ?? 0 },
      { value: "Released", label: "Released", count: counts["Released"] ?? 0 },
      { value: "Disapproved", label: "Disapproved", count: counts["Disapproved"] ?? 0 },
    ]
  }, [applications])

  const filteredApplications = useMemo(
    () => (statusFilter === "all" ? applications : applications.filter((a) => a.status === statusFilter)),
    [applications, statusFilter]
  )

  if (view === "picker") {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Pending applications from residents"
          subtitle="These were submitted directly by residents through the online portal. Select one to begin verification and processing."
        />
        <div className="space-y-3 max-w-2xl">
          {pendingSubmissions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedSubmission(s)
                setView("wizard")
              }}
              className="w-full text-left bg-card border border-border rounded-2xl p-4 shadow-soft hover:-translate-y-0.5 hover:shadow-medium transition-all flex items-start gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.type} — {s.address}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.narrative}</p>
              </div>
            </button>
          ))}
          {pendingSubmissions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No pending submissions right now.</p>
          )}
        </div>
        <button
          onClick={() => setView("dashboard")}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  if (view === "wizard" && selectedSubmission) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Process AICS application"
          subtitle="Verification, interview, assessment, approval and release steps for a resident-submitted crisis assistance request."
        />
        <AICSApplicationWizard
          onCancel={() => {
            setSelectedSubmission(null)
            setView("dashboard")
          }}
          onSubmit={handleSubmit}
          applicant={selectedSubmission}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="AICS — Assistance to Individuals in Crisis"
          subtitle="Case intake and disbursement for residents facing medical, burial, educational or transportation emergencies."
        />
        <button
          onClick={() => setView("picker")}
          className="shrink-0 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <ClipboardCheck className="h-4 w-4" />
          Review submissions
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Assistance types covered</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assistanceTypes.map((a) => <ServiceCard key={a.label} {...a} />)}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Recent applications</h2>
          <Tabs items={tabItems} value={statusFilter} onChange={setStatusFilter} />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">Applicant</th>
              <th className="px-4 py-2 font-medium">Assistance type</th>
              <th className="px-4 py-2 font-medium">Date filed</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((a, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{a.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.filed}</td>
                <td className="px-4 py-3 text-foreground">{a.amount}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
            {filteredApplications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No applications with this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}