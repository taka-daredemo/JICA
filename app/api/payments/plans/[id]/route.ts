import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { PaymentStatus } from '@prisma/client'

// GET /api/payments/plans/:id - 支払い計画詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const plan = await prisma.paymentPlan.findUnique({
      where: { id: params.id },
      include: {
        budget: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expenses: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    })

    if (!plan) {
      return notFoundResponse()
    }

    const paidAmount = plan.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    )

    const result = {
      ...plan,
      paidAmount,
      remainingAmount: Number(plan.amount) - paidAmount,
      isFullyPaid: paidAmount >= Number(plan.amount),
    }

    return successResponse(result)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// PUT /api/payments/plans/:id - 支払い計画更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const {
      planName,
      budgetId,
      amount,
      dueDate,
      description,
      vendor,
      status,
    } = body

    const updateData: any = {}
    if (planName) updateData.planName = planName
    if (budgetId !== undefined) updateData.budgetId = budgetId || null
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (description !== undefined) updateData.description = description
    if (vendor !== undefined) updateData.vendor = vendor
    if (status) updateData.status = status as PaymentStatus

    const plan = await prisma.paymentPlan.update({
      where: { id: params.id },
      data: updateData,
      include: {
        budget: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return successResponse(plan, 'Payment plan updated successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// DELETE /api/payments/plans/:id - 支払い計画削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // 関連する支払い記録がある場合は削除できない
    const expensesCount = await prisma.expense.count({
      where: { planId: params.id },
    })

    if (expensesCount > 0) {
      return errorResponse(
        'Cannot delete payment plan with existing expenses',
        400
      )
    }

    await prisma.paymentPlan.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Payment plan deleted successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

