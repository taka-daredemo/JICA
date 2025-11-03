import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n/request'

// next-intlのミドルウェアを作成
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export default async function middleware(request: NextRequest) {
  // 1. 言語ルーティングを処理
  const response = intlMiddleware(request)

  // 2. Supabaseの認証チェックは後で追加
  return response
}

export const config = {
  matcher: ['/', '/(ja|en)/:path*'],
}


