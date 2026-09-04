import ProjectManagement from '@/components/project-management'

type PageProps = { params: Promise<{ id: string }> }

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params
  return <ProjectManagement projectId={id || 'PRJ-2026-001'} />
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return { title: `${id || 'PRJ-2026-001'} | Jharkhand Innovation Portal`, description: 'Project lifecycle and collaboration workspace.' }
}
