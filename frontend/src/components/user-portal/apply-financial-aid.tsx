import { useState } from "react"
import { Check, ClipboardList } from "lucide-react"
import { PageHeader } from "../ui/shared"
import { Field, inputCls } from "../ui/form-ui"

const fundingSources = [
  "AICS",
  "Social pension",
  "Educational assistance",
  "Livelihood kit funding",
]

function generateReference() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `FAD-2026-${num}`
}

export default function ApplyFinancialAid() {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contact, setContact] = useState("")
  const [source, setSource] = useState(fundingSources[0])
  const [amountRequested, setAmountRequested] = useState("")
  const [narrative, setNarrative] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState("")

  const canSubmit = name.trim() && address.trim() && contact.trim() && narrative.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    setReference(generateReference())
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center">
            <Check className="h-7 w-7 text-success" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground">Request submitted</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Thank you, {name}. Your financial aid request under {source} has been received and is now pending
            review.
          </p>
          <div className="mt-2 bg-muted rounded-xl px-4 py-3 w-full">
            <p className="text-xs text-muted-foreground">Reference number</p>
            <p className="text-sm font-semibold text-foreground">{reference}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Save this reference number to track your request status.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Request financial aid"
        desc="Fill out this form to request assistance from the office's cash aid programs. A social worker will review your request and contact you for the next steps."
      />

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList className="h-4 w-4 text-primary" />
          Requester information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} h-10`} placeholder="Juan D. Dela Cruz" />
          </Field>
          <Field label="Contact number">
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={`${inputCls} h-10`} placeholder="09XX XXX XXXX" />
          </Field>
          <Field label="Address" full>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputCls} h-10`} placeholder="Barangay, City" />
          </Field>
          <Field label="Program source">
            <select value={source} onChange={(e) => setSource(e.target.value)} className={`${inputCls} h-10`}>
              {fundingSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount requested (₱)">
            <input
              type="number"
              value={amountRequested}
              onChange={(e) => setAmountRequested(e.target.value)}
              className={`${inputCls} h-10`}
              placeholder="0.00"
            />
          </Field>
          <Field label="Reason for request" full>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder="Briefly describe your situation and why you need this assistance..."
            />
          </Field>
        </div>

        <p className="text-xs text-muted-foreground">
          You will need to bring a valid ID and Barangay Certificate of Indigency, plus requirements specific
          to the program source, when you visit for verification.
        </p>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Submit request
        </button>
      </div>
    </div>
  )
}