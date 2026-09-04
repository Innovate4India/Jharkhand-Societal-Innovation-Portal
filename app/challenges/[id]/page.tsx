'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, MapPin, UserRound } from 'lucide-react'
import { getChallengeById } from '@/lib/api'

type Challenge = {
  _id: string
  title: string
  description: string
  category: string
  district: string
  villageOrCity: string
  status: string
  priority: string
  createdAt?: string
  submittedBy?: { name?: string; email?: string; role?: string; district?: string; villageOrCity?: string }
  assignedUniversity?: { name?: string; email?: string; institution?: string; universityDepartment?: string }
  location?: { latitude?: number | null; longitude?: number | null }
  aiAnalysis?: { category?: string; priority?: string; summary?: string; analyzedAt?: string }
}

function formatDate(value?: string) {
  if (!value) return 'Date unavailable'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function label(value?: string) {
  return value ? value.replaceAll('_', ' ') : 'Not available'
}

export default function ChallengeDetailsPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = window.location.pathname.split('/').filter(Boolean).at(-1)
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }

    async function loadChallenge() {
      const response = await getChallengeById(id)
      if (!response.success) {
        if (response.message === 'Challenge not found') setNotFound(true)
        else setError(response.message || 'Unable to load this challenge. Please try again.')
        setLoading(false)
        return
      }
      if (!response.data) {
        setNotFound(true)
      } else {
        setChallenge(response.data)
      }
      setLoading(false)
    }

    loadChallenge()
  }, [])

  if (loading) return <main className="min-h-screen bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-12 text-center"><p className="font-bold text-slate-800">Loading challenge...</p><p className="mt-1 text-sm text-slate-500">Fetching the latest challenge details.</p></div></main>
  if (notFound) return <main className="min-h-screen bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-4xl rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h1 className="text-xl font-bold text-slate-900">Challenge not found</h1><p className="mt-2 text-sm text-slate-500">This challenge may have been removed or the link is invalid.</p><button onClick={() => window.history.back()} className="mt-6 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">Back to challenges</button></div></main>
  if (error) return <main className="min-h-screen bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-12 text-center"><h1 className="text-xl font-bold text-red-800">Unable to load challenge</h1><p className="mt-2 text-sm text-red-700">{error}</p><button onClick={() => window.history.back()} className="mt-6 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-bold text-red-800">Back to challenges</button></div></main>
  if (!challenge) return null

  const hasLocation = challenge.location?.latitude != null && challenge.location?.longitude != null
  return <main className="min-h-screen bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-5xl"><button onClick={() => window.history.back()} className="mb-6 flex items-center gap-2 text-sm font-bold text-emerald-800"><ArrowLeft className="size-4" />Back to challenges</button><article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold tracking-wider text-slate-400">{challenge._id}</span><span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold capitalize text-orange-800">{label(challenge.priority)} priority</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold capitalize text-blue-700">{label(challenge.status)}</span></div><h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{challenge.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{challenge.description}</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{challenge.category}</span><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{challenge.district}</span><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{challenge.villageOrCity}</span></div><div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2"><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-4 text-emerald-700" /><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(challenge.createdAt)}</p></div></div><div className="flex items-start gap-3"><UserRound className="mt-0.5 size-4 text-emerald-700" /><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted by</p><p className="mt-1 text-sm font-semibold text-slate-700">{challenge.submittedBy?.name || 'Not available'}</p></div></div>{hasLocation && <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-emerald-700" /><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coordinates</p><p className="mt-1 text-sm font-semibold text-slate-700">{challenge.location?.latitude}, {challenge.location?.longitude}</p></div></div>}</div></article><div className="mt-6 grid gap-6 md:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Collaboration</p><h2 className="mt-1 text-lg font-bold text-slate-950">Assigned university</h2><p className="mt-4 text-sm font-semibold text-slate-700">{challenge.assignedUniversity?.name || challenge.assignedUniversity?.institution || 'Not assigned'}</p>{challenge.assignedUniversity?.universityDepartment && <p className="mt-1 text-sm text-slate-500">{challenge.assignedUniversity.universityDepartment}</p>}</section><section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Analysis</p><h2 className="mt-1 text-lg font-bold text-slate-950">AI assessment</h2>{challenge.aiAnalysis?.summary ? <p className="mt-4 text-sm leading-6 text-slate-600">{challenge.aiAnalysis.summary}</p> : <p className="mt-4 text-sm text-slate-500">No analysis is available for this challenge yet.</p>}</section></div></div></main>
}
