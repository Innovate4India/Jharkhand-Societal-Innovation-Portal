'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, ClipboardCheck, Eye, FileSearch, Handshake, Map, MoreHorizontal, UserPlus, Users, Zap, X } from 'lucide-react'
import { approveChallengeFunding, assignChallenge, getChallenges, getCurrentUserFromStorage, getProjects, getUniversities, getUniversityParticipation, updateChallengePriority, updateChallengeStatus } from '@/lib/api'

type GovernmentChallenge = {
  _id: string
  title: string
  category: string
  district: string
  status: string
  priority: string
  fundingAmount?: number
  fundingStatus?: 'pending' | 'approved'
  createdAt?: string
  description?: string
  villageOrCity?: string
  submittedBy?: { name?: string; email?: string }
  assignedUniversity?: { name?: string; institution?: string }
  expectedImpact?: string
  suggestedSolution?: string
  peopleAffected?: string
  duration?: string
  location?: { latitude?: number | null; longitude?: number | null }
}

type University = {
  _id: string
  name: string
  email?: string
  institution?: string
  universityDepartment?: string
  accountType?: string
}

type UniversityParticipation = {
  universityId: string
  universityName: string
  assigned: number
  active: number
  completed: number
  status: 'Active' | 'Registered'
}
type GovernmentProject = Awaited<ReturnType<typeof getProjects>>['data'][number]

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Users }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p></div><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" /></span></div><p className="mt-4 text-xs font-semibold text-emerald-700">{note}</p></div>
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">{eyebrow}</p><h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2></div>{action && <button onClick={onAction} className="hidden items-center gap-1 text-xs font-bold text-emerald-800 sm:flex">{action}<ArrowUpRight className="size-3.5" /></button>}</div>
}

