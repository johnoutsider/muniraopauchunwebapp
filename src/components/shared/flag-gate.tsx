import * as React from 'react'

export interface FlagGateProps {
  enabled: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Feature flag darvozasi.
 * Nazorat guruhida AI elementlari UMUMAN render qilinmaydi (PLAN 1.5, 17-bo‘lim xavflar).
 */
export function FlagGate({ enabled, fallback = null, children }: FlagGateProps) {
  if (!enabled) return <>{fallback}</>
  return <>{children}</>
}
