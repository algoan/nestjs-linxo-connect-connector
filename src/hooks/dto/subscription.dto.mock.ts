import { EventName } from '../enums/event-name.enum';
import { SubscriptionDTO } from './subscription.dto';

/**
 * Mock for a Subscription
 */
export const subscriptionMock: SubscriptionDTO = {
  id: 'id',
  target: 'https://target.url',
  eventName: EventName.BANK_DETAILS_REQUIRED,
  status: 'ACTIVE',
};
