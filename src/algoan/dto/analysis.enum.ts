/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Analysis Status enum
 */
export enum AnalysisFormat {
  ALGOAN = 'ALGOAN',
  BUDGET_INSIGHT_V2 = 'BUDGET_INSIGHT_V2',
  OXLIN_DIRECT_ACCOUNT_V3 = 'OXLIN_DIRECT_ACCOUNT_V3',
  OXLIN_ACCOUNT_API_V2 = 'OXLIN_ACCOUNT_API_V2',
}

/**
 * Analysis Status enum
 */
export enum AnalysisStatus {
  CREATED = 'CREATED',
  ERROR = 'ERROR',
  INPROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

/**
 * Error codes for the application
 */
export enum ErrorCodes {
  UNKNOWN_ENTITY = 'UNKNOWN_ENTITY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
