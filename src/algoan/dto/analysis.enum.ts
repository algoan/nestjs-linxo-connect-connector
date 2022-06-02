/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Analysis Status enum
 */
export enum AnalysisFormat {
}

/**
 * Analysis Status enum
 */
export enum AnalysisStatus {
  CREATED = 'CREATED',
  ERROR = 'ERROR',
  IN_PROGRESS = 'IN_PROGRESS',
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
