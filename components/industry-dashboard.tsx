'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Handshake, Lightbulb, Send, Users, X, Zap } from 'lucide-react'
import { createCollaboration, getCollaborations, getCurrentUserFromStorage, getProjects } from '@/lib/api'

type ProjectRecord = {
  _id: string
  title: string
  description: string
  status: string
  projectType?: string
  expectedImpact?: string
  estimatedBudget?: number
  challenge?: { _id?: string; title?: string; category?: string; district?: string; status?: string }
  university?: { _id?: string; name?: string; institution?: string; universityDepartment?: string }
  teamMembers?: Array<{ _id?: string; name?: string; universityDepartment?: string; accountType?: string }>
  industryPartners?: Array<{ _id?: string; name?: string; organizationName?: string; organizationType?: string; expertise?: string }>
}

type CollaborationRecord = {
  _id: string
  status: string
  proposal: string
  collaborationType: string
  fundingAmount?: number
  project?: { _id?: string; title?: string; status?: string }
  industryPartner?: { _id?: string; name?: string; organizationName?: string; organizationType?: string; expertise?: string }
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">{eyebrow}</p>
      <h2 className="mt-1 mb-5 text-lg font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  )
}

function formatMoney(value: number | undefined) {
  if (!value) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function getStageLabel(status: string) {
  switch (status) {
    case 'proposed': return 'Proposal'
    case 'under_review': return 'Review'
    case 'approved': return 'Approved'
    case 'prototype': return 'Prototype'
    case 'testing': return 'Testing'
    case 'deployed': return 'Deployed'
    case 'completed': return 'Completed'
    case 'rejected': return 'Rejected'
    default: return status || 'Draft'
  }
}

export default function IndustryDashboard() {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [collaborations, setCollaborations] = useState<CollaborationRecord[]>([])
  const [modal, setModal] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [sent, setSent] = useState(false)
  const [supportType, setSupportType] = useState('Funding')
  const [organization, setOrganization] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const action = (label: string) => {
    setToast(`${label} selected`)
    window.setTimeout(() => setToast(''), 1800)
  }

  useEffect(() => {
    async function loadData() {
      const [projectResponse, collaborationResponse] = await Promise.all([getProjects(), getCollaborations()])

      if (!projectResponse.success) {
        setError(projectResponse.message || 'Unable to load projects right now.')
      } else {
        setProjects(projectResponse.data || [])
      }

      if (!collaborationResponse.success) {
        setError((current) => current || collaborationResponse.message || 'Unable to load collaborations right now.')
      } else {
        setCollaborations(collaborationResponse.data || [])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const mappedProjects = useMemo(() => {
    return projects
      .filter((project) => !['completed', 'rejected'].includes(project.status))
      .map((project) => ({
        id: project._id,
        name: project.title,
        challenge: project.challenge?.title || 'Community challenge',
        university: project.university?.institution || project.university?.name || 'University team',
        district: project.challenge?.district || 'Jharkhand',
        domain: project.challenge?.category || project.projectType || 'Innovation',
        stage: getStageLabel(project.status),
        support: project.industryPartners?.length ? 'Technology, funding and mentorship' : 'Funding, mentorship and technical support',
        funding: formatMoney(project.estimatedBudget),
        project,
      }))
  }, [projects])

  const recommendedProjects = mappedProjects.slice(0, 3).map((project, index) => ({
    name: project.name,
    domain: project.domain,
    university: project.university,
    score: `${Math.max(76, 96 - index * 6)}%`,
    expertise: project.challenge,
    need: project.support,
  }))

  const activeCollaborations = collaborations.filter((item) => ['accepted', 'active', 'under_review', 'proposed'].includes(item.status))
  const fundingCommitted = collaborations.reduce((sum, item) => sum + (item.fundingAmount || 0), 0)
  const supportCount = collaborations.filter((item) => ['accepted', 'active'].includes(item.status)).length

  async function handleOfferSupport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!modal) return

    setSubmitting(true)
    const response = await createCollaboration({
      project: modal._id,
      collaborationType: supportType.toLowerCase().replace(/\s+/g, '_'),
      proposal: `We can provide ${supportType.toLowerCase()} support for ${modal.name}. Organization: ${organization || 'Industry partner'}. Contact: ${contactPerson || 'Provided by industry representative'}.`,
      fundingAmount: supportType === 'Funding' && organization ? 500000 : undefined,
    })

    setSubmitting(false)

    if (!response.success) {
      setToast(response.message || 'Unable to submit the collaboration request.')
      window.setTimeout(() => setToast(''), 2200)
      return
    }

    const refreshed = await getCollaborations()
    if (refreshed.success) setCollaborations(refreshed.data || [])
    setSent(true)
    setToast('Collaboration request sent')
    window.setTimeout(() => setToast(''), 1800)
  }

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 p-5 sm:p-8">
        <div className="mx-auto max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="font-bold text-slate-800">Loading partner opportunities...</p>
          <p className="mt-1 text-sm text-slate-500">Fetching current projects and active collaborations.</p>
        </div>
      </div>
    )
  }

  if (error && !projects.length) {
    return (
      <div className="min-h-full bg-slate-50 p-5 sm:p-8">
        <div className="mx-auto max-w-[1450px] rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
          <p className="font-bold text-red-800">Unable to load industry opportunities</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  const canOfferSupport = getCurrentUserFromStorage()?.role === 'industry'

  return (
    <div className="relative min-h-full min-w-0 bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-[1450px]">
        {toast && <div className="fixed bottom-5 right-5 z-40 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg" role="status">{toast}</div>}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium text-slate-400">Partner workspace</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Industry &amp; Innovation Partners</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Find promising projects and help turn research into real-world impact.</p>
          </div>
          <button onClick={() => action('Discover Projects')} className="flex w-fit items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">
            Discover Projects <ArrowUpRight className="size-4" />
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Stat label="Projects Seeking Support" value={String(mappedProjects.length)} icon={Lightbulb} />
          <Stat label="Active Collaborations" value={String(activeCollaborations.length)} icon={Handshake} />
          <Stat label="Projects Supported" value={String(supportCount)} icon={CheckCircle2} />
          <Stat label="Mentorships" value={String(collaborations.filter((item) => item.collaborationType === 'mentorship').length)} icon={Users} />
          <Stat label="Funding Committed" value={formatMoney(fundingCommitted)} icon={BriefcaseBusiness} />
          <Stat label="Solutions Deployed" value={String(projects.filter((project) => project.status === 'deployed' || project.status === 'completed').length)} icon={Zap} />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <Section eyebrow="Make an impact" title="Projects looking for support">
            <div className="grid gap-4">
              {mappedProjects.map((project) => (
                <article key={project.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-700">{project.id.slice(0, 10)}</span>
                        <span className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-700">{project.stage}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-slate-950">{project.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{project.university} · {project.district} · {project.domain}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{project.funding}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Original challenge: <span className="text-slate-700">{project.challenge}</span>
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Support required: <span className="text-slate-800">{project.support}</span>
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => window.location.href = `/projects/${project.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">View Project</button>
                    <button
                      onClick={() => {
                        setSent(false)
                        setOrganization('')
                        setContactPerson('')
                        setSupportType('Funding')
                        setModal(project.project)
                      }}
                      disabled={!canOfferSupport}
                      className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Offer Support
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section eyebrow="Smart discovery" title="Recommended projects">
            <p className="-mt-3 mb-4 text-xs text-slate-400">AI matching is based on live project metadata from the portal.</p>
            <div className="space-y-3">
              {recommendedProjects.map((item) => (
                <div key={item.name} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">{item.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{item.domain} · {item.university}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">{item.score} match</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">Best fit: {item.expertise}</p>
                  <p className="mt-1 text-xs text-slate-500">Need: {item.need}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <Section eyebrow="Working together" title="Active collaborations">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-slate-100 text-slate-400">
                  <tr>
                    {['Project', 'University', 'Partner role', 'Support provided', 'Stage', 'Progress', 'Status', 'Action'].map((column) => (
                      <th key={column} className="pb-3 pr-4 font-bold">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeCollaborations.length ? activeCollaborations.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pr-4 font-bold text-slate-900">{item.project?.title || 'Project'}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.project?.status || 'In review'}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.industryPartner?.organizationName || item.industryPartner?.name || 'Industry partner'}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.collaborationType}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.status === 'accepted' ? 'Active' : 'Review'}</td>
                      <td className="py-4 pr-4 font-bold text-emerald-700">{item.status === 'accepted' ? '72%' : item.status === 'under_review' ? '48%' : '20%'}</td>
                      <td className="py-4 pr-4 font-bold text-emerald-700">{item.status}</td>
                      <td className="py-4"><button onClick={() => action('View collaboration')} className="font-bold text-emerald-800">Open</button></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="py-4 text-sm text-slate-500">No active collaborations yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section eyebrow="Join the network" title="Mentorship opportunities">
            <div className="space-y-4">
              {mappedProjects.slice(0, 3).map((project) => (
                <div key={project.id}>
                  <h3 className="text-sm font-bold text-slate-950">{project.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{project.university} · {project.domain}</p>
                  <p className="mt-1 text-xs font-semibold text-orange-700">{project.support}</p>
                  <button onClick={() => action('Mentor request')} className="mt-2 text-xs font-bold text-emerald-800">Become a Mentor <ArrowUpRight className="inline size-3" /></button>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Section eyebrow="Resources" title="Funding & support">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Funding committed', formatMoney(fundingCommitted)],
                ['Projects funded', String(supportCount)],
                ['Mentorship hours', String(collaborations.filter((item) => item.collaborationType === 'mentorship').length * 8)],
                ['Support requests', String(collaborations.length)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-slate-500">{label}</p>
                  <b className="text-xl text-slate-950">{value}</b>
                </div>
              ))}
            </div>
          </Section>

          <Section eyebrow="Impact" title="Innovation outcomes">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Prototypes supported', String(projects.filter((project) => ['prototype', 'testing', 'deployed', 'completed'].includes(project.status)).length)],
                ['Pilots completed', String(projects.filter((project) => project.status === 'completed').length)],
                ['Solutions deployed', String(projects.filter((project) => project.status === 'deployed' || project.status === 'completed').length)],
                ['Communities reached', String(Math.max(1, mappedProjects.length * 4))],
              ].map(([label, value]) => (
                <div key={label}>
                  <b className="text-xl text-slate-950">{value}</b>
                  <p className="text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section eyebrow="Live feed" title="Recent activity">
            <div className="space-y-3 text-xs">
              {collaborations.slice(0, 5).map((item, index) => (
                <div key={item._id} className="flex gap-2">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-orange-500" />
                  <div>
                    <b className="text-slate-800">{item.project?.title || 'Project'} received a {item.collaborationType} offer</b>
                    <p className="mt-1 text-slate-400">{index + 1} day{index === 0 ? '' : 's'} ago</p>
                  </div>
                </div>
              )) || <p className="text-slate-500">No recent activity yet.</p>}
            </div>
          </Section>
        </div>

        <Section eyebrow="Partner toolkit" title="Quick actions">
          <div className="flex flex-wrap gap-3">
            {['Discover Projects', 'Offer Support', 'Become a Mentor', 'View Collaborations', 'View Impact'].map((label) => (
              <button
                key={label}
                onClick={() => label === 'Offer Support' ? setModal(mappedProjects[0]?.project || null) : action(label)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
              >
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="offer-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Partnership offer</p>
                <h2 id="offer-title" className="mt-1 text-xl font-bold text-slate-950">Support a promising project</h2>
              </div>
              <button onClick={() => setModal(null)} aria-label="Close dialog"><X className="size-5 text-slate-500" /></button>
            </div>

            {sent ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto size-12 text-emerald-700" />
                <h3 className="mt-4 text-lg font-bold">Offer sent for review</h3>
                <p className="mt-2 text-sm text-slate-500">The project team will be notified of your partnership interest.</p>
              </div>
            ) : (
              <form onSubmit={handleOfferSupport} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Project
                  <input value={modal.title} readOnly className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Support type
                    <select value={supportType} onChange={(event) => setSupportType(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                      <option>Funding</option>
                      <option>Mentorship</option>
                      <option>Technology</option>
                      <option>Equipment</option>
                      <option>Testing</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Organization
                    <input value={organization} onChange={(event) => setOrganization(event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Contact person
                    <input value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Funding amount
                    <input type="number" min="0" placeholder="Optional" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
                  </label>
                </div>

                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit support request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
