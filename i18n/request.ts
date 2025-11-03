import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// サポートする言語
export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ja'

export default getRequestConfig(async ({ locale }) => {
  // 対応していない言語の場合は404
  if (!locales.includes(locale as Locale)) notFound()

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})


