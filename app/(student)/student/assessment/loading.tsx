import { LoadingState } from '@/components/shared/loading-state'

export default function Loading() {
  return (
    <div className="space-y-6">
      <span className="sr-only">Baholash markazi yuklanmoqda…</span>
      <LoadingState rows={5} />
    </div>
  )
}
