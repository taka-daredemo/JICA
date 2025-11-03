import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api/auth'
import { successResponse, errorResponse } from '@/lib/api/response'

// GET /api/reports/export - データエクスポート
export async function GET(request: NextRequest) {
  try {
    const { user, response } = await requireAuth()
    if (!user) return response!

    const searchParams = request.nextUrl.searchParams
    const entity = searchParams.get('entity') || 'tasks' // tasks, farmers, payments, training
    const format = searchParams.get('format') || 'csv' // csv, json
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (startDate && endDate) {
      const dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }

      switch (entity) {
        case 'tasks':
          where.dueDate = dateFilter
          break
        case 'farmers':
          // フィルタなし（全件）
          break
        case 'payments':
          where.paymentDate = dateFilter
          break
        case 'training':
          where.date = dateFilter
          break
      }
    }

    let data: any[] = []

    switch (entity) {
      case 'tasks': {
        const tasks = await prisma.task.findMany({
          where,
          include: {
            assignee: {
              select: {
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                name: true,
                email: true,
              },
            },
            recurringPattern: true,
          },
          orderBy: {
            dueDate: 'asc',
          },
        })

        data = tasks.map((task) => ({
          id: task.id,
          name: task.name,
          description: task.description,
          assignee: task.assignee?.name || '',
          assigneeEmail: task.assignee?.email || '',
          creator: task.creator?.name || '',
          dueDate: task.dueDate.toISOString(),
          status: task.status,
          priority: task.priority,
          isRecurring: task.isRecurring,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        }))
        break
      }

      case 'farmers': {
        const farmers = await prisma.farmer.findMany({
          include: {
            _count: {
              select: {
                attendance: true,
                incomeRecords: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        data = farmers.map((farmer) => ({
          id: farmer.id,
          farmerCode: farmer.farmerCode,
          name: farmer.name,
          location: farmer.location || '',
          contactPhone: farmer.contactPhone || '',
          contactEmail: farmer.contactEmail || '',
          landSizeHectares: farmer.landSizeHectares?.toString() || '',
          yearGroup: farmer.yearGroup?.toString() || '',
          status: farmer.status || '',
          baselineIncome: farmer.baselineIncome?.toString() || '',
          trainingAttendanceCount: farmer._count.attendance,
          incomeRecordCount: farmer._count.incomeRecords,
          createdAt: farmer.createdAt.toISOString(),
          updatedAt: farmer.updatedAt.toISOString(),
        }))
        break
      }

      case 'payments': {
        const expenses = await prisma.expense.findMany({
          where,
          include: {
            plan: {
              select: {
                planName: true,
                budget: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
        })

        data = expenses.map((expense) => ({
          id: expense.id,
          planName: expense.plan?.planName || '',
          budgetCategory: expense.plan?.budget?.name || '',
          amount: expense.amount.toString(),
          paymentDate: expense.paymentDate.toISOString(),
          paymentMethod: expense.paymentMethod || '',
          vendor: expense.vendor || '',
          description: expense.description || '',
          receiptUrl: expense.receiptUrl || '',
          createdBy: expense.createdBy?.name || '',
          createdAt: expense.createdAt.toISOString(),
        }))
        break
      }

      case 'training': {
        const trainings = await prisma.training.findMany({
          where,
          include: {
            facilitator: {
              select: {
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                attendance: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        })

        data = trainings.map((training) => ({
          id: training.id,
          topic: training.topic,
          description: training.description || '',
          date: training.date.toISOString(),
          location: training.location || '',
          facilitator: training.facilitator?.name || '',
          facilitatorEmail: training.facilitator?.email || '',
          capacity: training.capacity?.toString() || '',
          status: training.status,
          registeredCount: training._count.attendance,
          createdAt: training.createdAt.toISOString(),
        }))
        break
      }

      default:
        return errorResponse(`Invalid entity type: ${entity}`, 400)
    }

    if (format === 'json') {
      return successResponse({ entity, count: data.length, data })
    } else if (format === 'csv') {
      // CSV形式での出力
      if (data.length === 0) {
        return successResponse('', 'No data to export')
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || ''
              // CSVエスケープ: カンマや改行を含む場合はダブルクォートで囲む
              if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(',')
        ),
      ]

      const csv = csvRows.join('\n')

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${entity}_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      return errorResponse(`Invalid format: ${format}`, 400)
    }
  } catch (error) {
    return errorResponse(error as Error, 500)
  }
}

