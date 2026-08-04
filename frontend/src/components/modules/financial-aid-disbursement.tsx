import { StatCard, ServiceCard, StatusBadge, PageHeader } from "../ui/shared"
const stats = [
  { label: "Disbursed this month", value: "₱2,148,600" },
  { label: "Pending release", value: "₱384,200" },
  { label: "Recipients paid", value: "742" },
  { label: "On hold", value: "9" },
]

const sources = [
  { label: "AICS", desc: "Crisis assistance releases" },
  { label: "Social pension", desc: "Monthly stipend for seniors and PWDs" },
  { label: "Educational assistance", desc: "Solo parent and AICS-linked school subsidies" },
  { label: "Livelihood kit funding", desc: "Starter kit and cooperative capital releases" },
]

const disbursements = [
  { recipient: "Marites A. Bautista", program: "AICS — medical assistance", amount: "₱8,500", date: "Jul 30, 2026", status: "Released" },
  { recipient: "Corazon V. Santos", program: "Social pension", amount: "₱500", date: "Jul 30, 2026", status: "Released" },
  { recipient: "Grace M. Villareal", program: "Solo parent — educational assistance", amount: "₱3,000", date: "Jul 29, 2026", status: "Pending" },
  { recipient: "Sari-Sari Store Cooperative", program: "Livelihood kit funding", amount: "₱45,000", date: "Jul 28, 2026", status: "On hold" },
  { recipient: "Ferdinand L. Reyes", program: "AICS — burial assistance", amount: "₱10,000", date: "Jul 27, 2026", status: "Released" },
]

export default function FinancialAidDisbursement() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Financial aid disbursement"
        desc="Consolidated release tracking for cash assistance across AICS, social pension, educational aid and livelihood funding."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Funding sources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sources.map((s) => <ServiceCard key={s.label} {...s} />)}
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent disbursements</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="px-4 py-2 font-medium">Recipient</th>
              <th className="px-4 py-2 font-medium">Program source</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {disbursements.map((d, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{d.recipient}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.program}</td>
                <td className="px-4 py-3 text-foreground">{d.amount}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.date}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

