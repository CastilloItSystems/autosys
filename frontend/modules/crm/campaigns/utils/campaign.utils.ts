// modules/crm/campaigns/utils/campaign.utils.ts

import {
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_CHANNEL_OPTIONS,
} from "../interfaces/campaign.interface";

export const CAMPAIGN_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estados", value: "" },
  ...CAMPAIGN_STATUS_OPTIONS,
];

export const CAMPAIGN_CHANNEL_FILTER_OPTIONS = [
  { label: "Todos los canales", value: "" },
  ...CAMPAIGN_CHANNEL_OPTIONS,
];
