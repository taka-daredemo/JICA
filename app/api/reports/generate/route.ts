import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { TaskStatus } from '@prisma/client'

// GET /api/reports/generate - レポート生成
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'monthly' // monthly, quarterly, annual
    const format = searchParams.get('format') || 'json' // json, csv, pdf
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const year = searchParams.get('year')

    let reportStartDate: Date
    let reportEndDate: Date

    if (startDate && endDate) {
      reportStartDate = new Date(startDate)
      reportEndDate = new Date(endDate)
    } else if (year) {
      const yearNum = parseInt(year)
      if (type === 'annual') {
        reportStartDate = new Date(yearNum, 0, 1)
        reportEndDate = new Date(yearNum, 11, 31, 23, 59, 59)
      } else if (type === 'quarterly') {
        const quarter = searchParams.get('quarter') || '1'
        const quarterNum = parseInt(quarter)
        reportStartDate = new Date(yearNum, (quarterNum - 1) * 3, 1)
        reportEndDate = new Date(yearNum, quarterNum * 3, 0, 23, 59, 59)
      } else {
        // monthly
        const month = searchParams.get('month') || '1'
        const monthNum = parseInt(month)
        reportStartDate = new Date(yearNum, monthNum - 1, 1)
        reportEndDate = new Date(yearNum, monthNum, 0, 23, 59, 59)
      }
    } else {
      // デフォルト: 現在の月
      const now = new Date()
      reportStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
      reportEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // タスク統計
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          dueDate: {
            gte: reportStartDate,
            lte: reportEndDate,
          },
        },
      }),
      prisma.task.count({
        where: {
          status: TaskStatus.Completed,
          dueDate: {
            gte: reportStartDate,
            lte: reportEndDate,
          },
        },
      }),
      prisma.task.count({
        where: {
          status: TaskStatus.InProgress,
          dueDate: {
            gte: reportStartDate,
            lte: reportEndDate,
          },
        },
      }),
      prisma.task.count({
        where: {
          status: {
            not: TaskStatus.Completed,
          },
          dueDate: {
            lt: new Date(),
            gte: reportStartDate,
            lte: reportEndDate,
          },
        },
      }),
    ])

    // 予算統計
    const budgets = await prisma.budget.findMany({
      where: {
        fiscalYear: reportEndDate.getFullYear(),
      },
      include: {
        paymentPlans: {
          include: {
            expenses: {
              where: {
                paymentDate: {
                  gte: reportStartDate,
                  lte: reportEndDate,
                },
              },
            },
          },
        },
      },
    })

    const budgetSummary = budgets.map((budget) => {
      const spent = budget.paymentPlans.reduce(
        (sum, plan) =>
          sum + plan.expenses.reduce((expSum, exp) => expSum + Number(exp.amount), 0),
        0
      )
      const totalBudget = Number(budget.totalBudget)
      const executionRate = totalBudget > 0 ? (spent / totalBudget) * 100 : 0

      return {
        id: budget.id,
        name: budget.name,
        totalBudget,
        spent,
        remaining: totalBudget - spent,
        executionRate: Math.round(executionRate * 10) / 10,
      }
    })

    // 農家統計
    const [
      totalFarmers,
      farmersYear1,
      farmersYear2,
      farmersYear3,
    ] = await Promise.all([
      prisma.farmer.count(),
      prisma.farmer.count({ where: { yearGroup: 1 } }),
      prisma.farmer.count({ where: { yearGroup: 2 } }),
      prisma.farmer.count({ where: { yearGroup: 3 } }),
    ])

    // 収入目標達成率
    const farmers = await prisma.farmer.findMany({
      where: {
        baselineIncome: {
          gt: 0,
        },
      },
      include: {
        incomeRecords: {
          where: {
            recordType: {
              in: ['Annual', 'Sale'],
            },
            recordDate: {
              gte: reportStartDate,
              lte: reportEndDate,
            },
          },
          orderBy: {
            recordDate: 'desc',
          },
          take: 1,
        },
      },
    })

    const incomeAnalysis = farmers
      .map((farmer) => {
        const latestIncome = farmer.incomeRecords[0]
        if (!latestIncome || !farmer.baselineIncome) return null

        const baseline = Number(farmer.baselineIncome)
        const current = Number(latestIncome.incomeAmount)
        const changePercent = ((current - baseline) / baseline) * 100
        const meetsTarget = changePercent >= 10

        return {
          farmerId: farmer.id,
          farmerCode: farmer.farmerCode,
          name: farmer.name,
          baseline,
          current,
          changePercent: Math.round(changePercent * 10) / 10,
          meetsTarget,
        }
      })
      .filter((f) => f !== null)

    const targetAchievers = incomeAnalysis.filter((f) => f?.meetsTarget).length
    const targetRate =
      incomeAnalysis.length > 0 ? (targetAchievers / incomeAnalysis.length) * 100 : 0

    // 研修統計
    const [
      totalTrainings,
      completedTrainings,
      totalParticipants,
      avgAttendanceRate,
    ] = await Promise.all([
      prisma.training.count({
        where: {
          date: {
            gte: reportStartDate,
            lte: reportEndDate,
          },
        },
      }),
      prisma.training.count({
        where: {
          status: 'Completed',
          date: {
            gte: reportStartDate,
            lte: reportEndDate,
          },
        },
      }),
      prisma.trainingAttendance.count({
        where: {
          session: {
            date: {
              gte: reportStartDate,
              lte: reportEndDate,
            },
          },
        },
      }),
      // TODO: 出席率の平均を計算（複雑なため簡略化）
      0,
    ])

    const report = {
      period: {
        type,
        startDate: reportStartDate,
        endDate: reportEndDate,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10 : 0,
      },
      budget: {
        categories: budgetSummary,
        totalBudget: budgetSummary.reduce((sum, b) => sum + b.totalBudget, 0),
        totalSpent: budgetSummary.reduce((sum, b) => sum + b.spent, 0),
        totalRemaining: budgetSummary.reduce((sum, b) => sum + b.remaining, 0),
      },
      farmers: {
        total: totalFarmers,
        year1: farmersYear1,
        year2: farmersYear2,
        year3: farmersYear3,
        incomeAnalysis,
        targetAchievementRate: Math.round(targetRate * 10) / 10,
        targetAchievers,
        totalAnalyzed: incomeAnalysis.length,
      },
      training: {
        totalSessions: totalTrainings,
        completedSessions: completedTrainings,
        totalParticipants,
        avgAttendanceRate,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
    }

    // フォーマットに応じて返す
    if (format === 'json') {
      return successResponse(report)
    } else if (format === 'csv') {
      // TODO: CSV形式での出力を実装
      return errorResponse('CSV format not yet implemented', 501)
    } else if (format === 'pdf') {
      // TODO: PDF形式での出力を実装
      return errorResponse('PDF format not yet implemented', 501)
    } else {
      return successResponse(report)
    }
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

