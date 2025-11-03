import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'

// GET /api/users/[id] - ユーザー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const userData = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    module: true,
                  },
                },
              },
            },
          },
        },
        tasksAssigned: {
          where: {
            status: {
              not: 'Completed',
            },
          },
          include: {
            recurringPattern: true,
          },
          orderBy: {
            dueDate: 'asc',
          },
          take: 10,
        },
        activityLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    })

    if (!userData) {
      return notFoundResponse()
    }

    // タスク統計
    const [completedTasks, inProgressTasks, overdueTasks] = await Promise.all([
      prisma.task.count({
        where: {
          assigneeId: params.id,
          status: 'Completed',
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: params.id,
          status: 'InProgress',
        },
      }),
      prisma.task.count({
        where: {
          assigneeId: params.id,
          status: {
            not: 'Completed',
          },
          dueDate: {
            lt: new Date(),
          },
        },
      }),
    ])

    return successResponse({
      ...userData,
      taskStats: {
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        total: completedTasks + inProgressTasks + overdueTasks,
      },
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// PUT /api/users/[id] - ユーザー更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // TODO: 管理者権限または本人チェックを追加

    const body = await request.json()
    const { email, name, avatarUrl, status, roleIds } = body

    const updateData: any = {}

    if (email) updateData.email = email
    if (name) updateData.name = name
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (status) updateData.status = status

    // ロールの更新
    if (roleIds) {
      // 既存のロールを削除
      await prisma.userRole.deleteMany({
        where: {
          userId: params.id,
        },
      })

      // 新しいロールを追加
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId: params.id,
            roleId,
          })),
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return successResponse(updatedUser, 'User updated successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    if (error.code === 'P2002') {
      return errorResponse('Email already exists', 409)
    }
    return errorResponse(error as Error, 500)
  }
}

// DELETE /api/users/[id] - ユーザー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // TODO: 管理者権限チェックを追加

    await prisma.user.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'User deleted successfully')
  } catch (error: any) {
    if (error.code === 'P2025') {
      return notFoundResponse()
    }
    return errorResponse(error as Error, 500)
  }
}

