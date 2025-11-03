import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { TaskStatus } from '@prisma/client'

// GET /api/team/stats - チーム統計情報取得
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    // タスク統計
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({
        where: {
          status: TaskStatus.Completed,
        },
      }),
      prisma.task.count({
        where: {
          status: TaskStatus.InProgress,
        },
      }),
      prisma.task.count({
        where: {
          status: TaskStatus.NotStarted,
        },
      }),
      prisma.task.count({
        where: {
          status: {
            not: TaskStatus.Completed,
          },
          dueDate: {
            lt: now,
          },
        },
      }),
    ])

    // 今週の期限のタスク
    const tasksDueThisWeek = await prisma.task.count({
      where: {
        dueDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        status: {
          not: TaskStatus.Completed,
        },
      },
    })

    // ユーザー統計
    const [totalMembers, activeMembers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          status: 'Active',
        },
      }),
    ])

    // ワークロード統計
    const users = await prisma.user.findMany({
      where: {
        status: 'Active',
      },
    })

    const workloadStats = await Promise.all(
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
          userId: u.id,
          activeTasks,
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

    const overloadedCount = workloadStats.filter((w) => w.workload === 'Overloaded').length
    const highWorkloadCount = workloadStats.filter((w) => w.workload === 'High').length
    const totalActiveTasks = workloadStats.reduce((sum, w) => sum + w.activeTasks, 0)
    const avgWorkload = users.length > 0 ? totalActiveTasks / users.length : 0

    return successResponse({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        notStarted: notStartedTasks,
        overdue: overdueTasks,
        dueThisWeek: tasksDueThisWeek,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
      team: {
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
      },
      workload: {
        totalActiveTasks,
        avgWorkload: Math.round(avgWorkload * 10) / 10,
        overloadedCount,
        highWorkloadCount,
        normalCount: workloadStats.filter((w) => w.workload === 'Normal').length,
        lowCount: workloadStats.filter((w) => w.workload === 'Low').length,
      },
    })
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

