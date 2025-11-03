import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { AttendanceStatus } from '@prisma/client'

// GET /api/training/sessions/[id]/attendance - 研修セッションの出席記録取得
export async function GET(
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

    const attendance = await prisma.trainingAttendance.findMany({
      where: {
        sessionId: params.id,
      },
      include: {
        farmer: {
          select: {
            id: true,
            farmerCode: true,
            name: true,
            location: true,
            contactPhone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // 統計情報
    const registeredCount = attendance.length
    const presentCount = attendance.filter((a) => a.status === 'Present').length
    const absentCount = attendance.filter((a) => a.status === 'Absent').length
    const excusedCount = attendance.filter((a) => a.status === 'Excused').length
    const attendanceRate =
      registeredCount > 0 && session.capacity
        ? (presentCount / session.capacity) * 100
        : 0

    return successResponse({
      session: {
        id: session.id,
        topic: session.topic,
        date: session.date,
        location: session.location,
        capacity: session.capacity,
      },
      attendance,
      statistics: {
        registered: registeredCount,
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      },
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// PUT /api/training/sessions/[id]/attendance - 出席記録の一括更新
export async function PUT(
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

    const body = await request.json()
    const { attendance } = body // [{ farmerId, status }, ...]

    if (!Array.isArray(attendance)) {
      return errorResponse('Attendance array is required', 400)
    }

    // 既存の出席記録を削除
    await prisma.trainingAttendance.deleteMany({
      where: {
        sessionId: params.id,
      },
    })

    // 新しい出席記録を作成
    if (attendance.length > 0) {
      await prisma.trainingAttendance.createMany({
        data: attendance.map((a: { farmerId: string; status: AttendanceStatus }) => ({
          sessionId: params.id,
          farmerId: a.farmerId,
          status: a.status || 'Registered',
        })),
      })
    }

    // 更新後の出席記録を取得
    const updatedAttendance = await prisma.trainingAttendance.findMany({
      where: {
        sessionId: params.id,
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

    return successResponse(updatedAttendance, 'Attendance updated successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

