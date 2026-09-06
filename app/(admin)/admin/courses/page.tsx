import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, GraduationCap, Layers, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { SKILL_LABELS, STAGE_META } from '@/config/constants'
import { requireUser } from '@/lib/firebase/session'
import { cn } from '@/lib/utils/cn'

import {
  CourseFormDialog,
  ModuleFormDialog,
  PublishToggle,
} from '@/features/admin/components/content-forms'
import { LessonEditorDialog } from '@/features/admin/components/lesson-editor-dialog'
import { listAdminCourses, listAdminLessons, listAdminModules } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Kurslar va darslar' }
export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; module?: string }>
}) {
  await requireUser(['admin'])
  const params = await searchParams

  const courses = await listAdminCourses()
  const courseId = params.course ?? courses[0]?.id ?? null
  const modules = courseId ? await listAdminModules(courseId) : []
  const moduleId = params.module ?? modules[0]?.id ?? null
  const lessons = moduleId ? await listAdminLessons(moduleId) : []

  const selectedCourse = courses.find((course) => course.id === courseId)
  const selectedModule = modules.find((item) => item.id === moduleId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kurslar, modullar va darslar"
        description="Kontent boshqaruvi: yaratish, tahrirlash, nashr qilish. Dars muharriri barcha blok turlarini qo‘llab-quvvatlaydi."
        actions={
          <CourseFormDialog
            nextOrder={courses.length}
            trigger={
              <Button>
                <Plus />
                Yangi kurs
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Kurslar" value={courses.length} icon={<BookOpen className="size-4" />} />
        <StatCard
          label="Modullar (tanlangan kursda)"
          value={modules.length}
          icon={<Layers className="size-4" />}
        />
        <StatCard
          label="Darslar (tanlangan modulda)"
          value={lessons.length}
          icon={<GraduationCap className="size-4" />}
        />
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Kurs yaratilmagan"
          description="Birinchi kursni yarating, so‘ng unga modul va darslar qo‘shing."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Kurslar</CardTitle>
              <CardDescription>Modullarini ko‘rish uchun kursni tanlang.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomi</TableHead>
                      <TableHead>CEFR</TableHead>
                      <TableHead className="text-right">Tartib</TableHead>
                      <TableHead className="text-center">Nashr</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow
                        key={course.id}
                        className={cn(course.id === courseId && 'bg-primary/5')}
                      >
                        <TableCell>
                          <Link
                            href={`/admin/courses?course=${course.id}`}
                            className="font-medium hover:underline"
                          >
                            {course.title}
                          </Link>
                          <p className="max-w-md truncate text-xs text-muted-foreground">
                            {course.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {course.cefrRange?.[0]}–{course.cefrRange?.[1]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{course.order}</TableCell>
                        <TableCell className="text-center">
                          <PublishToggle
                            collection="courses"
                            id={course.id}
                            published={course.published}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <CourseFormDialog
                            course={course}
                            nextOrder={course.order}
                            trigger={
                              <Button variant="ghost" size="sm">
                                Tahrirlash
                              </Button>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedCourse ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle>Modullar — {selectedCourse.title}</CardTitle>
                  <CardDescription>
                    Darslarini ko‘rish uchun modulni tanlang.
                  </CardDescription>
                </div>
                <ModuleFormDialog
                  courseId={selectedCourse.id}
                  nextOrder={modules.length}
                  trigger={
                    <Button variant="outline">
                      <Plus />
                      Yangi modul
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                {modules.length === 0 ? (
                  <EmptyState
                    icon={<Layers />}
                    title="Modul yo‘q"
                    description="Ushbu kursga birinchi modulni qo‘shing."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nomi</TableHead>
                          <TableHead>Bosqich</TableHead>
                          <TableHead>Ko‘nikma</TableHead>
                          <TableHead className="text-right">Tartib</TableHead>
                          <TableHead className="text-center">Nashr</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules.map((item) => (
                          <TableRow
                            key={item.id}
                            className={cn(item.id === moduleId && 'bg-primary/5')}
                          >
                            <TableCell>
                              <Link
                                href={`/admin/courses?course=${selectedCourse.id}&module=${item.id}`}
                                className="font-medium hover:underline"
                              >
                                {item.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.stage}. {STAGE_META[item.stage]?.uz}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {SKILL_LABELS[item.skill]?.uz ?? item.skill}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{item.order}</TableCell>
                            <TableCell className="text-center">
                              <PublishToggle
                                collection="modules"
                                id={item.id}
                                published={item.published}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <ModuleFormDialog
                                courseId={selectedCourse.id}
                                module={item}
                                nextOrder={item.order}
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    Tahrirlash
                                  </Button>
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {selectedModule && selectedCourse ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle>Darslar — {selectedModule.title}</CardTitle>
                  <CardDescription>
                    Dars muharriri: matn, video, infografika, grafik, lug‘at, grammatika, talaffuz,
                    mashqlar va AI tushuntirish bloklari.
                  </CardDescription>
                </div>
                <LessonEditorDialog
                  courseId={selectedCourse.id}
                  moduleId={selectedModule.id}
                  nextOrder={lessons.length}
                  trigger={
                    <Button variant="outline">
                      <Plus />
                      Yangi dars
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <EmptyState
                    icon={<GraduationCap />}
                    title="Dars yo‘q"
                    description="Ushbu modulga birinchi darsni qo‘shing."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sarlavha</TableHead>
                          <TableHead>Turi</TableHead>
                          <TableHead>CEFR</TableHead>
                          <TableHead className="text-right">Bloklar</TableHead>
                          <TableHead className="text-right">Daqiqa</TableHead>
                          <TableHead className="text-center">Nashr</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lessons.map((lesson) => (
                          <TableRow key={lesson.id}>
                            <TableCell className="font-medium">{lesson.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{lesson.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{lesson.cefr}</Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {lesson.blocks?.length ?? 0}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {lesson.estimatedMin}
                            </TableCell>
                            <TableCell className="text-center">
                              <PublishToggle
                                collection="lessons"
                                id={lesson.id}
                                published={lesson.published}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <LessonEditorDialog
                                courseId={selectedCourse.id}
                                moduleId={selectedModule.id}
                                lesson={lesson}
                                nextOrder={lesson.order}
                                trigger={
                                  <Button variant="ghost" size="sm">
                                    Tahrirlash
                                  </Button>
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
