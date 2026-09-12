'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Users } from 'lucide-react'
import { getChallenges } from '@/lib/api'

type Challenge = {
  id: string
  title: string
  description: string
  category: string
  district: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'In progress' | 'Under review'
  supporters: number
  submittedBy?: string
  date: string
}

const statuses = ['All statuses', 'Open', 'In progress', 'Under review']
const priorities = ['All priorities', 'High', 'Medium', 'Low']

export default function ChallengesPage({ setView }: { setView: (view: 'home' | 'citizen' | 'submit' | 'challenges') => void }) {
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('All districts')
  const [category, setCategory] = useState('All impact areas')
  const [status, setStatus] = useState('All statuses')
  const [priority, setPriority] = useState('All priorities')
  const [page, setPage] = useState(1)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadChallenges() {
      const response = await getChallenges()
      if (!response.success) {
        setError(response.message || 'Unable to load challenges. Please try again.')
        setLoading(false)
        return
      }

      const statusLabels: Record<string, Challenge['status']> = {
        submitted: 'Under review',
        under_review: 'Under review',
        approved: 'Open',
        assigned: 'In progress',
        in_progress: 'In progress',
        resolved: 'Open',
        rejected: 'Under review',
      }
      const priorityLabels: Record<string, Challenge['priority']> = {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        critical: 'High',
      }

      setChallenges((response.data || []).map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        category: item.category,
        district: item.district,
        priority: priorityLabels[item.priority] || 'Medium',
        status: statusLabels[item.status] || 'Under review',
        supporters: 0,
        submittedBy: item.submittedBy?.name,
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable',
      })))
      setLoading(false)
    }

    loadChallenges()
  }, [])

  const districts = useMemo(() => ['All districts', ...Array.from(new Set(challenges.map((item) => item.district)))], [challenges])
  const categories = useMemo(() => ['All impact areas', ...Array.from(new Set(challenges.map((item) => item.category)))], [challenges])
  const filtered = useMemo(() => challenges.filter((item) => {
    const haystack = `${item.title} ${item.description} ${item.category} ${item.district}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (district === 'All districts' || item.district === district) && (category === 'All impact areas' || item.category === category) && (status === 'All statuses' || item.status === status) && (priority === 'All priorities' || item.priority === priority)
  }), [challenges, query, district, category, status, priority])

  return <main className="min-h-full min-w-0 bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-700">Community action board</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Browse Community Challenges</h2><p className="mt-2 text-sm leading-6 text-slate-500">Explore local problems that need ideas, expertise and collaborative action.</p></div><button onClick={() => setView('submit')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Submit a problem <ArrowRight className="size-4" /></button></div>
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"><Search className="size-4 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search challenges by title, location or keyword" className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" /></div><div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><SlidersHorizontal className="size-4" /> Filters</div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[district, setDistrict, districts], [category, setCategory, categories], [status, setStatus, statuses], [priority, setPriority, priorities]].map(([value, setter, options], index) => <select key={index} value={value as string} onChange={(event) => { (setter as (value: string) => void)(event.target.value); setPage(1) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-700">{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select>)}</div></div>
    <div className="mt-6 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">{filtered.length} challenges found</p><p className="hidden text-xs text-slate-400 sm:block">Showing page {page} of 1</p></div>
    <div className="mt-3 grid gap-4 lg:grid-cols-2">{loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center lg:col-span-2"><p className="font-bold text-slate-800">Loading challenges...</p><p className="mt-1 text-sm text-slate-500">Fetching the latest community challenges.</p></div> : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center lg:col-span-2"><p className="font-bold text-red-800">Unable to load challenges</p><p className="mt-1 text-sm text-red-700">{error}</p></div> : filtered.length ? filtered.map((item) => <button key={item.id} onClick={() => { window.location.href = `/challenges/${item.id}` }} className="group text-left rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><span className="text-xs font-bold tracking-wider text-slate-400">{item.id}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.priority === 'High' ? 'bg-orange-50 text-orange-800' : item.priority === 'Medium' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{item.priority} priority</span></div><h3 className="mt-3 text-lg font-bold leading-7 text-slate-950 group-hover:text-emerald-800">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{item.category}</span><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{item.district}</span><span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.status}</span></div><div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-400"><span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{item.submittedBy ? `Submitted by ${item.submittedBy}` : `${item.supporters} supporters`}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Submitted {item.date}</span></div></button>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center lg:col-span-2"><p className="font-bold text-slate-800">No challenges match those filters.</p><p className="mt-1 text-sm text-slate-500">Try a different keyword or clear one of the filters.</p></div>}</div>
    <div className="mt-8 flex items-center justify-center gap-2"><button className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400" aria-label="Previous page"><ChevronLeft className="size-4" /></button><span className="grid size-9 place-items-center rounded-lg bg-emerald-800 text-sm font-bold text-white">1</span><button className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400" aria-label="Next page"><ChevronRight className="size-4" /></button></div>
  </div></main>
}
