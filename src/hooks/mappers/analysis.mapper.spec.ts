/* eslint-disable @typescript-eslint/naming-convention,camelcase */

import { OxlinAccountApiV2AnalysisUpdateInput } from 'src/algoan/dto/analysis.inputs';
import { OxlinConnection } from 'src/oxlin/dto/connection.object';
import { oxlinAccountsMock } from '../../oxlin/dto/account.object.mock';
import { oxlinTransactionsMock } from '../../oxlin/dto/transaction.object.mock';
import { oxlinConnectionMock } from '../../oxlin/dto/connection.object.mock';
import { OxlinAccount } from '../../oxlin/dto/account.object';
import { OxlinTransaction } from '../../oxlin/dto/transaction.object';
import { AnalysisFormat, AnalysisStatus, ErrorCodes } from '../../algoan/dto/analysis.enum';
import { mapOxlinDataToAlgoanAnalysis, mapOxlinErrorToAlgoanAnalysis } from './analysis.mapper';

describe('AnalysisMapper', () => {
  describe('mapOxlinDataToAlgoanAnalysis', () => {
    it('should return an algoan analysis with 2 account', async () => {
      // We map it
      const analysisUpdate: OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, OxlinAccount, OxlinTransaction> =
        mapOxlinDataToAlgoanAnalysis(oxlinConnectionMock, oxlinAccountsMock, oxlinTransactionsMock);

      // We get an algoan transaction input
      expect(analysisUpdate).toEqual<
        OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, OxlinAccount, OxlinTransaction>
      >({
        status: AnalysisStatus.IN_PROGRESS,
        format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
        connections: [
          {
            ...oxlinConnectionMock,
            accounts: [
              {
                ...oxlinAccountsMock[0],
                transactions: [oxlinTransactionsMock[0]],
              },
              {
                ...oxlinAccountsMock[1],
                transactions: [oxlinTransactionsMock[1]],
              },
            ],
          },
        ],
      });
    });
  });

  describe('mapOxlinErrorToAlgoanAnalysis', () => {
    it('should return an algoan analysis error', async () => {
      // We map it
      const analysisUpdate: OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, unknown, unknown> =
        mapOxlinErrorToAlgoanAnalysis('There is an error');

      // We get an algoan transaction input
      expect(analysisUpdate).toEqual<
        OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, OxlinAccount, OxlinTransaction>
      >({
        format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
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
      const analysisUpdate: OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, unknown, unknown> =
        mapOxlinErrorToAlgoanAnalysis('There is an error', oxlinConnectionMock);

      // We get an algoan transaction input
      expect(analysisUpdate).toEqual<
        OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, OxlinAccount, OxlinTransaction>
      >({
        format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
        status: AnalysisStatus.ERROR,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'There is an error',
        },
        connections: [
          {
            ...oxlinConnectionMock,
            accounts: [],
          },
        ],
      });
    });
  });
});
