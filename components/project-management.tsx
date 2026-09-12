'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, Check, CheckCircle2, ChevronRight, Circle, FileText, Flag, MessageSquare, Paperclip, Send, Users, Wrench, X } from 'lucide-react'
import { getCollaborations, getProjectById, updateProjectStatus } from '@/lib/api'

type ProjectManagementProps = { projectId: string }

type ProjectRecord = {
  _id: string
  title: string
  description: string
  status: string
  projectType?: string
  solutionSummary?: string
  expectedImpact?: string
  estimatedBudget?: number
  challenge?: { _id?: string; title?: string; category?: string; district?: string; description?: string }
  university?: { _id?: string; name?: string; institution?: string; universityDepartment?: string }
  teamMembers?: Array<{ _id?: string; name?: string; universityDepartment?: string; accountType?: string; email?: string }>
  industryPartners?: Array<{ _id?: string; name?: string; organizationName?: string; organizationType?: string; expertise?: string }>
  timeline?: { startDate?: string; expectedCompletionDate?: string }
  createdAt?: string
}

type CollaborationRecord = {
  _id: string
  status: string
  proposal: string
  collaborationType: string
  fundingAmount?: number
  project?: { _id?: string; title?: string }
  industryPartner?: { _id?: string; name?: string; organizationName?: string; organizationType?: string; expertise?: string }
}

const stageLabels = ['proposed', 'approved', 'prototype', 'testing', 'deployed', 'completed']

function Card({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: React.ReactNode; action?: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2>
        </div>
        {action && <button className="hidden items-center gap-1 text-xs font-bold text-emerald-800 sm:flex">{action}<ArrowUpRight className="size-3.5" /></button>}
      </div>
      {children}
    </section>
  )
}

function Status({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'orange' | 'slate' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    slate: 'bg-slate-100 text-slate-600',
  }
  return <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>
}

function getStageLabel(status: string) {
  switch (status) {
    case 'proposed': return 'Proposed'
    case 'under_review': return 'Under review'
    case 'approved': return 'Approved'
    case 'prototype': return 'Prototype'
    case 'testing': return 'Testing'
    case 'deployed': return 'Deployed'
    case 'completed': return 'Completed'
    case 'rejected': return 'Rejected'
    default: return status || 'Draft'
  }
}

