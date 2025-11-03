import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'

// GET /api/farmers/[id]/income - 農家の収入記録取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // 農家の存在確認
    const farmer = await prisma.farmer.findUnique({
      where: { id: params.id },
    })

    if (!farmer) {
      return notFoundResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const recordType = searchParams.get('recordType')
    const year = searchParams.get('year')

    const where: any = {
      farmerId: params.id,
    }

    if (recordType) {
      where.recordType = recordType
    }

    if (year) {
      const yearNum = parseInt(year)
      where.recordDate = {
        gte: new Date(yearNum, 0, 1),
        lt: new Date(yearNum + 1, 0, 1),
      }
    }

    const incomeRecords = await prisma.farmerIncomeRecord.findMany({
      where,
      orderBy: {
        recordDate: 'desc',
      },
    })

    // 収入分析
    let analysis = null
    if (farmer.baselineIncome && Number(farmer.baselineIncome) > 0) {
      const annualRecords = incomeRecords.filter((r) => r.recordType === 'Annual')
      const latestAnnual = annualRecords[0]

      if (latestAnnual) {
        const baseline = Number(farmer.baselineIncome)
        const current = Number(latestAnnual.incomeAmount)
        const change = current - baseline
        const changePercent = (change / baseline) * 100
        const meetsTarget = changePercent >= 10

        analysis = {
          baseline,
          current,
          change,
          changePercent,
          meetsTarget,
          targetIncome: baseline * 1.1,
          records: {
            annual: annualRecords.length,
            sale: incomeRecords.filter((r) => r.recordType === 'Sale').length,
            total: incomeRecords.length,
          },
        }
      }
    }

    return successResponse({
      records: incomeRecords,
      analysis,
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/farmers/[id]/income - 農家の収入記録作成
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // 農家の存在確認
    const farmer = await prisma.farmer.findUnique({
      where: { id: params.id },
    })

    if (!farmer) {
      return notFoundResponse()
    }

    const body = await request.json()
    const { recordDate, incomeAmount, recordType, notes } = body

    if (!recordDate || !incomeAmount || !recordType) {
      return errorResponse('Record date, income amount, and record type are required', 400)
    }

    const newRecord = await prisma.farmerIncomeRecord.create({
      data: {
        farmerId: params.id,
        recordDate: new Date(recordDate),
        incomeAmount: parseFloat(incomeAmount),
        recordType,
        notes,
      },
    })

    return successResponse(newRecord, 'Income record created successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

