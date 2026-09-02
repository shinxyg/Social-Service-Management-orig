import { BarChart3 } from "lucide-react"

export default function Reports() {
  return (
    <div>
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1">System-wide reports, trends, and exportable data</p>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 bg-slate-100 rounded-full mb-4">
            <BarChart3 size={32} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Ginagawa pa ito</h2>
          <p className="text-slate-500 text-sm max-w-sm">
            Susunod na natin itong buuuin. Sabihin mo lang kung ready ka na para dito.
          </p>
        </div>
      </div>
    </div>
  )
}