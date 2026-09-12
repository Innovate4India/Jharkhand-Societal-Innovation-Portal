'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, ClipboardList, Plus, UserRound, Wrench, X } from 'lucide-react'
import { acceptChallenge, downloadChallengeAttachment, getChallenges, getCollaborations, getCurrentUser, getCurrentUserFromStorage, getProjects, getUniversityMembers, updateCollaborationStatus, updateProjectStatus, updateProjectTeam } from '@/lib/api'
import { createProject } from '@/lib/api'
import { DashboardHero, DashboardStats } from '@/components/dashboard-shell'

const stages = ['Assigned Problem', 'Department', 'Faculty', 'Student Team', 'Work on Solution', 'Testing', 'Completed']

function Section({ eyebrow, title, children, action, onAction }: { eyebrow: string; title: string; children: React.ReactNode; action?: string; onAction?: () => void }) { return <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">{eyebrow}</p><h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2></div>{action && <button onClick={onAction} className="hidden items-center gap-1 text-xs font-bold text-emerald-800 sm:flex">{action}<ArrowUpRight className="size-3.5" /></button>}</div>{children}</section> }
function Pill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'orange' | 'red' }) { const tones = { slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-700', orange: 'bg-orange-50 text-orange-700', red: 'bg-red-50 text-red-700' }; return <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span> }

function ChallengeDetailsModal({ challenge, onClose }: { challenge: Awaited<ReturnType<typeof getChallenges>>['data'][number]; onClose: () => void }) {
  const details = challenge as typeof challenge & { expectedImpact?: string; suggestedSolution?: string; peopleAffected?: string; duration?: string }
  const fields: [string, unknown][] = [['Challenge Title', challenge.title], ['Description', challenge.description], ['Category', challenge.category], ['District', challenge.district], ['Village / City', challenge.villageOrCity], ['Priority', challenge.priority], ['Status', challenge.status], ['Expected Impact', details.expectedImpact], ['Suggested Solution', details.suggestedSolution], ['People Affected', details.peopleAffected], ['Duration', details.duration], ['Submitted Date', challenge.createdAt ? new Date(challenge.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined], ['Submitter Name', challenge.submittedBy?.name], ['Submitter Email', challenge.submittedBy?.email]]
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="university-challenge-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Challenge details</p><h2 id="university-challenge-details-title" className="mt-1 break-words text-xl font-bold text-slate-950">{challenge.title || 'Not available'}</h2></div><button type="button" onClick={onClose} aria-label="Close challenge details" className="shrink-0 rounded-lg p-2"><X className="size-5 text-slate-500" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-words whitespace-pre-wrap text-sm font-semibold text-slate-800">{value === undefined || value === null || value === '' ? 'Not available' : String(value)}</p></div>)}</div><div className="mt-6 rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Attachments</p>{challenge.attachments?.length ? <div className="mt-3 space-y-2">{challenge.attachments.map((attachment: { _id: string; originalName: string; size: number }) => <button key={attachment._id} type="button" onClick={() => void downloadChallengeAttachment(challenge._id, attachment._id, attachment.originalName)} className="flex w-full items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-50"><span className="min-w-0 break-words">{attachment.originalName}</span><span className="shrink-0 text-xs text-slate-500">{(attachment.size / 1024 / 1024).toFixed(2)} MB · Download</span></button>)}</div> : <p className="mt-2 text-sm text-slate-500">No attachments.</p>}</div><button type="button" onClick={onClose} className="mt-6 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Close</button></div></div>
}

function TeamEditor({ members, selection, saving, onToggle, onSave, onClose }: { members: NonNullable<Awaited<ReturnType<typeof getUniversityMembers>>['data']>; selection: string[]; saving: boolean; onToggle: (id: string, checked: boolean) => void; onSave: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="team-editor-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Collaboration network</p><h2 id="team-editor-title" className="mt-1 text-xl font-bold text-slate-950">Manage project team</h2></div><button type="button" onClick={onClose} aria-label="Close team editor"><X className="size-5 text-slate-500" /></button></div><p className="mt-4 text-sm text-slate-500">Select university members from your institution for this project.</p><div className="mt-5 space-y-2">{members.map((member) => <label key={member._id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"><input type="checkbox" checked={selection.includes(member._id)} onChange={(event) => onToggle(member._id, event.target.checked)} /><span><span className="block text-sm font-bold text-slate-800">{member.name}</span><span className="block text-xs text-slate-500">{member.accountType || 'university'} · {member.universityDepartment || 'Department unavailable'}</span></span></label>)}{!members.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No university members are available.</p>}</div><button type="button" disabled={saving} onClick={onSave} className="mt-6 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving team...' : 'Save team'}</button></div></div>
}

