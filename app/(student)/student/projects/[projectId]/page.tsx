import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { StageBadge } from '@/components/shared/stage-badge'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getProjectWorkspace } from '@/features/projects/queries'
import { ProjectWorkspace } from '@/features/projects/project-workspace'
import { getPeerState } from '@/features/peer/queries'
import { PeerReviewPanel } from '@/features/peer/peer-review-panel'

export const metadata: Metadata = { title: 'Loyiha ish zonasi' }
export const dynamic = 'force-dynamic'

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const user = await requireStudent()

  // A'zolik server tomonda tekshiriladi — a'zo bo'lmasa hujjat umuman qaytarilmaydi
  const data = await getProjectWorkspace(projectId, user.uid)
  if (!data) notFound()

  const flags = await resolveFlags(user)
  const showPeer = flags.peerAssessment && data.project.status !== 'active'

  const peerState = showPeer
    ? await getPeerState({
        artifactType: 'project',
        artifactId: data.project.id,
        uid: user.uid,
        teammates: (data.project.members ?? []).map((member) => ({
          uid: member.uid,
          name: member.name,
        })),
      })
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.project.title}
        description={data.caseStudy?.title ?? 'Keys-stadi biriktirilmagan'}
        breadcrumbs={[
          { label: 'Guruh loyihalari', href: '/student/projects' },
          { label: data.project.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StageBadge stage={7} />
            <Button asChild variant="outline" size="sm">
              <Link href="/student/projects">
                <ArrowLeft />
                Loyihalarim
              </Link>
            </Button>
          </div>
        }
      />

      <ProjectWorkspace
        data={data}
        me={{ uid: user.uid, displayName: user.displayName }}
        peerSlot={peerState ? <PeerReviewPanel state={peerState} /> : null}
      />
    </div>
  )
}
