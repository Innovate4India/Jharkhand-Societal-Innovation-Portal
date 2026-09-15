'use client'

import { useEffect, useState } from 'react'
import { createIndustrySponsorship, getIndustryOpportunities, getIndustrySponsorships, getCurrentUserFromStorage } from '@/lib/api'

type Project = { _id: string; title: string; solutionSummary?: string; estimatedBudget?: number; status?: string; challenge?: { _id?: string; title?: string; category?: string; district?: string; priority?: string }; university?: { institution?: string; name?: string } }
type Sponsorship = { _id: string; amount: number; status: string; project?: Project; challenge?: { title?: string } }
const money = (n = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function IndustryDashboard() {
  const [opportunities, setOpportunities] = useState<Project[]>([])
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [amount, setAmount] = useState('')
  const [expertise, setExpertise] = useState('')
  const [notes, setNotes] = useState('')
  const profile = getCurrentUserFromStorage() as { name?: string; email?: string; mobile?: string; organizationName?: string } | null
  const [contactPerson, setContactPerson] = useState(profile?.name || '')
  const [contactEmail, setContactEmail] = useState(profile?.email || '')
  const [contactPhone, setContactPhone] = useState(profile?.mobile || '')
  const [message, setMessage] = useState('Loading eligible university projects...')

  async function load() {
    const [o, s] = await Promise.all([getIndustryOpportunities(), getIndustrySponsorships()])
    if (o.success) setOpportunities(o.data || [])
    if (s.success) setSponsorships(s.data || [])
    setMessage(!o.success ? (o.message || 'Unable to load opportunities') : '')
  }
  useEffect(() => { void load() }, [])

  async function sponsor(event: React.FormEvent) {
    event.preventDefault()
    if (!selected || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return setMessage('Enter a positive funding amount.')
    const response = await createIndustrySponsorship({ challenge: selected.challenge?._id || selected._id, amount: Number(amount), expertise, notes, contactPerson, contactEmail, contactPhone })
    if (!response.success) return setMessage(response.message || 'Unable to submit funding proposal')
    setSelected(null); setAmount(''); setExpertise(''); setNotes(''); setMessage('Funding proposal sent to the university for review.')
    void load()
  }
  return <main className="min-h-full bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-6xl space-y-8">
    <header><p className="text-xs font-bold uppercase tracking-wider text-orange-700">Industry partner</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Sponsorship opportunities</h1><p className="mt-2 text-sm text-slate-600">Review verified, university-accepted problems and send a funding proposal before final funding is approved.</p></header>
    {message && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{message}</p>}
    <section><h2 className="mb-4 text-lg font-bold text-slate-900">Available opportunities</h2><div className="grid gap-4 md:grid-cols-2">{opportunities.length ? opportunities.map(p => <article key={p._id} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">{p.title}</h3><p className="mt-1 text-sm text-slate-500">{p.challenge?.category} · {p.challenge?.district} · Priority: {p.challenge?.priority || '—'}</p><p className="mt-3 text-sm text-slate-700">{p.solutionSummary || 'University proposal available for review.'}</p><p className="mt-3 text-sm">University: <b>{p.university?.institution || p.university?.name || 'Assigned university'}</b></p><p className="mt-1 text-sm">Estimated budget: <b>{money(p.estimatedBudget)}</b></p><button onClick={() => setSelected(p)} className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white">Send funding proposal</button></article>) : <p className="rounded-xl bg-white p-5 text-sm text-slate-500">No eligible opportunities yet.</p>}</div></section>
    <section><h2 className="mb-4 text-lg font-bold text-slate-900">My sponsored projects</h2>{sponsorships.length ? <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-4">Project</th><th className="p-4">University</th><th className="p-4">Amount</th><th className="p-4">Sponsorship</th><th className="p-4">Lifecycle</th></tr></thead><tbody>{sponsorships.map(s => <tr key={s._id} className="border-b last:border-0"><td className="p-4 font-semibold">{s.project?.title || s.challenge?.title}</td><td className="p-4">{s.project?.university?.institution || s.project?.university?.name || '—'}</td><td className="p-4">{money(s.amount)}</td><td className="p-4 capitalize">{s.status}</td><td className="p-4 capitalize">{s.project?.status || '—'}</td></tr>)}</tbody></table></div> : <p className="rounded-xl bg-white p-5 text-sm text-slate-500">No sponsored projects yet</p>}</section>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form onSubmit={sponsor} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Funding proposal for {selected.title}</h2><p className="text-sm text-slate-500">The proposal is sent to the assigned University first. Final funding is only allowed after University acceptance.</p><label className="block text-sm font-semibold">Company<input readOnly value={profile?.organizationName || 'Authenticated Industry organization'} className="mt-1 h-11 w-full rounded-lg border bg-slate-50 px-3 text-slate-600" /></label><label className="block text-sm font-semibold">Contact person<input required value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="mt-1 h-11 w-full rounded-lg border px-3" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Contact email<input required type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border px-3" /></label><label className="block text-sm font-semibold">Contact phone<input required value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="mt-1 h-11 w-full rounded-lg border px-3" /></label></div><label className="block text-sm font-semibold">Proposed funding amount (₹)<input required min="1" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-11 w-full rounded-lg border px-3" /></label><label className="block text-sm font-semibold">Funding proposal message / remarks (optional)<textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label><label className="block text-sm font-semibold">Expertise / technical support (optional)<textarea value={expertise} onChange={e => setExpertise(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="rounded-lg border px-4 py-2">Cancel</button><button className="rounded-lg bg-emerald-800 px-4 py-2 font-bold text-white">Send funding proposal</button></div></form></div>}
  </div></main>
}
