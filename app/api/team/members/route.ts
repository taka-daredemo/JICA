import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/team/members - チームメンバー一覧取得（ワークロード情報付き）
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const roleId = searchParams.get('roleId')
    const status = searchParams.get('status')
    const workload = searchParams.get('workload') // 'Overloaded' | 'High' | 'Normal' | 'Low'

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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 各ユーザーのワークロード情報を取得
    const membersWithWorkload = await Promise.all(
      users.map(async (u) => {
        const activeTasks = await prisma.task.count({
          where: {
            assigneeId: u.id,
            status: {
              not: 'Completed',
            },
          },
        })

        const workloadLevel =
          activeTasks > 5
            ? 'Overloaded'
            : activeTasks >= 4
              ? 'High'
              : activeTasks >= 1
                ? 'Normal'
                : 'Low'

        return {
          ...u,
          activeTasksCount: activeTasks,
          workload: workloadLevel,
        }
      })
    )

    // ワークロードでフィルタリング
    let filteredMembers = membersWithWorkload
    if (workload) {
      filteredMembers = membersWithWorkload.filter((m) => m.workload === workload)
    }

    // ワークロード順にソート（Overloaded > High > Normal > Low）
    const workloadOrder = { Overloaded: 0, High: 1, Normal: 2, Low: 3 }
    filteredMembers.sort((a, b) => workloadOrder[a.workload] - workloadOrder[b.workload])

    return successResponse(filteredMembers)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

