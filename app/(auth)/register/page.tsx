import type { Metadata } from 'next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Ro‘yxatdan o‘tish' }

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Ro‘yxatdan o‘tish</CardTitle>
        <CardDescription>
          Talabalar odatda universitet ro‘yxati orqali qo‘shiladi. Agar sizga hisob berilmagan
          bo‘lsa, quyidagi shaklni to‘ldiring — administrator tasdiqlaydi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  )
}
