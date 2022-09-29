/* eslint-disable @typescript-eslint/naming-convention, camelcase */

/**
 * Args to add to the iframe url generated
 */
export interface WidgetSessionUrlArgs {
  redirect_uri: string;
  aspsp_callback_uri: string;
  consent_per_account: boolean;
  wait_sync_end: boolean;
  locale?: string;
  font?: string;
  font_color?: string;
}
