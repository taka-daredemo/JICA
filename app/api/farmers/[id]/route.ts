import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'

// GET /api/farmers/[id] - 農家詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const farmer = await prisma.farmer.findUnique({
      where: { id: params.id },
      include: {
        attendance: {
          include: {
            session: {
              select: {
                id: true,
                topic: true,
                date: true,
                location: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        incomeRecords: {
          orderBy: {
            recordDate: 'desc',
          },
        },
      },
    })

    if (!farmer) {
      return notFoundResponse()
    }

    // 収入分析
    let incomeAnalysis = null
    if (farmer.baselineIncome && Number(farmer.baselineIncome) > 0) {
      const latestIncome = farmer.incomeRecords.find(
        (r) => r.recordType === 'Annual' || r.recordType === 'Sale'
      )

      if (latestIncome) {
        const baseline = Number(farmer.baselineIncome)
        const current = Number(latestIncome.incomeAmount)
        const change = current - baseline
        const changePercent = (change / baseline) * 100
        const meetsTarget = changePercent >= 10

        incomeAnalysis = {
          baseline,
          current,
          change,
          changePercent,
          meetsTarget,
          targetIncome: baseline * 1.1, // 10%増加目標
        }
      }
    }

    return successResponse({
      ...farmer,
      incomeAnalysis,
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// PUT /api/farmers/[id] - 農家更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updateData: any = {}

    if (farmerCode) updateData.farmerCode = farmerCode
    if (name) updateData.name = name
    if (location !== undefined) updateData.location = location
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail
    if (landSizeHectares !== undefined)
      updateData.landSizeHectares = landSizeHectares ? parseFloat(landSizeHectares) : null
    if (yearGroup !== undefined)
      updateData.yearGroup = yearGroup ? parseInt(yearGroup) : null
    if (status) updateData.status = status
    if (baselineIncome !== undefined)
      updateData.baselineIncome = baselineIncome ? parseFloat(baselineIncome) : null

    const updatedFarmer = await prisma.farmer.update({
      where: { id: params.id },
      data: updateData,
    })

    return successResponse(updatedFarmer, 'Farmer updated successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    if (error.code === 'P2002') {
      return errorResponse('Farmer code already exists', 409)
    }
    return errorResponse(error as Error, 500)
  }
}

// DELETE /api/farmers/[id] - 農家削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    await prisma.farmer.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Farmer deleted successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    return errorResponse(error as Error, 500)
  }
}

