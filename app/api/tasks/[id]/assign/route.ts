import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'

// POST /api/tasks/[id]/assign - タスクの割り当て/再割り当て
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const body = await request.json()
    const { assigneeId } = body

    // タスクの存在確認
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return notFoundResponse()
    }

    // 担当者の存在確認（assigneeIdが提供されている場合）
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      })

      if (!assignee) {
        return notFoundResponse()
      }
    }

    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        assigneeId: assigneeId || null,
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

    return successResponse(updatedTask, 'Task assigned successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    return errorResponse(error as Error, 500)
  }
}