function ProfileModal({ user, onClose }: { user: { name?: string; email?: string; role?: string; accountType?: string; institution?: string; universityDepartment?: string }; onClose: () => void }) {
  const fields = [
    ['University / Institution', user.institution],
    ['Account role', user.role],
    ['Account type', user.accountType],
    ['Registered email', user.email],
    ['Department', user.universityDepartment],
  ]
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="university-profile-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Authenticated profile</p><h2 id="university-profile-title" className="mt-1 text-xl font-bold text-slate-950">My Profile</h2></div><button type="button" onClick={onClose} aria-label="Close profile"><X className="size-5 text-slate-500" /></button></div><p className="mt-4 text-sm text-slate-500">{user.name || 'University account'}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-slate-800">{value || 'Not available'}</p></div>)}</div><button type="button" onClick={onClose} className="mt-6 w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Close</button></div></div>
}

export default function UniversityDashboard() {
  const [toast, setToast] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [currentUser, setCurrentUser] = useState(getCurrentUserFromStorage())
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [projectForm, setProjectForm] = useState({ title: '', description: '', challenge: '', projectType: 'student_project', universityDepartment: '', facultyMentor: '', solutionSummary: '', expectedImpact: '', estimatedBudget: '', startDate: '', expectedCompletionDate: '' })
  const [challengeData, setChallengeData] = useState<Awaited<ReturnType<typeof getChallenges>>['data']>([])
  const [projectData, setProjectData] = useState<Awaited<ReturnType<typeof getProjects>>['data']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedChallenge, setSelectedChallenge] = useState<(Awaited<ReturnType<typeof getChallenges>>['data'] extends (infer Challenge)[] ? Challenge : never) | null>(null)
  const [updatingProjectStatus, setUpdatingProjectStatus] = useState(false)
  const [acceptingChallengeId, setAcceptingChallengeId] = useState('')
  const [collaborationData, setCollaborationData] = useState<Awaited<ReturnType<typeof getCollaborations>>['data']>([])
  const [universityMembers, setUniversityMembers] = useState<Awaited<ReturnType<typeof getUniversityMembers>>['data']>([])
  const [showTeamEditor, setShowTeamEditor] = useState(false)
  const [teamProjectId, setTeamProjectId] = useState('')
  const [teamSelection, setTeamSelection] = useState<string[]>([])
  const [savingTeam, setSavingTeam] = useState(false)
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1800) }
  const action = (label: string) => {
    if (label.startsWith('Accept ')) { void handleAcceptChallenge(label.slice(7)); return }
    if (label.startsWith('View ')) {
      const challenge = relevantChallenges.find((item) => item._id === label.slice(5))
      if (challenge) setSelectedChallenge(challenge)
      else showToast('No matching challenge found')
      return
    }
    showToast(`${label} is not available because the backend does not provide this workflow`)
  }
  useEffect(() => {
    async function loadDashboard() {
      const [challengeResponse, projectResponse, collaborationResponse, memberResponse] = await Promise.all([getChallenges(), getProjects(), getCollaborations(), getUniversityMembers()])
      if (!challengeResponse.success || !projectResponse.success || !collaborationResponse.success || !memberResponse.success) {
        setError(challengeResponse.message || projectResponse.message || 'Unable to load university data. Please try again.')
        setLoading(false)
        return
      }
      setChallengeData(challengeResponse.data || [])
      setProjectData(projectResponse.data || [])
      setCollaborationData(collaborationResponse.data || [])
      setUniversityMembers(memberResponse.data || [])
      setSelectedProjectId(projectResponse.data?.[0]?._id || '')
      const userResponse = await getCurrentUser()
      if (userResponse.success && userResponse.data?.user) setCurrentUser(userResponse.data.user)
      setLoading(false)
    }
    loadDashboard()
  }, [])
  const relevantChallenges = (challengeData || []).filter((challenge) => !currentUser?._id || challenge.assignedUniversity?._id === currentUser._id)
  const relevantProjects = (projectData || []).filter((project) => !currentUser?._id || project.university?._id === currentUser._id)
  const availableChallenges = (challengeData || []).filter((challenge) => currentUser?.role === 'university' && currentUser._id && challenge.assignedUniversity?._id === currentUser._id)
  const challenges = relevantChallenges.map((challenge) => [challenge._id, challenge.title, challenge.district, challenge.category, challenge.priority === 'high' || challenge.priority === 'critical' ? 'High' : challenge.priority === 'low' ? 'Low' : 'Medium', '—', challenge.description, challenge.status])
  const progressByStatus: Record<string, string> = { proposed: '57%', under_review: '57%', approved: '57%', prototype: '71%', testing: '86%', deployed: '95%', completed: '100%', rejected: '0%' }
  const projects = relevantProjects.map((project) => [project.title, project.challenge?.title || '—', project.teamMembers?.map((member) => member.name).filter(Boolean).join(', ') || project.createdBy?.name || '—', project.universityDepartment || '—', project.status, progressByStatus[project.status] || '0%', project.timeline?.expectedCompletionDate ? new Date(project.timeline.expectedCompletionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable', project._id])
  const teams = relevantProjects.filter((project) => (project.teamMembers || []).length > 0).map((project) => [project.title, `${project.teamMembers?.length || 0} members`, project.universityDepartment || 'University team', project.teamMembers?.map((member) => member.name).filter(Boolean).join(', ') || 'No members', `${project.teamMembers?.length || 0} members`, project.status === 'completed' ? 'Completed' : 'Active'])
  const mentors = universityMembers.filter((member) => member.accountType === 'faculty').slice(0, 4).map((member) => [member.name, member.universityDepartment || 'Faculty member', member.email || 'Contact unavailable', '0', 'Available'])
  const proposals = (collaborationData || []).map((collaboration) => [collaboration.proposal, collaboration.project?.title || 'Project', collaboration.industryPartner?.organizationName || collaboration.industryPartner?.name || 'Industry partner', collaboration.createdAt ? new Date(collaboration.createdAt).toLocaleDateString('en-GB') : 'Date unavailable', collaboration.status === 'accepted' ? 'Approved' : collaboration.status === 'rejected' ? 'Needs Revision' : collaboration.status, collaboration._id])
  const assignedCount = relevantChallenges.length
  const acceptedCount = relevantChallenges.filter((challenge) => ['approved', 'assigned', 'in_progress', 'resolved'].includes(challenge.status)).length
  const activeCount = relevantProjects.filter((project) => !['completed', 'rejected'].includes(project.status)).length
  const completedCount = relevantProjects.filter((project) => project.status === 'completed').length
  const studentCount = new Set(relevantProjects.flatMap((project) => (project.teamMembers || []).map((member) => member._id).filter(Boolean))).size
  const facultyCount = universityMembers.filter((member) => member.accountType === 'faculty').length
  async function saveTeam() {
    if (!teamProjectId || savingTeam) return
    setSavingTeam(true)
    const response = await updateProjectTeam(teamProjectId, teamSelection)
    if (!response.success) showToast(response.message || 'Unable to update team')
    else {
      const refreshed = await getProjects()
      if (refreshed.success) setProjectData(refreshed.data || [])
      setShowTeamEditor(false)
      showToast('Team updated successfully')
    }
    setSavingTeam(false)
  }
  async function reviewCollaboration(id: string, status: 'accepted' | 'rejected') {
    const response = await updateCollaborationStatus(id, status)
    if (!response.success) showToast(response.message || 'Unable to update collaboration')
    else {
      const refreshed = await getCollaborations()
      if (refreshed.success) setCollaborationData(refreshed.data || [])
      showToast(`Collaboration ${status}`)
    }
  }
  async function handleAcceptChallenge(id: string) {
    if (acceptingChallengeId) return
    const challenge = relevantChallenges.find((item) => item._id === id)
    if (!challenge || !currentUser?._id || currentUser.role !== 'university' || challenge.assignedUniversity?._id !== currentUser._id) {
      showToast('This challenge is not assigned to your university')
      return
    }
    setAcceptingChallengeId(id)
    const response = await acceptChallenge(id)
    if (!response.success) {
      showToast(response.message || 'Unable to accept challenge')
      setAcceptingChallengeId('')
      return
    }
    const refreshed = await getChallenges()
    if (refreshed.success) setChallengeData(refreshed.data || [])
    setAcceptingChallengeId('')
    showToast('Challenge accepted successfully')
  }
  const selectedProject = relevantProjects.find((project) => project._id === selectedProjectId) || relevantProjects[0]
  const lifecycleStatusIndex: Record<string, number> = { proposed: 4, under_review: 4, approved: 4, prototype: 4, testing: 5, deployed: 5, completed: 6, rejected: 0 }
  const currentLifecycleIndex = selectedProject ? lifecycleStatusIndex[selectedProject.status] ?? 0 : 0
  const lifecycleStatusByIndex = ['proposed', 'approved', 'approved', 'approved', 'prototype', 'testing', 'deployed']
  async function changeProjectStatus(status: string) {
    if (!selectedProject || updatingProjectStatus || !['prototype', 'testing', 'deployed', 'completed'].includes(status)) return
    setUpdatingProjectStatus(true)
    const response = await updateProjectStatus(selectedProject._id, status)
    if (!response.success) showToast(response.message || 'Project status update failed')
    else {
      const refreshed = await getProjects()
      if (refreshed.success) setProjectData(refreshed.data || [])
      showToast('Project status updated successfully')
    }
    setUpdatingProjectStatus(false)
  }
  async function submitProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProjectError('')
    if (!projectForm.challenge || !projectForm.title.trim() || !projectForm.description.trim() || !projectForm.universityDepartment.trim() || !projectForm.solutionSummary.trim() || !projectForm.expectedImpact.trim() || !projectForm.startDate || !projectForm.expectedCompletionDate) {
      setProjectError('Please complete all required fields and select an assigned challenge.')
      return
    }
    if (new Date(projectForm.expectedCompletionDate) <= new Date(projectForm.startDate)) {
      setProjectError('Expected completion date must be after the start date.')
      return
    }
    if (!availableChallenges.some((challenge) => challenge._id === projectForm.challenge)) {
      setProjectError('Please select a valid challenge assigned to this university.')
      return
    }
    setCreatingProject(true)
    const response = await createProject({
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      challenge: projectForm.challenge,
      universityDepartment: projectForm.universityDepartment.trim(),
      projectType: projectForm.projectType,
      ...(projectForm.facultyMentor ? { facultyMentor: projectForm.facultyMentor } : {}),
      solutionSummary: projectForm.solutionSummary.trim(),
      expectedImpact: projectForm.expectedImpact.trim(),
      ...(projectForm.estimatedBudget.trim() ? { estimatedBudget: Number(projectForm.estimatedBudget) } : {}),
      timeline: { startDate: projectForm.startDate, expectedCompletionDate: projectForm.expectedCompletionDate },
    })
    if (!response.success) {
      setProjectError(response.message || 'Unable to create project. Please try again.')
      setCreatingProject(false)
      return
    }
    const refreshed = await getProjects()
    if (refreshed.success) setProjectData(refreshed.data || [])
    setProjectForm({ title: '', description: '', challenge: '', projectType: 'student_project', universityDepartment: '', facultyMentor: '', solutionSummary: '', expectedImpact: '', estimatedBudget: '', startDate: '', expectedCompletionDate: '' })
    setCreatingProject(false)
    setShowCreateProject(false)
    showToast('Project created successfully')
  }
  if (loading) return <div className="min-h-full bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-[1450px] rounded-2xl border border-slate-200 bg-white p-12 text-center"><p className="font-bold text-slate-800">Loading university data...</p><p className="mt-1 text-sm text-slate-500">Fetching challenges and projects.</p></div></div>
  if (error) return <div className="min-h-full bg-slate-50 p-5 sm:p-8"><div className="mx-auto max-w-[1450px] rounded-2xl border border-red-200 bg-red-50 p-12 text-center"><p className="font-bold text-red-800">Unable to load university data</p><p className="mt-1 text-sm text-red-700">{error}</p></div></div>
  return <div className="mobile-role-dashboard relative min-h-full min-w-0 bg-slate-50 p-5 sm:p-8">{showTeamEditor && <TeamEditor members={universityMembers || []} selection={teamSelection} saving={savingTeam} onToggle={(id, checked) => setTeamSelection(checked ? [...teamSelection, id] : teamSelection.filter((selectedId) => selectedId !== id))} onSave={() => void saveTeam()} onClose={() => setShowTeamEditor(false)} />}{showProfile && currentUser && <ProfileModal user={currentUser} onClose={() => setShowProfile(false)} />}{toast && <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>}{selectedChallenge && <ChallengeDetailsModal challenge={selectedChallenge} onClose={() => setSelectedChallenge(null)} />}<div className="mx-auto max-w-[1450px]">{(!relevantChallenges.length || !relevantProjects.length) && <div className="mb-6 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">{!relevantChallenges.length && !relevantProjects.length ? 'No assigned challenges or projects are available for this university yet.' : !relevantChallenges.length ? 'No assigned challenges are available for this university yet.' : 'No projects are available for this university yet.'}</div>}
    <DashboardHero eyebrow="University dashboard" title="University innovation workspace" greeting="Good morning, University Team" subtitle="Here is what is happening with your assigned challenges and projects." actions={<button onClick={() => setShowProfile(true)} className="rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20">My profile</button>} />
    <div className="mt-6"><DashboardStats stats={[
      { label: 'Assigned challenges', value: String(assignedCount), note: 'From current API data', icon: ClipboardList },
      { label: 'Active projects', value: String(activeCount), note: 'From current API data', icon: Wrench },
      { label: 'Completed solutions', value: String(completedCount), note: 'Projects marked completed', icon: CheckCircle2 },
    ]} /></div>
    <div className="mt-8"><Section eyebrow="AI-powered recommendations" title="Assigned Challenges"><div className="grid gap-4 lg:grid-cols-3">{challenges.map(c => <article key={c[0]} className="rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-emerald-800">{c[0]}</span><div className="flex items-center gap-2"><Pill tone={c[4] === 'High' ? 'red' : 'orange'}>{c[4]} priority</Pill><Pill tone={c[7] === 'approved' ? 'green' : 'slate'}>{c[7].replace('_', ' ')}</Pill></div></div><h3 className="mt-4 text-base font-bold leading-6 text-slate-950">{c[1]}</h3><p className="mt-1 text-xs font-medium text-slate-500">{c[3]} · {c[2]}</p><p className="mt-3 text-sm leading-6 text-slate-600">{c[6]}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs font-bold text-emerald-700">AI Match: {c[5]}</span><div className="flex gap-2"><button onClick={() => action(`View ${c[0]}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">View Challenge</button><button disabled={c[7] !== 'under_review' && c[7] !== 'submitted' && c[7] !== 'assigned'} onClick={() => action(`Accept ${c[0]}`)} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{c[7] === 'approved' ? 'Accepted' : 'Accept'}</button></div></div></article>)}</div></Section></div>
    <div className="mt-6"><Section eyebrow="Delivery pipeline" title="My Active Projects" action="View all projects"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3">Project</th><th className="pb-3">Challenge</th><th className="pb-3">Team / Mentor</th><th className="pb-3">Stage</th><th className="pb-3">Progress</th><th className="pb-3">Deadline</th><th className="pb-3">Action</th></tr></thead><tbody>{projects.map(p => <tr key={p[7]} className="border-b border-slate-50 last:border-0"><td className="py-4 font-bold text-slate-800">{p[0]}</td><td className="py-4 font-semibold text-emerald-800">{p[1]}</td><td className="py-4"><p className="font-semibold text-slate-700">{p[2]}</p><p className="mt-1 text-slate-400">{p[3]}</p></td><td className="py-4"><Pill tone="orange">{p[4]}</Pill></td><td className="py-4"><div className="flex items-center gap-2"><div className="h-2 w-20 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: p[5] }} /></div><span className="font-bold text-slate-700">{p[5]}</span></div></td><td className="py-4 whitespace-nowrap text-slate-500">{p[6]}</td><td className="py-4"><button onClick={() => window.location.href = `/projects/${p[7]}`} className="font-bold text-emerald-800">Open</button></td></tr>)}</tbody></table></div></Section></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><Section eyebrow="Collaboration network" title="Team Management" action="View all teams"><div className="flex flex-col gap-3">{teams.map(t => <div key={t[0]} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="font-bold text-slate-800">{t[0]}</p><p className="mt-1 text-xs text-slate-500">{t[1]} · {t[2]}</p><p className="mt-2 text-xs text-slate-400">{t[3]}</p></div><div className="flex items-center gap-3 sm:flex-col sm:items-end"><Pill tone={t[5] === 'Active' ? 'green' : 'orange'}>{t[5]}</Pill><span className="text-xs font-semibold text-emerald-800">{t[4]}</span></div></div></div>)}<button onClick={() => setShowCreateProject(true)} className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="size-4" />Create Project</button></div></Section><Section eyebrow="People and expertise" title="Faculty Mentors"><div className="flex flex-col gap-3">{mentors.map(m => <div key={m[0]} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-700"><UserRound className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{m[0]}</p><p className="text-xs text-slate-500">{m[1]}</p><p className="mt-1 truncate text-xs text-slate-400">{m[2]} · {m[3]} projects</p></div><Pill tone={m[4] === 'Available' ? 'green' : 'orange'}>{m[4]}</Pill></div>)}<button onClick={() => action('Assign Mentor')} className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-800"><UserRound className="size-4" />Assign Mentor</button></div></Section></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><Section eyebrow="Review workspace" title="Solution Proposals"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-3">Proposal</th><th className="pb-3">Challenge / Team</th><th className="pb-3">Submitted</th><th className="pb-3">Status</th><th className="pb-3">Action</th></tr></thead><tbody>{proposals.map(p => <tr key={p[0]} className="border-b border-slate-50 last:border-0"><td className="py-4 font-bold text-slate-800">{p[0]}</td><td className="py-4"><p className="font-semibold text-emerald-800">{p[1]}</p><p className="mt-1 text-slate-500">{p[2]}</p></td><td className="py-4 whitespace-nowrap text-slate-500">{p[3]}</td><td className="py-4"><Pill tone={p[4] === 'Approved' ? 'green' : p[4] === 'Needs Revision' ? 'red' : 'orange'}>{p[4]}</Pill></td><td className="py-4"><button onClick={() => action(`Review ${p[0]}`)} className="font-bold text-emerald-800">Review</button></td></tr>)}</tbody></table></div></Section><Section eyebrow="Project lifecycle" title="Project Progress"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><select aria-label="Select project for lifecycle" disabled={!relevantProjects.length} value={selectedProject?._id || ''} onChange={(event) => setSelectedProjectId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 sm:max-w-md"><option value="">Select a project</option>{relevantProjects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}</select>{selectedProject && <select aria-label="Update project status" disabled={updatingProjectStatus} value={['prototype', 'testing', 'deployed', 'completed'].includes(selectedProject.status) ? selectedProject.status : ''} onChange={(event) => changeProjectStatus(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 sm:max-w-xs"><option value="">Current: {selectedProject.status.replace('_', ' ')}</option><option value="prototype">Prototype</option><option value="testing">Testing</option><option value="deployed">Deployed</option><option value="completed">Completed</option></select>}</div><div className="flex flex-col gap-1">{stages.map((stage, i) => <div key={stage} className="flex items-center gap-3"><div className={`grid size-7 shrink-0 place-items-center rounded-full ${i <= currentLifecycleIndex ? 'bg-emerald-800 text-white' : 'border-2 border-slate-200 bg-white text-slate-300'}`}>{i <= currentLifecycleIndex && i < 4 ? <CheckCircle2 className="size-4" /> : i === currentLifecycleIndex && i === 4 ? <Wrench className="size-4" /> : <span className="text-[10px] font-bold">{i + 1}</span>}</div><span className={`text-sm ${i === currentLifecycleIndex ? 'font-bold text-emerald-800' : i < currentLifecycleIndex ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>{stage}{i === currentLifecycleIndex && <span className="ml-2 text-[10px] uppercase tracking-wider text-orange-700">Current stage</span>}{i > currentLifecycleIndex && <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-400">Upcoming</span>}</span></div>)}</div>{selectedProject && <p className="mt-4 text-xs text-slate-500">Actual backend status: <span className="font-semibold text-slate-700">{selectedProject.status.replace('_', ' ')}</span></p>}</Section></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]"><Section eyebrow="Institutional capabilities" title="University Expertise Profile"><div className="grid gap-5 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Departments</p><ul className="mt-3 flex flex-col gap-2 text-sm font-semibold text-slate-700">{['Computer Science', 'Agriculture', 'Civil Engineering', 'Environmental Science', 'Management'].map(x => <li key={x}>{x}</li>)}</ul></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Research Areas</p><ul className="mt-3 flex flex-col gap-2 text-sm font-semibold text-slate-700">{['AI/ML', 'IoT', 'Water Management', 'Rural Development', 'Sustainable Agriculture'].map(x => <li key={x}>{x}</li>)}</ul></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Innovation Facilities</p><ul className="mt-3 flex flex-col gap-2 text-sm font-semibold text-slate-700">{['Innovation Centre', 'Incubation Centre', 'Research Laboratory', 'Prototyping Lab'].map(x => <li key={x}>{x}</li>)}</ul></div>    </div></Section></div>
  </div>{showCreateProject && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="create-project-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">Project workspace</p><h2 id="create-project-title" className="mt-1 text-xl font-bold text-slate-950">Create Project</h2></div><button type="button" onClick={() => { setShowCreateProject(false); setProjectError('') }} aria-label="Close dialog"><X className="size-5 text-slate-500" /></button></div>{projectError && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{projectError}</p>}{availableChallenges.length ? <form onSubmit={submitProject} className="mt-5 space-y-4"><label className="block text-sm font-semibold text-slate-700">Assigned challenge<select required value={projectForm.challenge} onChange={(event) => setProjectForm({ ...projectForm, challenge: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Select a challenge</option>{availableChallenges.map((challenge) => <option key={challenge._id} value={challenge._id}>{challenge.title} · {challenge.district}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Project title<input required value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-semibold text-slate-700">Project description<textarea required value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Project type<select required value={projectForm.projectType} onChange={(event) => setProjectForm({ ...projectForm, projectType: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="student_project">Student project</option><option value="faculty_research">Faculty research</option><option value="multidisciplinary_project">Multidisciplinary project</option><option value="startup_prototype">Startup prototype</option><option value="research_project">Research project</option></select></label><label className="block text-sm font-semibold text-slate-700">University department<input required value={projectForm.universityDepartment} onChange={(event) => setProjectForm({ ...projectForm, universityDepartment: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />  </label></div><label className="block text-sm font-semibold text-slate-700">Faculty mentor<select value={projectForm.facultyMentor} onChange={(event) => setProjectForm({ ...projectForm, facultyMentor: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Select a faculty mentor (optional)</option>{(universityMembers || []).filter((member) => member.accountType === 'faculty').map((member) => <option key={member._id} value={member._id}>{member.name} · {member.universityDepartment || 'Department unavailable'}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Solution summary<textarea required value={projectForm.solutionSummary} onChange={(event) => setProjectForm({ ...projectForm, solutionSummary: event.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-semibold text-slate-700">Expected impact<textarea required value={projectForm.expectedImpact} onChange={(event) => setProjectForm({ ...projectForm, expectedImpact: event.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><div className="grid gap-4 sm:grid-cols-3"><label className="block text-sm font-semibold text-slate-700">Budget<input type="number" min="0" value={projectForm.estimatedBudget} onChange={(event) => setProjectForm({ ...projectForm, estimatedBudget: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-semibold text-slate-700">Start date<input required type="date" value={projectForm.startDate} onChange={(event) => setProjectForm({ ...projectForm, startDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-semibold text-slate-700">End date<input required type="date" value={projectForm.expectedCompletionDate} onChange={(event) => setProjectForm({ ...projectForm, expectedCompletionDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label></div><button disabled={creatingProject} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{creatingProject ? 'Creating project...' : 'Create Project'}</button></form> : <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No challenges assigned to this university are available for project creation.</p>}</div></div>}</div>
}
