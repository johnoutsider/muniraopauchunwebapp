import type { Metadata } from 'next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResetForm } from './reset-form'

export const metadata: Metadata = { title: 'Parolni tiklash' }

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Parolni tiklash</CardTitle>
        <CardDescription>Emailingizga tiklash havolasini yuboramiz.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetForm />
      </CardContent>
    </Card>
  )
}
