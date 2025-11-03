import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { TrainingStatus } from '@prisma/client'

// GET /api/training/sessions/[id] - 研修セッション詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const session = await prisma.training.findUnique({
      where: { id: params.id },
      include: {
        facilitator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        attendance: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!session) {
      return notFoundResponse()
    }

    // 出席統計
    const registeredCount = session.attendance.length
    const presentCount = session.attendance.filter((a) => a.status === 'Present').length
    const absentCount = session.attendance.filter((a) => a.status === 'Absent').length
    const excusedCount = session.attendance.filter((a) => a.status === 'Excused').length
    const attendanceRate =
      registeredCount > 0 && session.capacity ? (presentCount / session.capacity) * 100 : 0

    return successResponse({
      ...session,
      statistics: {
        registered: registeredCount,
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        capacity: session.capacity,
        remainingCapacity: session.capacity
          ? session.capacity - registeredCount
          : null,
      },
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// PUT /api/training/sessions/[id] - 研修セッション更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updateData: any = {}

    if (topic) updateData.topic = topic
    if (description !== undefined) updateData.description = description
    if (date) updateData.date = new Date(date)
    if (location !== undefined) updateData.location = location
    if (facilitatorId !== undefined) updateData.facilitatorId = facilitatorId || null
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity) : null
    if (status) updateData.status = status as TrainingStatus

    const updatedSession = await prisma.training.update({
      where: { id: params.id },
      data: updateData,
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

    return successResponse(updatedSession, 'Training session updated successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    return errorResponse(error as Error, 500)
  }
}

// DELETE /api/training/sessions/[id] - 研修セッション削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    await prisma.training.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Training session deleted successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    return errorResponse(error as Error, 500)
  }
}

