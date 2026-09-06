import Link from 'next/link'
import type { Metadata } from 'next'
import { AudioLines, Bell, FlaskConical, Palette, ShieldCheck, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/page-header'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getUserDoc } from '@/features/shared/queries'
import { LeaderboardOptIn } from '@/features/gamification/leaderboard-optin'

import { DEFAULT_PREFERENCES, type StudentPreferences } from './preferences'
import { AudioCheck, PreferencesForm, ProfileForm } from './settings-forms'

export const metadata: Metadata = { title: 'Sozlamalar' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireStudent()
  const [doc, flags] = await Promise.all([getUserDoc(user.uid), resolveFlags(user)])

  const stored = (
    doc as (typeof doc & {
      preferences?: Partial<StudentPreferences>
      leaderboardOptIn?: boolean
    }) | null
  )?.preferences

  const preferences: StudentPreferences = {
    dailyGoalXp: stored?.dailyGoalXp ?? DEFAULT_PREFERENCES.dailyGoalXp,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(stored?.notifications ?? {}),
    },
  }

  const leaderboardOptIn = Boolean(
    (doc as (typeof doc & { leaderboardOptIn?: boolean }) | null)?.leaderboardOptIn
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sozlamalar"
        description="Profil, ko‘rinish, bildirishnomalar va tadqiqotdagi ishtirokingiz."
        breadcrumbs={[{ label: 'Bosh sahifa', href: '/student/dashboard' }, { label: 'Sozlamalar' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profil */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-muted-foreground" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileForm
              displayName={doc?.displayName ?? user.displayName}
              locale={doc?.locale ?? user.locale}
            />
            <Separator />
            <dl className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>Email</dt>
                <dd className="truncate">{user.email}</dd>
              </div>
              {doc?.university ? (
                <div className="flex justify-between gap-3">
                  <dt>Universitet</dt>
                  <dd className="truncate">{doc.university}</dd>
                </div>
              ) : null}
              {doc?.faculty ? (
                <div className="flex justify-between gap-3">
                  <dt>Fakultet</dt>
                  <dd className="truncate">{doc.faculty}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        {/* Ko'rinish */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4 text-muted-foreground" />
              Ko‘rinish
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Yorug‘ / qorong‘i rejim</p>
                <p className="text-xs text-muted-foreground">
                  Tanlov brauzeringizda saqlanadi va barcha sahifalarga qo‘llanadi.
                </p>
              </div>
              <ThemeToggle />
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm font-medium">Guruh reytingi</p>
              <LeaderboardOptIn optIn={leaderboardOptIn} />
            </div>
          </CardContent>
        </Card>

        {/* Bildirishnomalar va kunlik maqsad */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-muted-foreground" />
              Kunlik maqsad va bildirishnomalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PreferencesForm preferences={preferences} />
          </CardContent>
        </Card>

        {/* Audio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AudioLines className="size-4 text-muted-foreground" />
              Mikrofon tekshiruvi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AudioCheck />
          </CardContent>
        </Card>
      </div>

      {/* Tadqiqotdagi ishtirok */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="size-4 text-muted-foreground" />
            Tadqiqotdagi ishtirokim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Ishtirokchi kodi:</span>
            <Badge variant="secondary">{user.participantCode ?? 'berilmagan'}</Badge>
            {doc?.groupId ? <Badge variant="outline">Guruh biriktirilgan</Badge> : null}
          </div>

          <p className="leading-relaxed text-muted-foreground">
            Bu platforma dissertatsiya tadqiqoti doirasida ishlaydi. Sizning o‘quv faoliyatingiz
            (mashq natijalari, vaqt, xatolar taksonomiyasi, test ballari) ilmiy tahlil uchun
            yig‘iladi. Tahlil va nashrlarda ismingiz emas, faqat yuqoridagi{' '}
            <strong>ishtirokchi kodi</strong> ishlatiladi — ma’lumotlar shu tariqa
            psevdonimlashtiriladi.
          </p>

          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Yig‘iladigan ma’lumot: urinishlar, ballar, faollik vaqti, so‘rovnoma javoblari.</li>
            <li>
              Sizning guruhingizda AI imkoniyatlari{' '}
              {flags.aiTutor ? 'yoqilgan' : 'o‘chirilgan'} — bu tadqiqot dizaynining bir qismi.
            </li>
            <li>Ma’lumotlar uchinchi shaxslarga tijorat maqsadida berilmaydi.</li>
          </ul>

          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 font-medium">
              <ShieldCheck className="size-4 text-muted-foreground" />
              Ishtirokdan voz kechish huquqi
            </p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Siz istalgan vaqtda hech qanday sabab ko‘rsatmasdan tadqiqotdan chiqishingiz mumkin va
              bu sizning bahoyingizga yoki platformadan foydalanishingizga ta’sir qilmaydi. Voz
              kechish uchun tadqiqotchiga yozing — ma’lumotlaringiz tahlildan chiqariladi yoki
              butunlay o‘chiriladi.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/student/communication">Tadqiqotchiga yozish</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/privacy">Maxfiylik siyosati</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
