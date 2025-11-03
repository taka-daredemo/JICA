import { NextResponse } from 'next/server'

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: 200 }
  )
}

export function errorResponse(
  error: string | Error,
  status: number = 400
): NextResponse<ApiResponse> {
  const errorMessage = error instanceof Error ? error.message : error
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status }
  )
}

export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
    },
    { status: 401 }
  )
}

export function notFoundResponse(): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Not found',
    },
    { status: 404 }
  )
}

