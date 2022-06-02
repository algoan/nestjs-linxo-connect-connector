/* eslint-disable @typescript-eslint/naming-convention,camelcase */

import { LinxoConnectAccountApiV2AnalysisUpdateInput } from 'src/algoan/dto/analysis.inputs';
import { LinxoConnectConnection } from 'src/linxo-connect/dto/connection.object';
import { linxoConnectAccountsMock } from '../../linxo-connect/dto/account.object.mock';
import { linxoConnectTransactionsMock } from '../../linxo-connect/dto/transaction.object.mock';
import { linxoConnectConnectionMock } from '../../linxo-connect/dto/connection.object.mock';
import { LinxoConnectAccount } from '../../linxo-connect/dto/account.object';
import { LinxoConnectTransaction } from '../../linxo-connect/dto/transaction.object';
import { AnalysisFormat, AnalysisStatus, ErrorCodes } from '../../algoan/dto/analysis.enum';
import { mapLinxoConnectDataToAlgoanAnalysis, mapLinxoConnectErrorToAlgoanAnalysis } from './analysis.mapper';

describe('AnalysisMapper', () => {
  describe('mapLinxoConnectDataToAlgoanAnalysis', () => {
    it('should return an algoan analysis with 2 account', async () => {
      // We map it
      const analysisUpdate: LinxoConnectAccountApiV2AnalysisUpdateInput<
        LinxoConnectConnection,
        LinxoConnectAccount,
        LinxoConnectTransaction
      > = mapLinxoConnectDataToAlgoanAnalysis(
        linxoConnectConnectionMock,
        linxoConnectAccountsMock,
        linxoConnectTransactionsMock,
      );

      // We get an algoan transaction input
      expect(analysisUpdate).toEqual<
        LinxoConnectAccountApiV2AnalysisUpdateInput<
          LinxoConnectConnection,
          LinxoConnectAccount,
          LinxoConnectTransaction
        >
      >({
        status: AnalysisStatus.IN_PROGRESS,
        format: AnalysisFormat.LINXO_CONNECT_ACCOUNT_API_V2,
        connections: [
          {
            ...linxoConnectConnectionMock,
            accounts: [
              {
                ...linxoConnectAccountsMock[0],
                transactions: [linxoConnectTransactionsMock[0]],
              },
              {
                ...linxoConnectAccountsMock[1],
                transactions: [linxoConnectTransactionsMock[1]],
              },
            ],
          },
        ],
      });
    });
  });

  describe('mapLinxoConnectErrorToAlgoanAnalysis', () => {
    it('should return an algoan analysis error', async () => {
      // We map it
      const analysisUpdate: LinxoConnectAccountApiV2AnalysisUpdateInput<LinxoConnectConnection, unknown, unknown> =
        mapLinxoConnectErrorToAlgoanAnalysis('There is an error');

      // We get an algoan transaction input
      expect(analysisUpdate).toEqual<
        LinxoConnectAccountApiV2AnalysisUpdateInput<
          LinxoConnectConnection,
          LinxoConnectAccount,
          LinxoConnectTransaction
        >
      >({
        format: AnalysisFormat.LINXO_CONNECT_ACCOUNT_API_V2,
        status: AnalysisStatus.ERROR,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'There is an error',
        },
        connections: [],
      });
    });

    it('should return an algoan analysis error AND a connection', async () => {
      // We map it
      const analysisUpdate: LinxoConnectAccountApiV2AnalysisUpdateInput<LinxoConnectConnection, unknown, unknown> =
        mapLinxoConnectErrorToAlgoanAnalysis('There is an error', linxoConnectConnectionMock);

      // We get an algoan transaction input
      expect(analysisUpdate).toEqual<
        LinxoConnectAccountApiV2AnalysisUpdateInput<
          LinxoConnectConnection,
          LinxoConnectAccount,
          LinxoConnectTransaction
        >
      >({
        format: AnalysisFormat.LINXO_CONNECT_ACCOUNT_API_V2,
        status: AnalysisStatus.ERROR,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'There is an error',
        },
        connections: [
          {
            ...linxoConnectConnectionMock,
            accounts: [],
          },
        ],
      });
    });
  });
});
