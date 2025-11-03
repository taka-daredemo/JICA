'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { format } from 'date-fns'

interface DashboardSummary {
  tasks: {
    completed: number
    inProgress: number
    overdue: number
    dueToday: number
    dueThisWeek: number
    total: number
    completionRate: number
    thisMonthTasks: Array<{
      id: string
      name: string
      dueDate: string
      status: string
      priority: string
      assignee: {
        id: string
        name: string
        email: string
        avatarUrl: string | null
      } | null
    }>
  }
  budget: {
    totalBudget: number
    spent: number
    remaining: number
    executionRate: number
  }
  team: {
    total: number
    active: number
  }
  farmers: {
    total: number
    year1: number
    year2: number
    year3: number
  }
  nextMonth: {
    tasks: number
    trainings: number
  }
}

interface Alert {
  type: 'task' | 'budget' | 'payment' | 'training'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  entityId?: string
  entityType?: string
}

export default function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter()
  const t = useTranslations()
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [alerts, setAlerts] = React.useState<Alert[]>([])
  const [dataLoading, setDataLoading] = React.useState(true)

  React.useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      if (user) {
        fetchDashboardData()
      }
    }
    getUser()
  }, [])

  async function fetchDashboardData() {
    try {
      setDataLoading(true)
      const [summaryRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard/summary'),
        fetch('/api/dashboard/alerts'),
      ])

      const summaryData = await summaryRes.json()
      const alertsData = await alertsRes.json()

      if (summaryData.success) {
        setSummary(summaryData.data)
      }
      if (alertsData.success) {
        setAlerts(alertsData.data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <span className="text-lg font-bold text-white">J</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                {t('common.projectName')}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email || 'Guest'}
              </span>
              <LanguageSwitcher />
              <Button variant="outline" onClick={handleLogout}>
                {t('dashboard.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h2>
          <p className="mt-2 text-gray-600">{t('dashboard.description')}</p>
        </div>

        {/* アラート表示 */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                }`}
              >
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('dashboard.stats.activeTasks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <p className="text-gray-400">{t('common.loading')}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary?.tasks.inProgress || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {summary?.tasks.dueThisWeek || 0} {t('dashboard.stats.thisWeek')}
                  </p>
                  {summary && summary.tasks.overdue > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      {summary.tasks.overdue} {t('dashboard.stats.overdue')}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('dashboard.stats.budgetUsage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <p className="text-gray-400">{t('common.loading')}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary ? Math.round(summary.budget.executionRate) : 0}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ¥{summary ? summary.budget.spent.toLocaleString() : 0} / ¥
                    {summary ? summary.budget.totalBudget.toLocaleString() : 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('dashboard.stats.teamMembers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <p className="text-gray-400">{t('common.loading')}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary?.team.total || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {summary?.team.active || 0} {t('dashboard.stats.active')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('dashboard.stats.targetFarmers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <p className="text-gray-400">{t('common.loading')}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {summary?.farmers.total || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('dashboard.stats.phase1')} ({summary?.farmers.year1 || 0})
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentTasks.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <p className="text-gray-400">{t('common.loading')}</p>
              ) : summary && summary.tasks.thisMonthTasks.length > 0 ? (
                <div className="space-y-4">
                  {summary.tasks.thisMonthTasks.slice(0, 5).map((task) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'Completed':
                          return 'bg-green-100 text-green-700'
                        case 'InProgress':
                          return 'bg-blue-100 text-blue-700'
                        case 'Overdue':
                          return 'bg-red-100 text-red-700'
                        default:
                          return 'bg-gray-100 text-gray-700'
                      }
                    }
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.name}</p>
                          <p className="text-sm text-gray-500">
                            {t('dashboard.recentTasks.deadline')}:{' '}
                            {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                            {task.assignee && ` • ${task.assignee.name}`}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500">{t('dashboard.recentTasks.noTasks')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.upcomingEvents.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <p className="text-gray-400">{t('common.loading')}</p>
              ) : (
                <div className="space-y-4">
                  {summary && summary.nextMonth.tasks > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {summary.nextMonth.tasks}
                        </p>
                        <p className="text-xs text-gray-500">{t('common.tasks')}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {t('dashboard.upcomingEvents.nextMonthTasks')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t('dashboard.upcomingEvents.nextMonth')}
                        </p>
                      </div>
                    </div>
                  )}
                  {summary && summary.nextMonth.trainings > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {summary.nextMonth.trainings}
                        </p>
                        <p className="text-xs text-gray-500">{t('common.trainings')}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {t('dashboard.upcomingEvents.nextMonthTrainings')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t('dashboard.upcomingEvents.nextMonth')}
                        </p>
                      </div>
                    </div>
                  )}
                  {(!summary ||
                    (summary.nextMonth.tasks === 0 && summary.nextMonth.trainings === 0)) && (
                    <p className="text-gray-500">{t('dashboard.upcomingEvents.noEvents')}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


