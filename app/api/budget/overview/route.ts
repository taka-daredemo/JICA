import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/budget/overview - 予算概要取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const fiscalYear = searchParams.get('fiscalYear')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (fiscalYear) {
      where.fiscalYear = parseInt(fiscalYear)
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        paymentPlans: {
          include: {
            expenses: true,
          },
        },
      },
    })

    // 全体の予算・支出を計算
    const totalBudget = budgets.reduce(
      (sum, budget) => sum + Number(budget.totalBudget),
      0
    )

    const totalSpent = budgets.reduce((sum, budget) => {
      const budgetSpent = budget.paymentPlans.reduce((planSum, plan) => {
        const planSpent = plan.expenses.reduce(
          (expenseSum, expense) => expenseSum + Number(expense.amount),
          0
        )
        return planSum + planSpent
      }, 0)
      return sum + budgetSpent
    }, 0)

    // カテゴリー別の統計
    const categories = budgets.map((budget) => {
      const spent = budget.paymentPlans.reduce((sum, plan) => {
        return (
          sum +
          plan.expenses.reduce(
            (expenseSum, expense) => expenseSum + Number(expense.amount),
            0
          )
        )
      }, 0)

      return {
        id: budget.id,
        name: budget.name,
        totalBudget: Number(budget.totalBudget),
        spent,
        remaining: Number(budget.totalBudget) - spent,
        executionRate:
          Number(budget.totalBudget) > 0
            ? (spent / Number(budget.totalBudget)) * 100
            : 0,
      }
    })

    // 期間フィルターが指定されている場合は、支払い計画をフィルター
    let pendingPayments = 0
    let upcomingPayments = 0
    let overduePayments = 0

    const now = new Date()
    for (const budget of budgets) {
      for (const plan of budget.paymentPlans) {
        if (plan.status === 'Pending') {
          pendingPayments++
        } else if (plan.status === 'Scheduled') {
          const dueDate = new Date(plan.dueDate)
          if (dueDate < now) {
            overduePayments++
          } else if (dueDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
            // 30日以内
            upcomingPayments++
          }
        }
      }
    }

    const overview = {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      executionRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      categories,
      pendingPayments,
      upcomingPayments,
      overduePayments,
    }

    return successResponse(overview)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

