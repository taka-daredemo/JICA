import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { PaymentStatus } from '@prisma/client'

// GET /api/payments/plans - 支払い計画一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as PaymentStatus | null
    const budgetId = searchParams.get('budgetId')
    const overdue = searchParams.get('overdue') === 'true'

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (budgetId) {
      where.budgetId = budgetId
    }

    if (overdue) {
      const now = new Date()
      where.dueDate = {
        lt: now,
      }
      where.status = {
        not: 'Paid',
      }
    }

    const plans = await prisma.paymentPlan.findMany({
      where,
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
        expenses: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    // 支払い済み額を計算
    const plansWithPaymentStatus = plans.map((plan) => {
      const paidAmount = plan.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      )
      const remainingAmount = Number(plan.amount) - paidAmount

      return {
        ...plan,
        paidAmount,
        remainingAmount,
        isFullyPaid: remainingAmount <= 0,
      }
    })

    return successResponse(plansWithPaymentStatus)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/payments/plans - 支払い計画作成
export async function POST(request: NextRequest) {
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
      status = 'Scheduled',
    } = body

    if (!planName || !amount || !dueDate) {
      return errorResponse('Plan name, amount, and due date are required', 400)
    }

    const plan = await prisma.paymentPlan.create({
      data: {
        planName,
        budgetId: budgetId || null,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description,
        vendor,
        status: status as PaymentStatus,
        createdById: user.id,
      },
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

    return successResponse(plan, 'Payment plan created successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

