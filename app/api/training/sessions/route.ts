import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { TrainingStatus } from '@prisma/client'

// GET /api/training/sessions - 研修セッション一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as TrainingStatus | null
    const facilitatorId = searchParams.get('facilitatorId')
    const month = searchParams.get('month') // YYYY-MM format
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (facilitatorId) {
      where.facilitatorId = facilitatorId
    }

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 0, 23, 59, 59)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (upcoming) {
      where.date = {
        gte: new Date(),
      }
      where.status = 'Upcoming'
    }

    const sessions = await prisma.training.findMany({
      where,
      include: {
        facilitator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // 出席率を計算
    const sessionsWithStats = sessions.map((session) => {
      const registeredCount = session._count.attendance
      const presentCount = 0 // TODO: Presentステータスのカウントを実装
      const attendanceRate =
        registeredCount > 0 && session.capacity
          ? (registeredCount / session.capacity) * 100
          : 0

      return {
        ...session,
        registeredCount,
        presentCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      }
    })

    return successResponse(sessionsWithStats)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/training/sessions - 研修セッション作成
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const {
      topic,
      description,
      date,
      location,
      facilitatorId,
      capacity,
      status,
    } = body

    if (!topic || !date) {
      return errorResponse('Topic and date are required', 400)
    }

    const newSession = await prisma.training.create({
      data: {
        topic,
        description,
        date: new Date(date),
        location,
        facilitatorId: facilitatorId || null,
        capacity: capacity ? parseInt(capacity) : null,
        status: status || 'Upcoming',
      },
      include: {
        facilitator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    return successResponse(newSession, 'Training session created successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

