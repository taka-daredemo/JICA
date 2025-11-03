import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/users/[id]/tasks - ユーザーに割り当てられたタスク一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const overdue = searchParams.get('overdue') === 'true'

    const where: any = {
      assigneeId: params.id,
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'asc' },
      ],
    })

    return successResponse(tasks)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

