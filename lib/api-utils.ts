import { NextResponse } from "next/server"
import type { ZodError } from "zod"

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  })
}

export function errorResponse(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status },
  )
}

export function handleZodError(error: ZodError): NextResponse<ApiResponse> {
  const errorMessage = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
  return errorResponse(errorMessage)
}
