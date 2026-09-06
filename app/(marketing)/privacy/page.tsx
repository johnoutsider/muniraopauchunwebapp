import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Maxfiylik siyosati' }

const SECTIONS = [
  {
    title: 'Qanday ma‘lumot yig‘iladi',
    body: 'Ro‘yxatdan o‘tish ma‘lumotlari (F.I.Sh., email, universitet, guruh), o‘quv faoliyati (mashq javoblari, bajarish vaqti, xatolar), test natijalari, ovozli yozuvlar va yozma ishlar, AI bilan muloqot tarixi hamda so‘rovnoma javoblari.',
  },
  {
    title: 'Nima uchun',
    body: 'Ma‘lumotlar ikki maqsadda ishlatiladi: (1) sizga individual o‘quv yo‘nalishi va feedback berish; (2) anonimlashtirilgan holda DSc dissertatsiya tadqiqotida tahlil qilish.',
  },
  {
    title: 'Anonimlashtirish',
    body: 'Ilmiy tahlil va eksportlarda faqat ishtirokchi kodi (masalan E-042) ishlatiladi. Ism, email va telefon raqami eksport fayllariga umuman kirmaydi. Kod va shaxs o‘rtasidagi bog‘lanish faqat tadqiqotchining himoyalangan sahifasida saqlanadi.',
  },
  {
    title: 'Kim ko‘radi',
    body: 'Shaxsiy natijalarni siz va biriktirilgan o‘qituvchingiz ko‘radi. Tadqiqotchi umumlashtirilgan, anonim ma‘lumot bilan ishlaydi. Administrator texnik sozlamalarni boshqaradi.',
  },
  {
    title: 'Ovozli yozuvlar',
    body: 'Talaffuzni baholash uchun yozuvlar Firebase Storage‘da saqlanadi va faqat siz, o‘qituvchingiz hamda baholovchi xizmat uchun ochiq. Yozuvlar reklama yoki uchinchi tomon maqsadlarida ishlatilmaydi.',
  },
  {
    title: 'AI xizmatlari',
    body: 'Matnli tahlil uchun Claude API, talaffuz baholash uchun Azure Speech ishlatiladi. Ularga yuborilgan matn va audio faqat sizning topshirig‘ingizni baholash uchun xizmat qiladi; shaxsni aniqlovchi ma‘lumot yuborilmaydi.',
  },
  {
    title: 'Huquqlaringiz',
    body: 'Istalgan vaqtda tadqiqotdan chiqishingiz, ma‘lumotlaringizni eksportdan chiqarib tashlashni yoki o‘chirishni so‘rashingiz mumkin. Bu universitetdagi baholaringizga ta‘sir qilmaydi. Murojaat uchun o‘qituvchingizga yoki tadqiqot rahbariga yozing.',
  },
  {
    title: 'Saqlash muddati',
    body: 'Ma‘lumotlar tadqiqot yakunlanib, natijalar himoya qilinganidan keyin 3 yil davomida saqlanadi, so‘ng o‘chiriladi yoki to‘liq anonimlashtiriladi.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight">Maxfiylik siyosati</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ushbu platforma ilmiy tadqiqot maqsadida ishlab chiqilgan. Quyida qanday ma‘lumot yig‘ilishi
        va u qanday himoyalanishi tushuntirilgan.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
