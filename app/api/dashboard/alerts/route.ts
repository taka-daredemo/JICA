import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { TaskStatus } from '@prisma/client'

// GET /api/dashboard/alerts - ダッシュボードのアラート情報を取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const alerts: Array<{
      type: 'task' | 'budget' | 'payment' | 'training'
      severity: 'critical' | 'warning' | 'info'
      title: string
      message: string
      entityId?: string
      entityType?: string
    }> = []

    // 期限超過タスクのアラート
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: {
          not: TaskStatus.Completed,
        },
        dueDate: {
          lt: now,
        },
      },
      include: {
        assignee: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    })

    overdueTasks.forEach((task) => {
      alerts.push({
        type: 'task',
        severity: 'critical',
        title: '期限超過タスク',
        message: `「${task.name}」が期限を過ぎています${task.assignee ? `（担当: ${task.assignee.name}）` : ''}`,
        entityId: task.id,
        entityType: 'task',
      })
    })

    // 今日期限のタスクのアラート
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const tasksDueToday = await prisma.task.findMany({
      where: {
        status: {
          not: TaskStatus.Completed,
        },
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        assignee: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    })

    tasksDueToday.forEach((task) => {
      alerts.push({
        type: 'task',
        severity: 'warning',
        title: '今日期限のタスク',
        message: `「${task.name}」の期限は今日です${task.assignee ? `（担当: ${task.assignee.name}）` : ''}`,
        entityId: task.id,
        entityType: 'task',
      })
    })

    // 予算アラート（80%超過）
    const budgets = await prisma.budget.findMany({
      where: {
        fiscalYear: now.getFullYear(),
      },
      include: {
        paymentPlans: {
          include: {
            expenses: true,
          },
        },
      },
    })

    budgets.forEach((budget) => {
      const spent = budget.paymentPlans.reduce(
        (sum, plan) =>
          sum + plan.expenses.reduce((expSum, exp) => expSum + Number(exp.amount), 0),
        0
      )
      const executionRate = Number(budget.totalBudget) > 0 ? (spent / Number(budget.totalBudget)) * 100 : 0

      if (executionRate >= 90) {
        alerts.push({
          type: 'budget',
          severity: 'critical',
          title: '予算警告',
          message: `「${budget.name}」の予算実行率が${executionRate.toFixed(1)}%に達しています`,
          entityId: budget.id,
          entityType: 'budget',
        })
      } else if (executionRate >= 80) {
        alerts.push({
          type: 'budget',
          severity: 'warning',
          title: '予算注意',
          message: `「${budget.name}」の予算実行率が${executionRate.toFixed(1)}%になっています`,
          entityId: budget.id,
          entityType: 'budget',
        })
      }
    })

    // 支払い期限超過のアラート
    const overduePayments = await prisma.paymentPlan.findMany({
      where: {
        status: 'Overdue',
      },
      take: 5,
    })

    overduePayments.forEach((plan) => {
      alerts.push({
        type: 'payment',
        severity: 'critical',
        title: '支払い期限超過',
        message: `「${plan.planName}」（${Number(plan.amount).toLocaleString()}円）の支払いが期限を過ぎています`,
        entityId: plan.id,
        entityType: 'paymentPlan',
      })
    })

    // 今月の支払い予定のアラート
    const upcomingPayments = await prisma.paymentPlan.findMany({
      where: {
        status: {
          in: ['Scheduled', 'Pending'],
        },
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      take: 5,
    })

    upcomingPayments.forEach((plan) => {
      const daysUntilDue = Math.ceil((plan.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilDue <= 7) {
        alerts.push({
          type: 'payment',
          severity: daysUntilDue <= 3 ? 'warning' : 'info',
          title: '支払い予定',
          message: `「${plan.planName}」（${Number(plan.amount).toLocaleString()}円）が${daysUntilDue}日後に期限です`,
          entityId: plan.id,
          entityType: 'paymentPlan',
        })
      }
    })

    // 今月の研修セッションのアラート
    const upcomingTrainings = await prisma.training.findMany({
      where: {
        status: 'Upcoming',
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      take: 5,
    })

    upcomingTrainings.forEach((training) => {
      const daysUntilTraining = Math.ceil((training.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilTraining <= 7) {
        alerts.push({
          type: 'training',
          severity: daysUntilTraining <= 3 ? 'warning' : 'info',
          title: '研修セッション予定',
          message: `「${training.topic}」が${daysUntilTraining}日後に開催されます（登録: ${training._count.attendance}名）`,
          entityId: training.id,
          entityType: 'training',
        })
      }
    })

    // 重要度順にソート（critical > warning > info）
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return successResponse({
      alerts,
      count: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === 'critical').length,
      warningCount: alerts.filter((a) => a.severity === 'warning').length,
      infoCount: alerts.filter((a) => a.severity === 'info').length,
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

