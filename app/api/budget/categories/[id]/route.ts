import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'

// GET /api/budget/categories/:id - 予算カテゴリー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const budget = await prisma.budget.findUnique({
      where: { id: params.id },
      include: {
        paymentPlans: {
          include: {
            expenses: true,
          },
        },
      },
    })

    if (!budget) {
      return notFoundResponse()
    }

    // 支出額を計算
    const totalSpent = budget.paymentPlans.reduce((sum, plan) => {
      const planSpent = plan.expenses.reduce(
        (expenseSum, expense) => expenseSum + Number(expense.amount),
        0
      )
      return sum + planSpent
    }, 0)

    const result = {
      ...budget,
      totalSpent,
      remaining: Number(budget.totalBudget) - totalSpent,
      executionRate: Number(budget.totalBudget) > 0 
        ? (totalSpent / Number(budget.totalBudget)) * 100 
        : 0,
    }

    return successResponse(result)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// PUT /api/budget/categories/:id - 予算カテゴリー更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const { name, totalBudget, fiscalYear } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (totalBudget !== undefined) updateData.totalBudget = parseFloat(totalBudget)
    if (fiscalYear !== undefined) updateData.fiscalYear = parseInt(fiscalYear)

    const budget = await prisma.budget.update({
      where: { id: params.id },
      data: updateData,
    })

    return successResponse(budget, 'Budget category updated successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// DELETE /api/budget/categories/:id - 予算カテゴリー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // 関連する支払い計画がある場合は削除できない
    const paymentPlansCount = await prisma.paymentPlan.count({
      where: { budgetId: params.id },
    })

    if (paymentPlansCount > 0) {
      return errorResponse(
        'Cannot delete budget category with existing payment plans',
        400
      )
    }

    await prisma.budget.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Budget category deleted successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

