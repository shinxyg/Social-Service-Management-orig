import { useState } from "react"
import { StatCard, ServiceCard, StatusBadge, PageHeader } from "../ui/shared"
import { SoloParentApplicationWizard, type SoloParentApplicationResult, type SoloParentApplicantInfo } from "../wizards/solo-parent-wizard"
import { FileText, ClipboardCheck } from "lucide-react"

const stats = [
  { label: "Registered solo parents", value: "642" },
  { label: "Active child welfare cases", value: "58" },
  { label: "Solo parent IDs issued", value: "601" },
  { label: "Cases needing follow-up", value: "13" },
]

const services = [
  { label: "Solo parent ID", desc: "Registration under the Solo Parents Welfare Act for benefits access" },
  { label: "Child welfare case management", desc: "Intake, monitoring and referral for child protection concerns" },
  { label: "Educational assistance", desc: "School subsidy for children of registered solo parents" },
  { label: "Protective custody referral", desc: "Coordination with DSWD and law enforcement for at-risk children" },
]

const initialCases = [
  { name: "Grace M. Villareal", type: "Solo parent ID", dependents: "2 children", status: "Approved" },
  { name: "Case No. CW-2026-0071", type: "Child welfare case", dependents: "1 child, age 7", status: "Under monitoring" },
  { name: "Danilo P. Mercado", type: "Solo parent ID renewal", dependents: "3 children", status: "Pending" },
  { name: "Case No. CW-2026-0065", type: "Child welfare case", dependents: "2 children, ages 4 and 9", status: "For home visit" },
]

// Mock submissions filed by residents through the online portal
// (user-portal/apply-solo-parent.tsx). Staff pick one here to begin
// review — UI-only for now, same pattern as AICS.
const pendingSubmissions: SoloParentApplicantInfo[] = [
  {
    name: "Emilyn R. Salazar",
    address: "Purok 2, Barangay Sto. Niño",
    contact: "0917 332 8891",
    dependents: "1 child, age 3",
    proofOfStatus: "Widowed — has Barangay Certificate and death certificate of spouse",
  },
  {
    name: "Bryan T. Aguilar",
    address: "Zone 4, Barangay Bagumbayan",
    contact: "0928 110 4477",
    dependents: "2 children, ages 6 and 10",
    proofOfStatus: "Separated — Barangay Certificate on file",
  },
]

export default function SoloParentChildWelfare() {
  const [view, setView] = useState<"dashboard" | "picker" | "wizard">("dashboard")
  const [cases, setCases] = useState(initialCases)
  const [selectedSubmission, setSelectedSubmission] = useState<SoloParentApplicantInfo | null>(null)

  const handleSubmit = (result: SoloParentApplicationResult) => {
    setCases((prev) => [
      { name: result.name, type: "Solo parent ID", dependents: "—", status: result.status },
      ...prev,
    ])
    setSelectedSubmission(null)
    setView("dashboard")
  }

  if (view === "picker") {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Pending applications from residents"
          desc="These were submitted directly by residents through the online portal. Select one to begin review and processing."
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
                <p className="text-xs text-muted-foreground mt-0.5">{s.dependents} — {s.address}</p>
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
          title="Process Solo Parent ID application"
          desc="Document review, interview, approval and ID issuance for a resident-submitted request."
        />
        <SoloParentApplicationWizard
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
          title="Solo parent & child welfare support"
          desc="Solo parent identification, benefits enrollment, and child welfare case monitoring and referral."
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
        <h2 className="text-sm font-semibold text-foreground mb-3">Services offered</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((s) => <ServiceCard key={s.label} {...s} />)}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Active records</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">Name / case</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Dependents</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.dependents}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}