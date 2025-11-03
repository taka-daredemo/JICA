import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'

// POST /api/training/sessions/[id]/register - 農家を研修セッションに登録
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // セッションの存在確認
    const session = await prisma.training.findUnique({
      where: { id: params.id },
    })

    if (!session) {
      return notFoundResponse()
    }

    // 定員チェック
    if (session.capacity) {
      const currentRegistrations = await prisma.trainingAttendance.count({
        where: {
          sessionId: params.id,
        },
      })

      if (currentRegistrations >= session.capacity) {
        return errorResponse('Training session is full', 400)
      }
    }

    const body = await request.json()
    const { farmerId } = body

    if (!farmerId) {
      return errorResponse('Farmer ID is required', 400)
    }

    // 既に登録されているかチェック
    const existing = await prisma.trainingAttendance.findUnique({
      where: {
        sessionId_farmerId: {
          sessionId: params.id,
          farmerId,
        },
      },
    })

    if (existing) {
      return errorResponse('Farmer is already registered for this session', 409)
    }

    // 農家の存在確認
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
    })

    if (!farmer) {
      return notFoundResponse()
    }

    // 登録
    const registration = await prisma.trainingAttendance.create({
      data: {
        sessionId: params.id,
        farmerId,
        status: 'Registered',
      },
      include: {
        farmer: {
          select: {
            id: true,
            farmerCode: true,
            name: true,
            location: true,
          },
        },
      },
    })

    return successResponse(registration, 'Farmer registered successfully')
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('Farmer is already registered for this session', 409)
    }
    return errorResponse(error as Error, 500)
  }
}

