import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/payments - 支払い記録一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const planId = searchParams.get('planId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (planId) {
      where.planId = planId
    }

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) {
        where.paymentDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate)
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        plan: {
          include: {
            budget: {
              select: {
                id: true,
                name: true,
              },
            },
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
      orderBy: {
        paymentDate: 'desc',
      },
    })

    return successResponse(expenses)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/payments - 支払い記録作成
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const {
      planId,
      amount,
      paymentDate,
      paymentMethod,
      vendor,
      description,
      receiptFilename,
      receiptUrl,
      notes,
    } = body

    if (!amount || !paymentDate) {
      return errorResponse('Amount and payment date are required', 400)
    }

    const expense = await prisma.expense.create({
      data: {
        planId: planId || null,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        paymentMethod,
        vendor,
        description,
        receiptFilename,
        receiptUrl,
        notes,
        createdById: user.id,
      },
      include: {
        plan: {
          include: {
            budget: {
              select: {
                id: true,
                name: true,
              },
            },
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

    // 支払い計画が指定されている場合、支払い済み額を確認してステータスを更新
    if (planId) {
      const plan = await prisma.paymentPlan.findUnique({
        where: { id: planId },
        include: {
          expenses: true,
        },
      })

      if (plan) {
        const totalPaid = plan.expenses.reduce(
          (sum, exp) => sum + Number(exp.amount),
          0
        )

        let newStatus = plan.status
        if (totalPaid >= Number(plan.amount)) {
          newStatus = 'Paid'
        } else if (totalPaid > 0) {
          newStatus = 'Pending'
        }

        if (newStatus !== plan.status) {
          await prisma.paymentPlan.update({
            where: { id: planId },
            data: { status: newStatus },
          })
        }
      }
    }

    return successResponse(expense, 'Payment recorded successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

