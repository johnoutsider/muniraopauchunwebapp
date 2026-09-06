import { LoadingState } from '@/components/shared/loading-state'

export default function Loading() {
  return (
    <div className="space-y-6">
      <LoadingState rows={2} />
      <LoadingState rows={6} withHeader={false} />
    </div>
  )
}
