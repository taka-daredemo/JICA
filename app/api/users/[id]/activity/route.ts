import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/users/[id]/activity - ユーザーの活動ログ取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const entityType = searchParams.get('entityType')

    const where: any = {
      userId: params.id,
    }

    if (entityType) {
      where.entityType = entityType
    }

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return successResponse(activities)
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

