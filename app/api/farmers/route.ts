import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/farmers - 農家一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const yearGroup = searchParams.get('yearGroup')
    const status = searchParams.get('status')
    const location = searchParams.get('location')
    const search = searchParams.get('search')

    const where: any = {}

    if (yearGroup) {
      where.yearGroup = parseInt(yearGroup)
    }

    if (status) {
      where.status = status
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { farmerCode: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const farmers = await prisma.farmer.findMany({
      where,
      include: {
        _count: {
          select: {
            attendance: true,
            incomeRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 収入変化率を計算
    const farmersWithIncomeChange = await Promise.all(
      farmers.map(async (farmer) => {
        if (!farmer.baselineIncome || Number(farmer.baselineIncome) === 0) {
          return {
            ...farmer,
            incomeChange: null,
            currentIncome: null,
            incomeChangePercent: null,
            meetsTarget: null,
          }
        }

        // 最新の収入記録を取得
        const latestIncome = await prisma.farmerIncomeRecord.findFirst({
          where: {
            farmerId: farmer.id,
            recordType: {
              in: ['Annual', 'Sale'],
            },
          },
          orderBy: {
            recordDate: 'desc',
          },
        })

        if (!latestIncome) {
          return {
            ...farmer,
            incomeChange: null,
            currentIncome: null,
            incomeChangePercent: null,
            meetsTarget: null,
          }
        }

        const baseline = Number(farmer.baselineIncome)
        const current = Number(latestIncome.incomeAmount)
        const change = current - baseline
        const changePercent = (change / baseline) * 100
        const meetsTarget = changePercent >= 10 // 目標は10%以上の増加

        return {
          ...farmer,
          incomeChange: change,
          currentIncome: current,
          incomeChangePercent: changePercent,
          meetsTarget,
        }
      })
    )

    return successResponse(farmersWithIncomeChange)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/farmers - 農家作成
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const {
      farmerCode,
      name,
      location,
      contactPhone,
      contactEmail,
      landSizeHectares,
      yearGroup,
      status,
      baselineIncome,
    } = body

    if (!farmerCode || !name) {
      return errorResponse('Farmer code and name are required', 400)
    }

    const newFarmer = await prisma.farmer.create({
      data: {
        farmerCode,
        name,
        location,
        contactPhone,
        contactEmail,
        landSizeHectares: landSizeHectares ? parseFloat(landSizeHectares) : null,
        yearGroup: yearGroup ? parseInt(yearGroup) : null,
        status: status || 'Active',
        baselineIncome: baselineIncome ? parseFloat(baselineIncome) : null,
      },
    })

    return successResponse(newFarmer, 'Farmer created successfully')
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('Farmer code already exists', 409)
    }
    return errorResponse(error as Error, 500)
  }
}

