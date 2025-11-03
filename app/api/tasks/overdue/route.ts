import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { TaskStatus } from '@prisma/client'

// GET /api/tasks/overdue - 期限超過タスク一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const assigneeId = searchParams.get('assigneeId')
    const priority = searchParams.get('priority')

    const where: any = {
      status: {
        not: TaskStatus.Completed,
      },
      dueDate: {
        lt: new Date(),
      },
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (priority) {
      where.priority = priority
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        recurringPattern: true,
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'asc' },
      ],
    })

    // 超過日数を計算
    const tasksWithOverdueDays = tasks.map((task) => {
      const now = new Date()
      const overdueDays = Math.ceil((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...task,
        overdueDays,
      }
    })

    return successResponse(tasksWithOverdueDays)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

