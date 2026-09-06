import { LoadingState } from '@/components/shared/loading-state'

export default function Loading() {
  return (
    <div className="space-y-6">
      <span className="sr-only">Pre / Post test yuklanmoqda…</span>
      <LoadingState rows={4} />
    </div>
  )
}
