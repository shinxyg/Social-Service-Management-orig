import { useState } from "react"
import { StatCard, ServiceCard, StatusBadge, PageHeader } from "../ui/shared"
import { LivelihoodApplicationWizard, type LivelihoodApplicationResult, type LivelihoodApplicantInfo } from "../wizards/livelihood-wizard"
import { FileText, ClipboardCheck } from "lucide-react"

const stats = [
  { label: "Active trainees", value: "312" },
  { label: "Ongoing batches", value: "6" },
  { label: "Graduates this year", value: "890" },
  { label: "Livelihood kits released", value: "154" },
]

const programs = [
  { label: "Skills training", desc: "TESDA-partnered short courses in trades and services" },
  { label: "Livelihood starter kit", desc: "Tools and materials grant for micro-enterprise start-up" },
  { label: "Cooperative development", desc: "Formation and technical support for community cooperatives" },
  { label: "TESDA certification assistance", desc: "Assessment fee subsidy and scheduling support" },
]

const batches = [
  { program: "Dressmaking NC II", partner: "TESDA", slots: "25 / 25 enrolled", status: "Ongoing" },
  { program: "Food processing basics", partner: "City LGU", slots: "18 / 20 enrolled", status: "Enrolling" },
  { program: "Electrical installation NC II", partner: "TESDA", slots: "20 / 20 enrolled", status: "Completed" },
  { program: "Livelihood kit — sari-sari store", partner: "City LGU", slots: "40 beneficiaries", status: "Releasing" },
]

const initialRegistrations: { name: string; program: string; status: string }[] = [
  { name: "Arnel B. Domingo", program: "Dressmaking NC II", status: "Certified" },
  { name: "Precious J. Manalo", program: "Food processing basics", status: "Incomplete" },
]

export default function LivelihoodTraining() {
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [activeWizardApplicant, setActiveWizardApplicant] = useState<LivelihoodApplicantInfo | null>(null)

  const handleStartWizard = () => {
    setActiveWizardApplicant({
      name: "Juan Dela Cruz",
      address: "Brgy. Central, City",
      contact: "09123456789",
      preferredProgram: "Dressmaking NC II",
      narrative: "Wants to learn garment creation to start a small tailoring business from home.",
    })
  }

  const handleWizardSubmit = (result: LivelihoodApplicationResult) => {
    setRegistrations([result, ...registrations])
    setActiveWizardApplicant(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Livelihood & Training Programs"
        subtitle="Manage skills training, starter kits, and certification assistance."
      />

      {activeWizardApplicant ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Processing Livelihood Application</h2>
            <button
              onClick={() => setActiveWizardApplicant(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <LivelihoodApplicationWizard
            applicant={activeWizardApplicant}
            onCancel={() => setActiveWizardApplicant(null)}
            onSubmit={handleWizardSubmit}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Pending Resident Applications</h2>
                <p className="text-xs text-muted-foreground">Applications submitted via the resident portal awaiting staff review.</p>
              </div>
              <button
                onClick={handleStartWizard}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <ClipboardCheck className="h-4 w-4" />
                Process Application Wizard
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs font-medium">
                    <th className="pb-3 font-medium">Applicant Name</th>
                    <th className="pb-3 font-medium">Program</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {registrations.map((reg, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-3 font-medium text-foreground">{reg.name}</td>
                      <td className="py-3 text-muted-foreground">{reg.program}</td>
                      <td className="py-3">
                        <StatusBadge status={reg.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Available Programs</h2>
              <div className="space-y-3">
                {programs.map((p) => (
                  <ServiceCard key={p.label} title={p.label} description={p.desc} icon={FileText} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Active Batches</h2>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-soft space-y-3">
                {batches.map((b, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{b.program}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Partner: {b.partner}</span>
                      <span>{b.slots}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}