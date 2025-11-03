import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/tasks/calendar - カレンダー表示用のタスク取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') // YYYY-MM format
    const assigneeId = searchParams.get('assigneeId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      startDate = new Date(year, monthNum - 1, 1)
      endDate = new Date(year, monthNum, 0, 23, 59, 59)
    } else {
      // デフォルト: 現在の月
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const where: any = {
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (status) {
      where.status = status
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

    // 日付ごとにグループ化
    const tasksByDate: Record<string, typeof tasks> = {}
    tasks.forEach((task) => {
      const dateKey = task.dueDate.toISOString().split('T')[0]
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = []
      }
      tasksByDate[dateKey].push(task)
    })

    return successResponse({
      month: month || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      startDate,
      endDate,
      tasks,
      tasksByDate,
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

