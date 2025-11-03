import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'

// GET /api/tasks/[id]/comments - コメント一覧取得
export async function GET(
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

    const comments = await prisma.taskComment.findMany({
      where: { taskId: params.id },
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
    })

    return successResponse(comments)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/tasks/[id]/comments - コメント作成
export async function POST(
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

    const body = await request.json()
    const { text } = body

    if (!text || text.trim().length === 0) {
      return errorResponse('Comment text is required', 400)
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: params.id,
        authorId: user.id,
        text: text.trim(),
      },
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
    })

    return successResponse(comment, 'Comment added successfully')
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

