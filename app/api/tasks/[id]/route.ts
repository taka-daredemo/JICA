import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { TaskStatus, TaskPriority } from '@prisma/client'

// GET /api/tasks/[id] - タスク詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const task = await prisma.task.findUnique({
      where: { id: params.id },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        parentTask: {
          select: {
            id: true,
            name: true,
          },
        },
        childTasks: {
          select: {
            id: true,
            name: true,
            status: true,
            dueDate: true,
          },
        },
      },
    })

    if (!task) {
      return notFoundResponse()
    }

    return successResponse(task)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// PUT /api/tasks/[id] - タスク更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const {
      name,
      description,
      assigneeId,
      dueDate,
      status,
      priority,
      isRecurring,
      recurringPattern,
    } = body

    // タスクの存在確認
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: { recurringPattern: true },
    })

    if (!existingTask) {
      return notFoundResponse()
    }

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (status !== undefined) updateData.status = status as TaskStatus
    if (priority !== undefined) updateData.priority = priority as TaskPriority
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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
      },
    })

    // 繰り返しパターンの更新
    if (recurringPattern !== undefined) {
      if (existingTask.recurringPattern) {
        await prisma.recurringPattern.update({
          where: { taskId: params.id },
          data: {
            pattern: recurringPattern.pattern,
            interval: recurringPattern.interval || 1,
            daysOfWeek: recurringPattern.daysOfWeek || [],
            endCondition: recurringPattern.endCondition || 'never',
            occurrences: recurringPattern.occurrences,
            endDate: recurringPattern.endDate ? new Date(recurringPattern.endDate) : null,
          },
        })
      } else if (recurringPattern && isRecurring) {
        await prisma.recurringPattern.create({
          data: {
            taskId: params.id,
            pattern: recurringPattern.pattern,
            interval: recurringPattern.interval || 1,
            daysOfWeek: recurringPattern.daysOfWeek || [],
            endCondition: recurringPattern.endCondition || 'never',
            occurrences: recurringPattern.occurrences,
            endDate: recurringPattern.endDate ? new Date(recurringPattern.endDate) : null,
          },
        })
      }
    }

    return successResponse(task, 'Task updated successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// DELETE /api/tasks/[id] - タスク削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return notFoundResponse()
    }

    await prisma.task.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Task deleted successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

