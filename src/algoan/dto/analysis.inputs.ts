import { AnalysisStatus, AnalysisFormat } from './analysis.enum';
import { AnalysisError } from './analysis.objects';

/**
 * Analysis Update Input
 */
export interface BaseAnalysisUpdateInput {
  format: AnalysisFormat;
  status?: AnalysisStatus;
  error?: AnalysisError;
}

/**
 * LinxoConnectAccountApiV2
 */
export interface LinxoConnectAccountApiV2AnalysisUpdateInput<
  LinxoConnectConnection,
  LinxoConnectAccount,
  LinxoConnectTransaction,
> extends BaseAnalysisUpdateInput {
  format: AnalysisFormat.LINXO_CONNECT_ACCOUNT_API_V2;
  status?: AnalysisStatus;
  error?: AnalysisError;
  connections?: (LinxoConnectConnection & {
    accounts: (LinxoConnectAccount & { transactions: LinxoConnectTransaction[] })[];
  })[];
}
