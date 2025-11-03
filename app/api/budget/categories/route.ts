import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/budget/categories - 予算カテゴリー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const fiscalYear = searchParams.get('fiscalYear')

    const where: any = {}
    if (fiscalYear) {
      where.fiscalYear = parseInt(fiscalYear)
    }

    const categories = await prisma.budget.findMany({
      where,
      include: {
        _count: {
          select: {
            paymentPlans: true,
          },
        },
      },
      orderBy: {
        fiscalYear: 'desc',
      },
    })

    return successResponse(categories)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/budget/categories - 予算カテゴリー作成
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const { name, totalBudget, fiscalYear } = body

    if (!name || !totalBudget || !fiscalYear) {
      return errorResponse('Name, totalBudget, and fiscalYear are required', 400)
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        totalBudget: parseFloat(totalBudget),
        fiscalYear: parseInt(fiscalYear),
      },
    })

    return successResponse(budget, 'Budget category created successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

