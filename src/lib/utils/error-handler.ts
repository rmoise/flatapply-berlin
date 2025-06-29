import { ERROR_MESSAGES } from '@/lib/constants'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown): {
  message: string
  code: string
  statusCode: number
  details?: unknown
} {
  console.error('Error occurred:', error)

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    // Supabase errors
    if ('code' in error) {
      const supabaseError = error as { code: string; message?: string }
      
      switch (supabaseError.code) {
        case '23505':
          return {
            message: 'This record already exists',
            code: 'DUPLICATE_ENTRY',
            statusCode: 409,
          }
        case 'PGRST116':
          return {
            message: ERROR_MESSAGES.NOT_FOUND,
            code: 'NOT_FOUND',
            statusCode: 404,
          }
        case '42501':
          return {
            message: ERROR_MESSAGES.FORBIDDEN,
            code: 'FORBIDDEN',
            statusCode: 403,
          }
        default:
          return {
            message: supabaseError.message || ERROR_MESSAGES.GENERIC,
            code: supabaseError.code,
            statusCode: 500,
          }
      }
    }

    return {
      message: error.message || ERROR_MESSAGES.GENERIC,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    }
  }

  return {
    message: ERROR_MESSAGES.GENERIC,
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  }
}

// Action result type for server actions
export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// Wrap server actions with error handling
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    const { message, code } = handleError(error)
    return { success: false, error: message, code }
  }
}