function UniversityParticipationModal({ universities, onClose }: { universities: UniversityParticipation[]; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="university-participation-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Institutional network</p><h2 id="university-participation-title" className="mt-1 text-xl font-bold text-slate-950">Registered universities</h2></div><button type="button" onClick={onClose} aria-label="Close universities"><X className="size-5 text-slate-500" /></button></div>{universities.length ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3">University name</th><th className="pb-3">Assigned</th><th className="pb-3">Active</th><th className="pb-3">Completed</th><th className="pb-3">Status</th></tr></thead><tbody>{universities.map((university) => <tr key={university.universityId} className="border-b border-slate-50 last:border-0"><td className="py-3 font-bold text-slate-700">{university.universityName}</td><td className="py-3 font-semibold text-slate-600">{university.assigned}</td><td className="py-3 font-semibold text-slate-600">{university.active}</td><td className="py-3 font-semibold text-slate-600">{university.completed}</td><td className="py-3"><span className={`rounded-full px-2 py-1 font-bold ${university.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{university.status}</span></td></tr>)}</tbody></table></div> : <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">No universities have registered on the platform yet.</p>}<button type="button" onClick={onClose} className="mt-6 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Close</button></div></div>
}

export default function GovernmentDashboard() {
  const [toast, setToast] = useState('')
  const [challenges, setChallenges] = useState<GovernmentChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [universities, setUniversities] = useState<University[]>([])
  const [universityLoading, setUniversityLoading] = useState(false)
  const [universityError, setUniversityError] = useState('')
  const [participation, setParticipation] = useState<UniversityParticipation[]>([])
  const [participationError, setParticipationError] = useState('')
  const [showUniversities, setShowUniversities] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [projects, setProjects] = useState<GovernmentProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState('')
  const [assignment, setAssignment] = useState<{ id: string; title: string } | null>(null)
    const [selectedChallenge, setSelectedChallenge] = useState<GovernmentChallenge | null>(null)
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [fundingChallenge, setFundingChallenge] = useState<{ id: string; title: string } | null>(null)
  const [fundingAmount, setFundingAmount] = useState('')
  const [fundingError, setFundingError] = useState('')
  const [fundingLoading, setFundingLoading] = useState(false)
  const canMutate = getCurrentUserFromStorage()?.role === 'government'
  const action = (label: string) => {
    if (label.startsWith('View ')) { setSelectedChallenge(challenges.find((challenge) => challenge._id === label.slice(5)) || null); return }
    if (label === 'Review Challenges') {
      document.getElementById('government-review-queue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (label === 'Assign University') {
      const challenge = challenges.find((item) => item.status === 'approved')
      if (challenge) void openAssignment(challenge._id, challenge.title)
      else { setToast('No verified challenge is ready for assignment'); window.setTimeout(() => setToast(''), 2200) }
      return
    }
    if (label === 'View Projects') {
      setShowProjects(true)
      setProjectsLoading(true)
      setProjectsError('')
      void getProjects().then((response) => {
        if (!response.success) setProjectsError(response.message || 'Unable to load projects.')
        else setProjects(response.data || [])
        setProjectsLoading(false)
      })
      return
    }
    if (label === 'View Analytics') { setShowAnalytics(true); return }
    setToast(`${label} selected`); window.setTimeout(() => setToast(''), 1800)
  }
  useEffect(() => {
    async function loadChallenges() {
      const [response, participationResponse] = await Promise.all([getChallenges(), getUniversityParticipation()])
      if (!response.success) {
        setError(response.message || 'Unable to load challenges. Please try again.')
      } else {
        setChallenges(response.data || [])
      }
      if (!participationResponse.success) setParticipationError(participationResponse.message || 'Unable to load university participation.')
      else setParticipation(participationResponse.data || [])
      setLoading(false)
    }
    loadChallenges()
  }, [])
  async function openAssignment(id: string, title: string) {
    if (!canMutate) return
    setAssignment({ id, title })
    setSelectedUniversity('')
    setUniversityError('')
    if (universities.length) return
    setUniversityLoading(true)
    const response = await getUniversities()
    if (!response.success) setUniversityError(response.message || 'Unable to load universities.')
    else setUniversities(response.data || [])
    setUniversityLoading(false)
  }
  async function confirmAssignment() {
    if (!assignment || !selectedUniversity || assigning) return
    setAssigning(true)
    setUniversityError('')
    const response = await assignChallenge(assignment.id, selectedUniversity)
    if (!response.success) {
      setUniversityError(response.message || 'Unable to assign challenge.')
      setAssigning(false)
      return
    }
    const refreshed = await getChallenges()
    if (refreshed.success) setChallenges(refreshed.data || [])
    setAssigning(false)
    setAssignment(null)
    action('Challenge assigned successfully')
  }
  async function changeStatus(id: string, status: string) {
    const response = await updateChallengeStatus(id, status)
    if (!response.success) { action(response.message || 'Status update failed'); return }
    action('Status updated')
    const refreshed = await getChallenges()
    if (refreshed.success) setChallenges(refreshed.data || [])
  }
  async function changePriority(id: string, priority: string) {
    const response = await updateChallengePriority(id, priority)
    if (!response.success) { action(response.message || 'Priority update failed'); return }
    action('Priority updated')
    const refreshed = await getChallenges()
    if (refreshed.success) setChallenges(refreshed.data || [])
  }
  async function approveFunding() {
    if (!fundingChallenge || fundingLoading) return
    const amount = Number(fundingAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setFundingError('Enter a positive funding amount.')
      return
    }
    setFundingLoading(true)
    setFundingError('')
    const response = await approveChallengeFunding(fundingChallenge.id, amount)
    if (!response.success) {
      setFundingError(response.message || 'Unable to approve funding.')
      setFundingLoading(false)
      return
    }
    const refreshed = await getChallenges()
    if (refreshed.success) setChallenges(refreshed.data || [])
    setFundingLoading(false)
    setFundingChallenge(null)
    setFundingAmount('')
    action('Government funding approved')
  }
  const statusSteps = [['Submitted', challenges.filter((item) => item.status === 'submitted').length, 'bg-slate-400'], ['Under Review', challenges.filter((item) => item.status === 'under_review').length, 'bg-amber-500'], ['Verified', challenges.filter((item) => item.status === 'approved').length, 'bg-sky-600'], ['University Assigned', challenges.filter((item) => item.status === 'assigned').length, 'bg-indigo-600'], ['Funding Approved', challenges.filter((item) => item.status === 'funding_approved').length, 'bg-emerald-600'], ['In Progress', challenges.filter((item) => item.status === 'in_progress').length, 'bg-orange-500'], ['Resolved', challenges.filter((item) => item.status === 'resolved').length, 'bg-emerald-700']]
  const domains = Array.from(new Set(challenges.map((item) => item.category))).map((domain) => [domain, challenges.filter((item) => item.category === domain).length])
  const districtCounts = Array.from(new Set(challenges.map((item) => item.district))).map((district) => [district, challenges.filter((item) => item.district === district).length])
  const attentionRows = challenges.map((item) => [item._id, item.title, item.district, `${item.category} · ${item.assignedUniversity?.institution || item.assignedUniversity?.name || 'Not assigned'}`, item.priority === 'critical' ? 'High' : item.priority.charAt(0).toUpperCase() + item.priority.slice(1), item.status.replace('_', ' '), item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable', item.status, item.priority, item.assignedUniversity?.institution || item.assignedUniversity?.name || 'Not assigned'])
  const activities: string[][] = []
  const pendingCount = challenges.filter((item) => item.status === 'submitted' || item.status === 'under_review').length
  const inProgressCount = challenges.filter((item) => item.status === 'in_progress').length
  const resolvedCount = challenges.filter((item) => item.status === 'resolved').length
  const universityCount = new Set(challenges.map((item) => item.assignedUniversity?.name || item.assignedUniversity?.institution).filter(Boolean)).size
  if (loading) return <div className="min-h-full bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-12 text-center"><p className="font-bold text-slate-800">Loading challenge data...</p><p className="mt-1 text-sm text-slate-500">Fetching the latest government overview.</p></div></div>
  if (error) return <div className="min-h-full bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-[1450px] rounded-2xl border border-red-200 bg-red-50 p-12 text-center"><p className="font-bold text-red-800">Unable to load challenge data</p><p className="mt-1 text-sm text-red-700">{error}</p></div></div>
  return <div className="relative min-h-full bg-slate-50 p-5 sm:p-8">
    {showUniversities && <UniversityParticipationModal universities={participation} onClose={() => setShowUniversities(false)} />}
    {toast && <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    <div className="mx-auto max-w-[1450px]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-medium text-slate-400">State monitoring overview</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Government Dashboard</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Monitor community challenges, institutional participation and social impact across Jharkhand.</p></div><button onClick={() => action('Export report')} className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><ArrowUpRight className="size-4" />Export report</button></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><StatCard label="Total Challenges" value={String(challenges.length)} note="From current API data" icon={ClipboardCheck} /><StatCard label="Pending Review" value={String(pendingCount)} note="Submitted or under review" icon={FileSearch} /><StatCard label="In Progress" value={String(inProgressCount)} note="Current API data" icon={Zap} /><StatCard label="Resolved" value={String(resolvedCount)} note="Current API data" icon={CheckCircle2} /><StatCard label="Universities Participating" value={String(universityCount)} note="From assigned challenges" icon={Users} /><StatCard label="Industry Partners" value="0" note="Not available in challenge API" icon={Handshake} /></div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Challenge pipeline" title="Challenge status overview" action="View all challenges" /><div className="flex flex-col gap-4">{statusSteps.map(([label, value, color], index) => <div key={label as string}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{label as string}</span><span className="font-bold text-slate-900">{value as number}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(16, Number(value) / 2.48)}%` }} /></div>{index < statusSteps.length - 1 && <div className="sr-only">Stage {index + 1} of {statusSteps.length}</div>}</div>)}</div><div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-emerald-700" />Resolved this year</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-orange-500" />Active pipeline</span></div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Where support is needed" title="Domain-wise challenges" /><div className="flex flex-col gap-3">{domains.map(([label, value]) => <div key={label as string} className="flex items-center gap-3"><span className="w-32 shrink-0 truncate text-xs font-medium text-slate-600 sm:w-40">{label as string}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${Number(value) / 58 * 100}%` }} /></div><span className="w-7 text-right text-xs font-bold text-slate-800">{value as number}</span></div>)}</div></section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="State geography" title="District-wise overview" action="View district data" /><div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60"><Map className="absolute size-40 text-emerald-800/10" /><div className="relative grid grid-cols-2 gap-2 sm:grid-cols-3">{districtCounts.slice(0, 9).map(([district, count]) => <div key={district as string} className="rounded-lg border border-white bg-white/80 px-3 py-2 shadow-sm"><p className="text-[10px] font-medium text-slate-500">{district as string}</p><p className="text-lg font-bold text-emerald-900">{count as number}</p></div>)}</div></div><p className="mt-3 text-xs text-slate-400">Challenge density calculated from current API data.</p></section>
        <section id="government-review-queue" className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Triage queue" title="Challenges requiring attention" action="Review queue" /><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3 pr-4">Challenge</th><th className="pb-3 pr-4">District</th><th className="pb-3 pr-4">Priority</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Submitted</th><th className="pb-3">Government actions</th></tr></thead><tbody>{attentionRows.map(row => { const challenge = challenges.find((item) => item._id === row[0]); const canVerify = canMutate && row[7] === 'under_review'; const canFund = canMutate && row[7] === 'assigned'; return <tr key={row[0]} className="border-b border-slate-50 last:border-0"><td className="py-3 pr-4"><p className="font-bold text-emerald-800">{row[0]}</p><p className="mt-1 max-w-52 font-semibold leading-4 text-slate-700">{row[1]}</p><p className="mt-1 text-slate-400">{row[3]}</p><p className="mt-1 text-slate-500">{challenge?.submittedBy?.name || 'Citizen submission'}</p></td><td className="py-3 pr-4 font-medium text-slate-600">{row[2]}</td><td className="py-3 pr-4"><select disabled={!canMutate} value={row[8]} onChange={(event) => changePriority(row[0], event.target.value)} className="rounded-full border-0 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></td><td className="py-3 pr-4"><select disabled={!canMutate} value={row[7]} onChange={(event) => changeStatus(row[0], event.target.value)} className="rounded-full border-0 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="assigned">Assigned</option><option value="funding_approved">Funding approved</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option></select></td><td className="py-3 pr-4 whitespace-nowrap text-slate-500">{row[6]}</td><td className="py-3"><button onClick={() => action(`View ${row[0]}`)} className="font-bold text-emerald-800 hover:underline">View</button>{canVerify && <button onClick={() => changeStatus(row[0], 'approved')} className="ml-3 font-bold text-sky-700 hover:underline">Verify</button>}{canMutate && row[7] === 'approved' && <button title="Select a university to assign this challenge" onClick={() => openAssignment(row[0], row[1])} className="ml-3 font-bold text-emerald-800 hover:underline">Assign</button>}{canFund && <button onClick={() => { setFundingChallenge({ id: row[0], title: row[1] }); setFundingError('') }} className="ml-3 font-bold text-emerald-800 hover:underline">Fund</button>}{challenge?.fundingStatus === 'approved' && <span className="ml-3 font-semibold text-emerald-700">₹{challenge.fundingAmount?.toLocaleString('en-IN')}</span>}</td></tr>})}</tbody></table></div></section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Institutional network" title="University participation" action="View universities" onAction={() => setShowUniversities(true)} />{participationError ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{participationError}</p> : participation.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3">University name</th><th className="pb-3">Assigned</th><th className="pb-3">Active</th><th className="pb-3">Completed</th><th className="pb-3">Status</th></tr></thead><tbody>{participation.map((university) => <tr key={university.universityId} className="border-b border-slate-50 last:border-0"><td className="py-3 font-bold text-slate-700">{university.universityName}</td><td className="py-3 font-semibold text-slate-600">{university.assigned}</td><td className="py-3 font-semibold text-slate-600">{university.active}</td><td className="py-3 font-semibold text-slate-600">{university.completed}</td><td className="py-3"><span className={`rounded-full px-2 py-1 font-bold ${university.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{university.status}</span></td></tr>)}</tbody></table></div> : <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">No universities have registered on the platform yet.</p>}</section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Private sector" title="Industry collaboration" /><div className="grid grid-cols-2 gap-3">{[['0', 'Total industry partners'], ['0', 'Active collaborations'], ['0', 'Projects supported'], ['0', 'Funding / support provided']].map(([value, label]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xl font-bold text-slate-950">{value}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{label}</p></div>)}</div><button onClick={() => action('View collaborations')} className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-800">Manage collaborations <ArrowUpRight className="size-3.5" /></button></section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Measured outcomes" title="Impact metrics" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{[['0', 'Solutions deployed'], ['0', 'Communities reached'], ['0', 'Students involved'], ['0', 'Faculty mentors'], ['0', 'Startups created'], ['0', 'Patents / IP generated']].map(([value, label]) => <div key={label} className="border-l-2 border-orange-300 px-4"><p className="text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{label}</p></div>)}</div></section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Platform pulse" title="Recent activity" /><div className="flex flex-col gap-5">{activities.map(([title, detail, time, color]) => <div key={title + detail} className="flex gap-3"><span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${color}`}><CheckCircle2 className="size-4" /></span><div className="min-w-0"><p className="text-sm font-bold text-slate-800">{title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p><p className="mt-1 text-[11px] text-slate-400">{time}</p></div></div>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6"><SectionTitle eyebrow="Administrator tools" title="Quick actions" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{[['Review Challenges', FileSearch], ['Assign University', UserPlus], ['View Projects', Eye], ['View Analytics', MoreHorizontal]].map(([label, Icon]) => <button key={label as string} onClick={() => label === 'View Projects' ? window.location.href = '/projects/PRJ-2026-001' : action(label as string)} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"><span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-slate-50 text-emerald-800"><Icon className="size-4" /></span>{label as string}</span><ArrowUpRight className="size-4 text-slate-400" /></button>)}</div></section>
      </div>
    </div>
    {assignment && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="assign-challenge-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Challenge assignment</p><h2 id="assign-challenge-title" className="mt-1 text-xl font-bold text-slate-950">Assign challenge</h2><p className="mt-2 text-sm text-slate-500">{assignment.title}</p></div><button type="button" onClick={() => setAssignment(null)} aria-label="Close dialog"><X className="size-5 text-slate-500" /></button></div>{universityLoading ? <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Loading registered universities...</p> : universityError ? <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{universityError}</p> : universities.length ? <><label className="mt-6 block text-sm font-semibold text-slate-700">University<select value={selectedUniversity} onChange={(event) => setSelectedUniversity(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Select a university</option>{universities.map((university) => <option key={university._id} value={university._id}>{university.institution || university.name} · {university.name}</option>)}</select></label><button type="button" disabled={!selectedUniversity || assigning} onClick={confirmAssignment} className="mt-6 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{assigning ? 'Assigning...' : 'Confirm assignment'}</button></> : <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No registered university users were found.</p>}</div></div>}
    {fundingChallenge && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Government funding</p><h2 className="mt-1 text-xl font-bold text-slate-950">Approve funding</h2><p className="mt-2 text-sm text-slate-500">{fundingChallenge.title}</p></div><button type="button" onClick={() => setFundingChallenge(null)} aria-label="Close dialog"><X className="size-5 text-slate-500" /></button></div><label className="mt-6 block text-sm font-semibold text-slate-700">Funding amount (INR)<input type="number" min="1" value={fundingAmount} onChange={(event) => setFundingAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>{fundingError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{fundingError}</p>}<button type="button" disabled={fundingLoading} onClick={approveFunding} className="mt-6 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{fundingLoading ? 'Approving...' : 'Approve government funding'}</button></div></div>}
    {selectedChallenge && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="challenge-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Challenge details</p><h2 id="challenge-details-title" className="mt-1 text-xl font-bold text-slate-950">{selectedChallenge.title || 'Not available'}</h2></div><button type="button" onClick={() => setSelectedChallenge(null)} aria-label="Close challenge details"><X className="size-5 text-slate-500" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{[['Description', selectedChallenge.description], ['Category', selectedChallenge.category], ['District', selectedChallenge.district], ['Village / City', selectedChallenge.villageOrCity], ['Priority', selectedChallenge.priority], ['Status', selectedChallenge.status], ['Expected impact', selectedChallenge.expectedImpact], ['Suggested solution', selectedChallenge.suggestedSolution], ['People affected', selectedChallenge.peopleAffected], ['Duration', selectedChallenge.duration], ['Submitted date', selectedChallenge.createdAt ? new Date(selectedChallenge.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined], ['Submitter name', selectedChallenge.submittedBy?.name], ['Submitter email', selectedChallenge.submittedBy?.email]].map(([label, value]) => <div key={label as string} className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label as string}</p><p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800">{value === undefined || value === null || value === '' ? 'Not available' : String(value)}</p></div>)}</div><button type="button" onClick={() => setSelectedChallenge(null)} className="mt-6 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Close</button></div></div>}
  </div>
}
