import { Suspense } from 'react'
import type { Metadata } from 'next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Kirish' }

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Tizimga kirish</CardTitle>
        <CardDescription>
          Universitet tomonidan berilgan email va parol bilan kiring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
