'use client'

import { Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** Chop etishga tayyor ko'rinish (`no-print` sinfidagi boshqaruvlar yashiriladi). */
export function PrintButton({ label = 'Chop etish' }: { label?: string }) {
  return (
    <Button type="button" variant="outline" className="no-print" onClick={() => window.print()}>
      <Printer />
      {label}
    </Button>
  )
}
