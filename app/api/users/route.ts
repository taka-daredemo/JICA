import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/users - ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const roleId = searchParams.get('roleId')
    const search = searchParams.get('search')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (roleId) {
      where.roles = {
        some: {
          roleId,
        },
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
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
        _count: {
          select: {
            tasksAssigned: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // アクティブタスク数を含める
    const usersWithTaskCount = await Promise.all(
      users.map(async (u) => {
        const activeTasks = await prisma.task.count({
          where: {
            assigneeId: u.id,
            status: {
              not: 'Completed',
            },
          },
        })

        return {
          ...u,
          activeTasksCount: activeTasks,
          workload:
            activeTasks > 5
              ? 'Overloaded'
              : activeTasks >= 4
                ? 'High'
                : activeTasks >= 1
                  ? 'Normal'
                  : 'Low',
        }
      })
    )

    return successResponse(usersWithTaskCount)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

// POST /api/users - ユーザー作成
export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    // TODO: 管理者権限チェックを追加

    const body = await request.json()
    const { email, name, passwordHash, avatarUrl, status, roleIds } = body

    if (!email || !name) {
      return errorResponse('Email and name are required', 400)
    }

    // ユーザー作成
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        avatarUrl,
        status: status || 'Active',
        roles: roleIds
          ? {
              create: roleIds.map((roleId: string) => ({
                roleId,
              })),
            }
          : undefined,
      },
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

    return successResponse(newUser, 'User created successfully')
  } catch (error: any) {
    if (error.code === 'P2002') {
      return errorResponse('Email already exists', 409)
    }
    return errorResponse(error as Error, 500)
  }
}

