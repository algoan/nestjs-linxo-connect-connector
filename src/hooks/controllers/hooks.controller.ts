import { EventName, EventStatus, ServiceAccount, Subscription, SubscriptionEvent } from '@algoan/rest';
import { Body, Controller, Headers, HttpCode, HttpStatus, Logger, Post, UnauthorizedException } from '@nestjs/common';

import { assertsTypeValidation } from '../../shared/utils/common.utils';
import { AggregatorLinkRequiredDTO } from '../dto/aggregator-link-required-payload.dto';
import { BankDetailsRequiredDTO } from '../dto/bank-details-required-payload.dto';

import { EventDTO } from '../dto/event.dto';
import { HooksService } from '../services/hooks.service';
/**
 * Headers interface
 */
interface IHeaders {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'x-hub-signature': string;
}

/**
 * Hooks controller
 */
@Controller()
export class HooksController {
  /**
   * Class logger
   */
  private readonly logger: Logger = new Logger(HooksController.name);

  constructor(private readonly hooksService: HooksService, private readonly serviceAccount: ServiceAccount) {}

  /**
   * Hooks route
   */
  @Post('/hooks')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async controlHook(@Body() event: EventDTO, @Headers() headers: IHeaders): Promise<void> {
    const aggregationStartDate: Date = new Date();

    // Get subscription
    const subscription: Subscription | undefined = this.serviceAccount.subscriptions.find(
      (sub: Subscription) => sub.id === event.subscription.id,
    );

    if (subscription === undefined) {
      return;
    }

    // Check message signature
    const signature: string = headers['x-hub-signature'];
    if (!subscription.validateSignature(signature, event.payload as unknown as { [key: string]: string })) {
      throw new UnauthorizedException('Invalid X-Hub-Signature: you cannot call this API');
    }

    // To acknowledge the subscription event
    const se: SubscriptionEvent = subscription.event(event.id);

    try {
      switch (event.subscription.eventName) {
        case EventName.AGGREGATOR_LINK_REQUIRED:
          assertsTypeValidation(AggregatorLinkRequiredDTO, event.payload);
          void this.hooksService.handleAggregatorLinkRequiredEvent(event.payload).catch((e: Error) => {
            this.logger.error('An error occurred when "handleAggregatorLinkRequiredEvent"', e.stack);
          });
          break;

        case EventName.BANK_DETAILS_REQUIRED:
          assertsTypeValidation(BankDetailsRequiredDTO, event.payload);
          void this.hooksService
            .handleBankDetailsRequiredEvent(event.payload, aggregationStartDate)
            .catch((e: Error) => {
              this.logger.error('An error occurred when "handleBankDetailsRequiredEvent"', e.stack);
            });
          break;

        // The default case should never be reached, as the eventName is already checked in the DTO
        default:
          void se
            .update({ status: EventStatus.FAILED })
            .catch((e: Error) => {
              this.logger.error('An error occurred when updating event', e.stack);
            })
            .catch((e: Error) => {
              this.logger.error('An error occurred when updating the subscription status', e.stack);
            });

          return;
      }
    } catch (err) {
      void se
        .update({ status: EventStatus.ERROR })
        .catch((e: Error) => {
          this.logger.error('An error occurred when updating event', e.stack);
        })
        .catch((e: Error) => {
          this.logger.error('An error occurred when updating the subscription status', e.stack);
        });

      throw err;
    }

    void se
      .update({ status: EventStatus.PROCESSED })
      .catch((e: Error) => {
        this.logger.error('An error occurred when updating event', e.stack);
      })
      .catch((e: Error) => {
        this.logger.error('An error occurred when updating the subscription status', e.stack);
      });
  }
}
