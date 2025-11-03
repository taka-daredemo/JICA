import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/team/workload - チームのワークロード分析
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const users = await prisma.user.findMany({
      where: {
        status: 'Active',
      },
      include: {
        roles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    // 各ユーザーのワークロード情報を取得
    const workloadData = await Promise.all(
      users.map(async (u) => {
        const [activeTasks, completedTasks] = await Promise.all([
          prisma.task.count({
            where: {
              assigneeId: u.id,
              status: {
                not: 'Completed',
              },
            },
          }),
          prisma.task.count({
            where: {
              assigneeId: u.id,
              status: 'Completed',
            },
          }),
        ])

        const workloadLevel =
          activeTasks > 5
            ? 'Overloaded'
            : activeTasks >= 4
              ? 'High'
              : activeTasks >= 1
                ? 'Normal'
                : 'Low'

        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          role: u.roles[0]?.role?.name || 'No Role',
          activeTasks,
          completedTasks,
          totalTasks: activeTasks + completedTasks,
          workload: workloadLevel,
        }
      })
    )

    // 統計情報
    const totalMembers = workloadData.length
    const totalActiveTasks = workloadData.reduce((sum, w) => sum + w.activeTasks, 0)
    const avgWorkload = totalMembers > 0 ? totalActiveTasks / totalMembers : 0
    const overloadedCount = workloadData.filter((w) => w.workload === 'Overloaded').length
    const highWorkloadCount = workloadData.filter((w) => w.workload === 'High').length

    // ロール別の集計
    const roleDistribution: Record<string, number> = {}
    workloadData.forEach((w) => {
      const role = w.role
      roleDistribution[role] = (roleDistribution[role] || 0) + 1
    })

    // アクティブタスク数でソート（降順）
    workloadData.sort((a, b) => b.activeTasks - a.activeTasks)

    return successResponse({
      members: workloadData,
      statistics: {
        totalMembers,
        totalActiveTasks,
        avgWorkload: Math.round(avgWorkload * 10) / 10,
        overloadedCount,
        highWorkloadCount,
        roleDistribution,
      },
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

