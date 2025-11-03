'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const languages = [
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = (params?.locale as string) || 'ja'

  const switchLanguage = (newLocale: string) => {
    if (!pathname) return
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPathname)
    router.refresh()
  }

  return (
    <div className="flex items-center space-x-2">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLocale === lang.code ? 'primary' : 'outline'}
          size="sm"
          onClick={() => switchLanguage(lang.code)}
          className="flex items-center space-x-1"
        >
          <span>{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </Button>
      ))}
    </div>
  )
}


