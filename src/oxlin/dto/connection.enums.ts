/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Enum for the connection status
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getConnectionByIdUsingGET
 */
export enum OxlinConnectionStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
  CLOSED = 'CLOSED',
  NONE = 'NONE',
}
