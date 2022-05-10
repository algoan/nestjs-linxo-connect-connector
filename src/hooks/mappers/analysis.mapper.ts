/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { OxlinAccount } from 'src/oxlin/dto/account.object';
import { OxlinConnection } from 'src/oxlin/dto/connection.object';
import { OxlinTransaction } from 'src/oxlin/dto/transaction.object';
import { AnalysisFormat, AnalysisStatus, ErrorCodes } from '../../algoan/dto/analysis.enum';
import { OxlinAccountApiV2AnalysisUpdateInput } from '../../algoan/dto/analysis.inputs';

/**
 * Default currency if no provided
 */
export const defaultCurrency: string = 'EUR';

/**
 * Map Oxlin Data To Algoan Analysis
 */
export function mapOxlinDataToAlgoanAnalysis(
  connection: OxlinConnection,
  accounts: OxlinAccount[],
  transactions: OxlinTransaction[],
): OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, OxlinAccount, OxlinTransaction> {
  // Group transactions by accountId
  const transactionsByAccountId: Map<string, OxlinTransaction[]> = transactions.reduce(
    (map: Map<string, OxlinTransaction[]>, t: OxlinTransaction) => {
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
        accounts: accounts.map((account: OxlinAccount) => ({
          ...account,
          transactions: transactionsByAccountId.get(account.id) ?? [],
        })),
      },
    ],
  };
}

/**
 * Map Oxlin Error To Algoan Analysis
 */
export function mapOxlinErrorToAlgoanAnalysis(
  message: string,
  connection?: OxlinConnection,
): OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, OxlinAccount, OxlinTransaction> {
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
