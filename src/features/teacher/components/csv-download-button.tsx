'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { exportAnalyticsCsvAction } from '../actions'

export interface CsvDownloadButtonProps {
  groupId: string
  table: 'students' | 'errors' | 'items'
  label?: string
}

/** Ko'rinib turgan jadvalni CSV sifatida yuklab olish (server action orqali). */
export function CsvDownloadButton({ groupId, table, label = 'CSV' }: CsvDownloadButtonProps) {
  const [pending, setPending] = React.useState(false)

  async function download() {
    setPending(true)
    try {
      const result = await exportAnalyticsCsvAction({ groupId, table })
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      // UTF-8 BOM — Excel o'zbekcha belgilarni to'g'ri o'qishi uchun
      const blob = new Blob([`﻿${result.data.csv}`], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.data.filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('CSV yuklab olindi')
    } finally {
      setPending(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" loading={pending} onClick={download}>
      <Download />
      {label}
    </Button>
  )
}