function formatDate(date?: string) {
  if (!date) return 'Date unavailable'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable'
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ProjectManagement({ projectId }: ProjectManagementProps) {
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [collaborations, setCollaborations] = useState<CollaborationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [message, setMessage] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const notify = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 1800)
  }

  useEffect(() => {
    async function loadProject() {
      const [projectResponse, collaborationResponse] = await Promise.all([
        getProjectById(projectId),
        getCollaborations(projectId),
      ])

      if (!projectResponse.success) {
        setError(projectResponse.message || 'Unable to load this project.')
        setLoading(false)
        return
      }

      setProject(projectResponse.data || null)
      setCollaborations(collaborationResponse.success ? collaborationResponse.data || [] : [])
      setLoading(false)
    }

    loadProject()
  }, [projectId])

  async function updateStatus(nextStatus: string) {
    if (!project || updatingStatus) return
    setUpdatingStatus(true)
    const response = await updateProjectStatus(project._id, nextStatus)
    setUpdatingStatus(false)

    if (!response.success) {
      notify(response.message || 'Status update failed')
      return
    }

    const refreshed = await getProjectById(projectId)
    if (refreshed.success) setProject(refreshed.data || null)
    notify('Project status updated')
  }

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 p-5 sm:p-8">
        <div className="mx-auto max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-bold text-slate-800">Loading project workspace...</p>
          <p className="mt-1 text-sm text-slate-500">Fetching the real project record and collaboration activity.</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-full bg-slate-50 p-5 sm:p-8">
        <div className="mx-auto max-w-[1450px] rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
          <p className="font-bold text-red-800">Unable to load project</p>
          <p className="mt-1 text-sm text-red-700">{error || 'Project not found.'}</p>
        </div>
      </div>
    )
  }

  const currentStatusIndex = Math.max(0, stageLabels.indexOf(project.status))
  const projectCompletion = Math.min(100, Math.max(18, ((currentStatusIndex + 1) / stageLabels.length) * 100))
  const projectStatusTone = project.status === 'completed' ? 'green' : project.status === 'testing' || project.status === 'prototype' ? 'orange' : 'slate'
  const teamMembers = project.teamMembers || []
  const industryPartners = project.industryPartners || []
  const milestoneRows = [
    { name: 'Project kickoff', date: formatDate(project.timeline?.startDate), status: 'Completed', progress: '100%' },
    { name: 'Solution approval', date: formatDate(project.createdAt), status: 'Completed', progress: '100%' },
    { name: 'Prototype / validation', date: formatDate(project.timeline?.expectedCompletionDate), status: project.status === 'testing' || project.status === 'deployed' || project.status === 'completed' ? 'In progress' : 'Upcoming', progress: project.status === 'prototype' ? '68%' : project.status === 'testing' ? '82%' : project.status === 'deployed' || project.status === 'completed' ? '100%' : '20%' },
  ]

  const readinessChecks = [
    ['Hardware safety review', project.status === 'prototype' || project.status === 'testing' || project.status === 'deployed' || project.status === 'completed'],
    ['Field partner confirmed', industryPartners.length > 0],
    ['Team capacity confirmed', teamMembers.length > 0],
    ['District permissions', project.status === 'deployed' || project.status === 'completed'],
    ['Impact baseline collected', project.status === 'testing' || project.status === 'deployed' || project.status === 'completed'],
  ]

  return (
    <main className="relative min-h-full min-w-0 bg-slate-50 p-5 sm:p-8">
      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg" role="status">{toast}</div>}
      <div className="mx-auto max-w-[1450px]">
        <button onClick={() => window.history.back()} className="mb-5 flex items-center gap-2 text-sm font-bold text-emerald-800"><ArrowLeft className="size-4" />Back to workspace</button>

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-700">{project._id.slice(0, 10)}</span>
              <Status tone={projectStatusTone}>{getStageLabel(project.status)}</Status>
            </div>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{project.title}</h1>
            <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-500">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <span>{project.challenge?.district || 'Jharkhand district'}</span>
              <span>{project.challenge?.category || project.projectType || 'Innovation'}</span>
              <span>{project.university?.institution || project.university?.name || 'University project'}</span>
              <span>Deadline: {formatDate(project.timeline?.expectedCompletionDate)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => notify('Project report exported')} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Export report</button>
            <button onClick={() => setShowComposer(true)} className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"><MessageSquare className="size-4" />Message team</button>
          </div>
        </div>

        <Card eyebrow="Project lifecycle" title="Delivery progress">
          <div className="grid gap-3 md:grid-cols-6">
            {stageLabels.map((stage, index) => {
              const isComplete = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex
              return (
                <div key={stage} className="relative flex items-center gap-3 md:block md:text-center">
                  <div className={`mx-0 grid size-9 shrink-0 place-items-center rounded-full md:mx-auto ${isComplete ? 'bg-emerald-800 text-white' : isCurrent ? 'bg-orange-500 text-white' : 'border-2 border-slate-200 bg-white text-slate-300'}`}>
                    {isComplete ? <Check className="size-4" /> : isCurrent ? <Wrench className="size-4" /> : <Circle className="size-3" />}
                  </div>
                  <p className={`text-xs md:mt-2 ${isCurrent ? 'font-bold text-orange-700' : isComplete ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>{getStageLabel(stage)}</p>
                  {index < stageLabels.length - 1 && <ChevronRight className="absolute right-1 hidden size-4 text-slate-300 md:block" />}
                </div>
              )
            })}
          </div>
          <div className="mt-6 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-700" style={{ width: `${projectCompletion}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400">
            <span>{Math.round(projectCompletion)}% complete</span>
            <span>Current stage: {getStageLabel(project.status)}</span>
          </div>
        </Card>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <Card eyebrow="Delivery plan" title="Milestones & deliverables" action="View project plan">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="pb-3">Milestone</th>
                    <th className="pb-3">Due date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {milestoneRows.map((row) => (
                    <tr key={row.name} className="border-b border-slate-50 last:border-0">
                      <td className="py-4 font-bold text-slate-800">{row.name}</td>
                      <td className="py-4 whitespace-nowrap text-slate-500">{row.date}</td>
                      <td className="py-4"><Status tone={row.status === 'In progress' ? 'orange' : 'green'}>{row.status}</Status></td>
                      <td className="py-4"><div className="flex items-center gap-2"><div className="h-2 w-16 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: row.progress }} /></div><span className="font-bold text-slate-600">{row.progress}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card eyebrow="People" title="Project team">
            <div className="space-y-3">
              {teamMembers.length ? teamMembers.map((member) => (
                <div key={member._id || member.email || member.name} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="grid size-9 place-items-center rounded-full bg-orange-50 text-orange-700"><Users className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{member.name || 'Team member'}</p>
                    <p className="text-xs text-slate-500">{member.accountType || 'University'} � {member.universityDepartment || 'Department unavailable'}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500">No team members have been assigned yet.</p>}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <Card eyebrow="Solution design" title="Proposal & prototype">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-white text-emerald-800"><FileText className="size-4" /></span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{project.title}</p>
                  <p className="text-xs text-slate-500">{project.projectType || 'Project'} � {project.challenge?.title || 'Challenge'}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{project.solutionSummary || project.description}</p>
              <button onClick={() => notify('Proposal opened')} className="mt-3 text-xs font-bold text-emerald-800">View proposal <ArrowUpRight className="inline size-3" /></button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Impact</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{project.expectedImpact || 'Not set yet'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Budget</p>
                <p className="mt-1 text-lg font-bold text-orange-700">{project.estimatedBudget ? `?${project.estimatedBudget}` : 'Unspecified'}</p>
              </div>
            </div>
          </Card>

          <Card eyebrow="Readiness" title="Delivery checklist">
            <div className="space-y-3">
              {readinessChecks.map(([label, done]) => (
                <div key={label as string} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className={`grid size-7 place-items-center rounded-full ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {done ? <CheckCircle2 className="size-4" /> : <Flag className="size-4" />}
                  </span>
                  <span className={`flex-1 text-sm font-semibold ${done ? 'text-slate-700' : 'text-slate-500'}`}>{label as string}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.8fr]">
          <Card eyebrow="Project communication" title="Recent updates" action="View all activity">
            <div className="space-y-5">
              {collaborations.length ? collaborations.slice(0, 3).map((item) => (
                <div key={item._id} className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-orange-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.collaborationType} support request</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.proposal}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.status}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500">No collaboration updates are available yet.</p>}
            </div>
          </Card>

          <Card eyebrow="Outcomes" title="Impact & budget">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['Project status', getStageLabel(project.status)],
                ['Budget', project.estimatedBudget ? `?${project.estimatedBudget}` : 'Unspecified'],
                ['Industry partners', String(industryPartners.length)],
                ['Team members', String(teamMembers.length)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Delivery progress</span>
                <span>{Math.round(projectCompletion)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${projectCompletion}%` }} /></div>
            </div>
          </Card>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Project controls</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Update project lifecycle</h2>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm font-semibold text-slate-700">Current phase</label>
            <select
              value={project.status}
              onChange={(event) => void updateStatus(event.target.value)}
              disabled={updatingStatus}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 sm:max-w-md"
            >
              <option value="proposed">Proposed</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="prototype">Prototype</option>
              <option value="testing">Testing</option>
              <option value="deployed">Deployed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {showComposer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="message-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Team communication</p>
                <h2 id="message-title" className="mt-1 text-xl font-bold text-slate-950">Message project team</h2>
              </div>
              <button onClick={() => setShowComposer(false)} aria-label="Close dialog"><X className="size-5 text-slate-500" /></button>
            </div>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write an update or question..." className="mt-6 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500" />
            <div className="mt-4 flex justify-between">
              <button onClick={() => notify('Attachment flow selected')} className="flex items-center gap-2 text-xs font-bold text-slate-500"><Paperclip className="size-4" />Attach file</button>
              <button onClick={() => { setShowComposer(false); setMessage(''); notify('Message sent to the team') }} disabled={!message.trim()} className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"><Send className="size-4" />Send message</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
