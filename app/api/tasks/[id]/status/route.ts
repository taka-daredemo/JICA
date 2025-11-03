import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { TaskStatus } from '@prisma/client'

// PUT /api/tasks/[id]/status - タスクのステータス更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const { status } = body

    if (!status) {
      return errorResponse('Status is required', 400)
    }

    // 有効なステータスかチェック
    const validStatuses = Object.values(TaskStatus)
    if (!validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
    }

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return notFoundResponse()
    }

    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: status as TaskStatus,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    return successResponse(updatedTask, 'Task status updated successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    return errorResponse(error as Error, 500)
  }
}

