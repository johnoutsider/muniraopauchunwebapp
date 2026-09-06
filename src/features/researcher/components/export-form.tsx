'use client'

import * as React from 'react'
import { BookOpen, Download, FileSpreadsheet, FileText, Package, Table2 } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  generateExportAction,
  previewExportSchemaAction,
  type ExportFormat,
  type ExportedFile,
} from '../actions'
import {
  DATASET_LABELS,
  DATASET_ORDER,
  MEASURE_UZ,
  type DatasetKey,
  type DatasetSchemaPreview,
} from '../export-meta'

const FORMATS: Array<{ value: ExportFormat; label: string; hint: string; icon: React.ReactNode }> = [
  {
    value: 'xlsx',
    label: 'Excel (ko‘p varaqli)',
    hint: 'Bitta .xlsx fayl: har dataset alohida varaq va izoh varag‘i bilan.',
    icon: <FileSpreadsheet className="size-4" />,
  },
  {
    value: 'csv',
    label: 'CSV (UTF-8)',
    hint: 'Har dataset alohida .csv fayl. R, Python yoki Excel uchun.',
    icon: <FileText className="size-4" />,
  },
  {
    value: 'spss',
    label: 'SPSS paketi',
    hint: 'CSV fayllar + codebook.md + har dataset uchun .sps import sintaksisi.',
    icon: <Package className="size-4" />,
  },
]

export function ExportForm() {
  const [datasets, setDatasets] = React.useState<DatasetKey[]>(['participants'])
  const [format, setFormat] = React.useState<ExportFormat>('spss')
  const [pending, setPending] = React.useState(false)
  const [previewPending, setPreviewPending] = React.useState(false)
  const [preview, setPreview] = React.useState<{
    schema: DatasetSchemaPreview[]
    codebook: string
  } | null>(null)
  const [result, setResult] = React.useState<{
    files: ExportedFile[]
    expiresAt: string
    rows: number
  } | null>(null)

  function toggle(key: DatasetKey) {
    setDatasets((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    )
    setPreview(null)
  }

  async function loadPreview() {
    if (!datasets.length) {
      toast.error('Kamida bitta dataset tanlang')
      return
    }
    setPreviewPending(true)
    try {
      const response = await previewExportSchemaAction({ datasets })
      if (response.ok) {
        setPreview(response.data)
        toast.success('Sxema va kodlar kitobi tayyor')
      } else {
        toast.error(response.error)
      }
    } finally {
      setPreviewPending(false)
    }
  }

  async function generate() {
    if (!datasets.length) {
      toast.error('Kamida bitta dataset tanlang')
      return
    }
    setPending(true)
    setResult(null)
    try {
      const response = await generateExportAction({ datasets, format })
      if (response.ok) {
        setResult(response.data)
        toast.success(`${response.data.files.length} ta fayl tayyor (${response.data.rows} qator)`)
      } else {
        toast.error(response.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Datasetlarni tanlang</CardTitle>
          <CardDescription>
            Datasetlar PLAN.md 9.2-bo‘limiga mos. Barcha fayllarda faqat
            <span className="font-medium"> participantCode</span> bo‘ladi — uid, ism va email hech
            qachon eksport qilinmaydi. Rozilik bermagan yoki tadqiqotdan chiqqan ishtirokchilar
            avtomatik chiqarib tashlanadi.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {DATASET_ORDER.map((key) => (
            <label
              key={key}
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <Checkbox
                className="mt-0.5"
                checked={datasets.includes(key)}
                onCheckedChange={() => toggle(key)}
              />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-medium">{DATASET_LABELS[key].label}</span>
                <span className="block text-xs text-muted-foreground">
                  {DATASET_LABELS[key].description}
                </span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Format</CardTitle>
          <CardDescription>
            Dissertatsiya tahlili uchun «SPSS paketi» tavsiya etiladi — u kodlar kitobi va tayyor
            import sintaksisi bilan keladi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={format}
            onValueChange={(value) => setFormat(value as ExportFormat)}
            className="grid gap-3 sm:grid-cols-3"
          >
            {FORMATS.map((item) => (
              <label
                key={item.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm"
              >
                <RadioGroupItem value={item.value} className="mt-0.5" />
                <span className="space-y-1">
                  <span className="flex items-center gap-2 font-medium">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{item.hint}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" loading={previewPending} onClick={() => void loadPreview()}>
          <Table2 />
          Sxema va codebook’ni ko‘rish
        </Button>
        <Button type="button" loading={pending} onClick={() => void generate()}>
          <Download />
          Fayllarni yaratish
        </Button>
        <span className="text-xs text-muted-foreground">
          Fayllar Firebase Storage’ga yuklanadi; havola 60 daqiqa amal qiladi va audit jurnaliga
          yoziladi.
        </span>
      </div>

      {result ? (
        <Alert variant="success">
          <AlertTitle>Eksport tayyor</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Jami {result.rows} qator. Havolalar{' '}
              {new Date(result.expiresAt).toLocaleString('uz-UZ')} gacha amal qiladi.
            </p>
            <ul className="space-y-1">
              {result.files.map((file) => (
                <li key={file.name} className="flex flex-wrap items-center gap-2 text-sm">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    {file.name}
                  </a>
                  <Badge variant="outline">{Math.max(1, Math.round(file.size / 1024))} KB</Badge>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {preview ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="size-4 text-primary" />
                Ustunlar va o‘lchov darajalari
              </CardTitle>
              <CardDescription>
                Har o‘zgaruvchining SPSS o‘lchov darajasi (nominal / ordinal / scale) va qiymat
                yorliqlari. Qator sonlari haqiqiy ma’lumot bo‘yicha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={preview.schema[0]?.name}>
                <TabsList className="flex-wrap">
                  {preview.schema.map((dataset) => (
                    <TabsTrigger key={dataset.name} value={dataset.name}>
                      {dataset.name} ({dataset.rows})
                    </TabsTrigger>
                  ))}
                </TabsList>
                {preview.schema.map((dataset) => (
                  <TabsContent key={dataset.name} value={dataset.name} className="space-y-3">
                    <p className="text-sm text-muted-foreground">{dataset.description}</p>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>O‘zgaruvchi</TableHead>
                            <TableHead>Yorliq</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>O‘lchov darajasi</TableHead>
                            <TableHead>Qiymat yorliqlari</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dataset.columns.map((column) => (
                            <TableRow key={column.name}>
                              <TableCell className="font-mono text-xs">{column.name}</TableCell>
                              <TableCell className="text-sm">{column.label}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{column.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    column.measure === 'scale'
                                      ? 'info'
                                      : column.measure === 'ordinal'
                                        ? 'warning'
                                        : 'secondary'
                                  }
                                >
                                  {MEASURE_UZ[column.measure]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {column.values ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                Kodlar kitobi (codebook.md)
              </CardTitle>
              <CardDescription>
                SPSS paketiga shu fayl qo‘shiladi. Dissertatsiyaning ilova qismiga to‘g‘ridan
                to‘g‘ri kiritish mumkin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed">
                {preview.codebook}
              </pre>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
