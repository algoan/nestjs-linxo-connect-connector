import { IsNotEmpty, IsString } from 'class-validator';
/**
 * Payload for event `bank_details_required`
 */
export class BankDetailsRequiredDTO {
  /**
   * Customer identifier
   */
  @IsString()
  @IsNotEmpty()
  public customerId: string;

  /**
   * Analysis ID
   */
  @IsString()
  @IsNotEmpty()
  public analysisId: string;

  /**
   * LinxoConnect iframe sends a connection_id.
   * So the temporaryCode should be interpreted as a connection_id for the bank_details_required event.
   */
  @IsString()
  @IsNotEmpty()
  public temporaryCode: string;
}
