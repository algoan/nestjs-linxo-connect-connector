/* eslint-disable @typescript-eslint/naming-convention, camelcase */

import { GrantType } from './grant-type.enum';

/**
 * Input to send to get a new widget session
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#tag/manage-widget/paths/~1widget_session/post
 */
export interface WidgetSessionInput {
  access_token: string; // the user one
  client_id: string;
  client_secret: string;
}
