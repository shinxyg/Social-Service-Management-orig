import { useState } from "react"
import { StatCard, ServiceCard, StatusBadge, PageHeader } from "../ui/shared"
import { PWDSeniorApplicationWizard, type PWDSeniorApplicationResult, type PWDSeniorApplicantInfo } from "../wizards/pwd-senior-wizard"
import { FileText, ClipboardCheck } from "lucide-react"

const stats = [
  { label: "Registered PWD", value: "1,204" },
  { label: "Registered senior citizens", value: "3,678" },
  { label: "ID applications pending", value: "42" },
  { label: "Social pension recipients", value: "986" },
]

const services = [
  { label: "PWD ID application", desc: "New registration and identification card issuance" },
  { label: "Senior citizen ID application", desc: "OSCA-issued ID for residents 60 years old and above" },
  { label: "Purchase discount booklet", desc: "20% discount and VAT exemption booklet issuance" },
  { label: "Social pension", desc: "Monthly stipend enrollment for indigent seniors and PWDs" },
]

const initialRecords = [
  { name: "Leonora T. Aquino", category: "Senior citizen", idNumber: "SC-2026-00481", action: "New application", status: "Approved" },
  { name: "Michael D. Ramos", category: "PWD", idNumber: "PWD-2026-00219", action: "New application", status: "For assessment" },
  { name: "Corazon V. Santos", category: "Senior citizen", idNumber: "SC-2024-00093", action: "ID renewal", status: "Ready for release" },
  { name: "Ferdinand L. Reyes", category: "PWD", idNumber: "PWD-2025-00107", action: "Booklet reissuance", status: "Pending" },
]

// Mock submissions filed by residents through the online portal
// (user-portal/apply-pwd-senior.tsx). Staff pick one here to begin
// verification — UI-only for now, same pattern as AICS.
const pendingSubmissions: PWDSeniorApplicantInfo[] = [
  {
    name: "Rosalinda M. Torres",
    address: "Purok 5, Barangay Malaya",
    contact: "0917 555 2233",
    category: "Senior Citizen",
    medicalCertificate: "",
  },
  {
    name: "Julius P. Cabrera",
    address: "Zone 1, Barangay San Roque",
    contact: "0928 774 4410",
    category: "PWD",
    medicalCertificate: "Dr. Reyes — mobility impairment, left leg",
  },
]

export default function PWDSeniorCitizen() {
  const [view, setView] = useState<"dashboard" | "picker" | "wizard">("dashboard")
  const [records, setRecords] = useState(initialRecords)
  const [selectedSubmission, setSelectedSubmission] = useState<PWDSeniorApplicantInfo | null>(null)

  const handleSubmit = (result: PWDSeniorApplicationResult) => {
    setRecords((prev) => [
      { name: result.name, category: result.category, idNumber: result.idNumber, action: "New application", status: result.status },
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
          desc="These were submitted directly by residents through the online portal. Select one to begin verification and processing."
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
                <p className="text-xs text-muted-foreground mt-0.5">{s.category} — {s.address}</p>
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
          title="Process PWD / Senior Citizen application"
          desc="Registration, medical verification, approval, ID issuance and benefits activation for a resident-submitted request."
        />
        <PWDSeniorApplicationWizard
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
          title="PWD & senior citizen services"
          desc="Registration, ID issuance, discount privileges and social pension enrollment for persons with disability and senior citizens."
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
          <h2 className="text-sm font-semibold text-foreground">Recent records</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">Beneficiary</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">ID number</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.idNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.action}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}