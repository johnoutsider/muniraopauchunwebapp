import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize } from '@/lib/utils/format'
import { SemanticNetworkView } from '@/features/vocabulary/semantic-network-view'
import type { SemanticNetworkDoc } from '@/types'

export const metadata: Metadata = { title: 'Semantik tarmoq' }
export const dynamic = 'force-dynamic'

/**
 * AI Semantic Network Strategy (PLAN 8-bo'lim, 1-strategiya).
 * Tasdiqlangan tarmoq bo'lsa uni ko'rsatamiz, aks holda talaba AI'dan yangisini so'raydi.
 */
export default async function SemanticNetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ word?: string }>
}) {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const params = await searchParams
  const word = (params.word ?? 'inflation').slice(0, 80)

  let initialNetwork: {
    nodes: SemanticNetworkDoc['nodes']
    edges: SemanticNetworkDoc['edges']
    seedWord: string
  } | null = null

  try {
    const snap = await adminDb()
      .collection(COL.semanticNetworks)
      .where('seedWord', '==', word)
      .where('approved', '==', true)
      .limit(1)
      .get()

    const doc = snap.docs[0]?.data() as SemanticNetworkDoc | undefined
    if (doc) {
      initialNetwork = serialize({ nodes: doc.nodes, edges: doc.edges, seedWord: doc.seedWord })
    }
  } catch {
    // Indeks yoki ruxsat muammosi bo'lsa talaba baribir yangi tarmoq so'ray oladi
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semantik tarmoq"
        description="Kasbiy so'zlarni izolyatsiyada emas, ma'no bog'lanishlari tarmog'ida o'rganing."
        breadcrumbs={[
          { label: 'Mashqlar', href: '/student/practice' },
          { label: 'Lug‘at', href: '/student/practice/vocabulary' },
          { label: 'Semantik tarmoq' },
        ]}
      />

      <SemanticNetworkView
        initialWord={word}
        initialNetwork={initialNetwork}
        enabled={flags.semanticNetwork}
      />
    </div>
  )
}
