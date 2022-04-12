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
 * OxlinAccountApiV2
 */
export interface OxlinAccountApiV2AnalysisUpdateInput<OxlinConnection, OxlinAccount, OxlinTransaction>
  extends BaseAnalysisUpdateInput {
  format: AnalysisFormat.OXLIN_ACCOUNT_API_V2;
  status?: AnalysisStatus;
  error?: AnalysisError;
  connections?: (OxlinConnection & { accounts: (OxlinAccount & { transactions: OxlinTransaction[] })[] })[];
}
