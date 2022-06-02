/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { LinxoConnectAccount } from 'src/linxo-connect/dto/account.object';
import { LinxoConnectConnection } from 'src/linxo-connect/dto/connection.object';
import { LinxoConnectTransaction } from 'src/linxo-connect/dto/transaction.object';
import { AnalysisFormat, AnalysisStatus, ErrorCodes } from '../../algoan/dto/analysis.enum';
import { LinxoConnectAccountApiV2AnalysisUpdateInput } from '../../algoan/dto/analysis.inputs';

/**
 * Default currency if no provided
 */
export const defaultCurrency: string = 'EUR';

/**
 * Map LinxoConnect Data To Algoan Analysis
 */
export function mapLinxoConnectDataToAlgoanAnalysis(
  connection: LinxoConnectConnection,
  accounts: LinxoConnectAccount[],
  transactions: LinxoConnectTransaction[],
): LinxoConnectAccountApiV2AnalysisUpdateInput<LinxoConnectConnection, LinxoConnectAccount, LinxoConnectTransaction> {
  // Group transactions by accountId
  const transactionsByAccountId: Map<string, LinxoConnectTransaction[]> = transactions.reduce(
    (map: Map<string, LinxoConnectTransaction[]>, t: LinxoConnectTransaction) => {
      map.set(t.account_id, [...(map.get(t.account_id) ?? []), t]);

      return map;
    },
    new Map(),
  );

  return {
    status: AnalysisStatus.IN_PROGRESS,
    format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
    connections: [
      {
        ...connection,
        accounts: accounts.map((account: LinxoConnectAccount) => ({
          ...account,
          transactions: transactionsByAccountId.get(account.id) ?? [],
        })),
      },
    ],
  };
}

/**
 * Map LinxoConnect Error To Algoan Analysis
 */
export function mapLinxoConnectErrorToAlgoanAnalysis(
  message: string,
  connection?: LinxoConnectConnection,
): LinxoConnectAccountApiV2AnalysisUpdateInput<LinxoConnectConnection, LinxoConnectAccount, LinxoConnectTransaction> {
  return {
    format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
    status: AnalysisStatus.ERROR,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message,
    },
    connections: connection !== undefined ? [{ ...connection, accounts: [] }] : [],
  };
}
