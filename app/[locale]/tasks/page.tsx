'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { MainLayout } from '@/components/layout/MainLayout'
import { Plus, Calendar, List, GanttChart, Filter } from 'lucide-react'

interface Task {
  id: string
  name: string
  description: string | null
  dueDate: string
  status: 'NotStarted' | 'InProgress' | 'Completed' | 'Overdue'
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  assignee: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  } | null
  createdAt: string
}

export default function TasksPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar' | 'gantt'>('list')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigneeId: '',
  })

  useEffect(() => {
    fetchTasks()
  }, [filters])

  async function fetchTasks() {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.priority) queryParams.append('priority', filters.priority)
      if (filters.assigneeId) queryParams.append('assigneeId', filters.assigneeId)

      const response = await fetch(`/api/tasks?${queryParams.toString()}`)
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        return
      }

      const data = await response.json()

      if (data.success) {
        setTasks(data.data || [])
      } else {
        console.error('API returned error:', data.message || 'Unknown error')
        setTasks([])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-700'
      case 'High':
        return 'bg-orange-100 text-orange-700'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">タスク管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              プロジェクトのタスクを管理・追跡します
            </p>
          </div>
          <Button onClick={() => router.push(`/${locale}/tasks/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            タスクを追加
          </Button>
        </div>

        {/* ビュー切り替えタブ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>タスク一覧</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('list')}
                >
                  <List className="mr-2 h-4 w-4" />
                  リスト
                </Button>
                <Button
                  variant={view === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('calendar')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  カレンダー
                </Button>
                <Button
                  variant={view === 'gantt' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('gantt')}
                >
                  <GanttChart className="mr-2 h-4 w-4" />
                  ガントチャート
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* フィルター */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">フィルター:</span>
              </div>
              <select
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">すべてのステータス</option>
                <option value="NotStarted">未開始</option>
                <option value="InProgress">進行中</option>
                <option value="Completed">完了</option>
                <option value="Overdue">期限切れ</option>
              </select>
              <select
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">すべての優先度</option>
                <option value="Critical">緊急</option>
                <option value="High">高</option>
                <option value="Medium">中</option>
                <option value="Low">低</option>
              </select>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-500">読み込み中...</div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 mb-2">
                  タスクがありません。新しいタスクを作成してください。
                </p>
                {(filters.status || filters.priority || filters.assigneeId) && (
                  <p className="text-sm text-gray-400 mt-2">
                    フィルターが適用されています。フィルターを解除してすべてのタスクを表示しますか？
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        タスク名
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        担当者
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        期限
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        ステータス
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        優先度
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{task.name}</div>
                            {task.description && (
                              <div className="mt-1 text-sm text-gray-500">
                                {task.description.substring(0, 50)}
                                {task.description.length > 50 && '...'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              {task.assignee.avatarUrl ? (
                                <img
                                  src={task.assignee.avatarUrl}
                                  alt={task.assignee.name}
                                  className="h-6 w-6 rounded-full"
                                />
                              ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                  {task.assignee.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm text-gray-700">
                                {task.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">未割り当て</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(task.dueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status === 'NotStarted' && '未開始'}
                            {task.status === 'InProgress' && '進行中'}
                            {task.status === 'Completed' && '完了'}
                            {task.status === 'Overdue' && '期限切れ'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority === 'Critical' && '緊急'}
                            {task.priority === 'High' && '高'}
                            {task.priority === 'Medium' && '中'}
                            {task.priority === 'Low' && '低'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/${locale}/tasks/${task.id}`)}
                          >
                            詳細
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

