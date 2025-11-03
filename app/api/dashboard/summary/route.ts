import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { TaskStatus } from '@prisma/client'

// GET /api/dashboard/summary - ダッシュボードのサマリー情報を取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)

    // 今月のタスク統計
    const [
      completedTasks,
      inProgressTasks,
      overdueTasks,
      tasksDueToday,
      tasksDueThisWeek,
      totalTasks,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          status: TaskStatus.Completed,
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.task.count({
        where: {
          status: TaskStatus.InProgress,
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.task.count({
        where: {
          status: {
            not: TaskStatus.Completed,
          },
          dueDate: {
            lt: now,
          },
        },
      }),
      prisma.task.count({
        where: {
          status: {
            not: TaskStatus.Completed,
          },
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
          },
        },
      }),
      prisma.task.count({
        where: {
          status: {
            not: TaskStatus.Completed,
          },
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999),
          },
        },
      }),
      prisma.task.count({
        where: {
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ])

    // 予算実行率
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

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.totalBudget), 0)
    const totalSpent = budgets.reduce(
      (sum, b) =>
        sum +
        b.paymentPlans.reduce(
          (planSum, plan) =>
            planSum +
            plan.expenses.reduce((expSum, exp) => expSum + Number(exp.amount), 0),
          0
        ),
      0
    )
    const budgetExecutionRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // チーム統計
    const [totalMembers, activeMembers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          status: 'Active',
        },
      }),
    ])

    // 農家統計
    const [totalFarmers, farmersYear1, farmersYear2, farmersYear3] = await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.count({
        where: {
          yearGroup: 1,
        },
      }),
      prisma.farmer.count({
        where: {
          yearGroup: 2,
        },
      }),
      prisma.farmer.count({
        where: {
          yearGroup: 3,
        },
      }),
    ])

    // 今月のタスクリスト（優先度順、最大10件）
    const thisMonthTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // Critical, High, Medium, Low
        { dueDate: 'asc' },
      ],
      take: 10,
    })

    // 来月のプレビュー
    const nextMonthTasks = await prisma.task.count({
      where: {
        dueDate: {
          gte: startOfNextMonth,
          lte: endOfNextMonth,
        },
      },
    })

    const nextMonthTrainings = await prisma.training.count({
      where: {
        date: {
          gte: startOfNextMonth,
          lte: endOfNextMonth,
        },
      },
    })

    return successResponse({
      tasks: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        dueToday: tasksDueToday,
        dueThisWeek: tasksDueThisWeek,
        total: totalTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        thisMonthTasks,
      },
      budget: {
        totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent,
        executionRate: budgetExecutionRate,
      },
      team: {
        total: totalMembers,
        active: activeMembers,
      },
      farmers: {
        total: totalFarmers,
        year1: farmersYear1,
        year2: farmersYear2,
        year3: farmersYear3,
      },
      nextMonth: {
        tasks: nextMonthTasks,
        trainings: nextMonthTrainings,
      },
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

