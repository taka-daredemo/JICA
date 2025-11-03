'use client'

import React from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function ReportsPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">レポート</h1>
            <p className="mt-1 text-sm text-gray-600">
              プロジェクトレポートの生成とデータエクスポート
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Construction className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              実装中です
            </h2>
            <p className="text-gray-600 mb-4">
              レポートページは現在開発中です
            </p>
            <p className="text-sm text-gray-500">
              APIは実装済み: /api/reports/*
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

