import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { TaskStatus, TaskPriority } from '@prisma/client'

// GET /api/tasks - タスク一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const assigneeId = searchParams.get('assigneeId')
    const status = searchParams.get('status') as TaskStatus | null
    const priority = searchParams.get('priority') as TaskPriority | null
    const month = searchParams.get('month') // YYYY-MM format
    const overdue = searchParams.get('overdue') === 'true'

    const where: any = {}

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 0, 23, 59, 59)
      where.dueDate = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (overdue) {
      where.dueDate = {
        lt: new Date(),
      }
      where.status = {
        not: 'Completed',
      }
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
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recurringPattern: true,
        _count: {
          select: {
            comments: true,
            childTasks: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
      ],
    })

    return successResponse(tasks)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/tasks - タスク作成
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const {
      name,
      description,
      assigneeId,
      dueDate,
      priority = 'Medium',
      isRecurring = false,
      recurringPattern,
    } = body

    if (!name || !dueDate) {
      return errorResponse('Name and dueDate are required', 400)
    }

    const taskData: any = {
      name,
      description,
      assigneeId: assigneeId || null,
      dueDate: new Date(dueDate),
      priority: priority as TaskPriority,
      isRecurring,
      createdById: user.id,
      status: 'NotStarted' as TaskStatus,
    }

    const task = await prisma.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // 繰り返しタスクの場合、RecurringPatternを作成
    if (isRecurring && recurringPattern) {
      await prisma.recurringPattern.create({
        data: {
          taskId: task.id,
          pattern: recurringPattern.pattern,
          interval: recurringPattern.interval || 1,
          daysOfWeek: recurringPattern.daysOfWeek || [],
          endCondition: recurringPattern.endCondition || 'never',
          occurrences: recurringPattern.occurrences,
          endDate: recurringPattern.endDate ? new Date(recurringPattern.endDate) : null,
        },
      })
    }

    return successResponse(task, 'Task created successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

