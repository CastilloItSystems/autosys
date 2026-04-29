// modules/crm/customer/utils/customer.utils.ts

import {
  CUSTOMER_TYPE_CONFIG,
  CUSTOMER_SEGMENT_CONFIG,
  CUSTOMER_CHANNEL_CONFIG,
} from "../interfaces/customer.crm.interface";

export const CUSTOMER_TYPE_OPTIONS = Object.entries(CUSTOMER_TYPE_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value })
);

export const CUSTOMER_SEGMENT_OPTIONS = Object.entries(CUSTOMER_SEGMENT_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value })
);

export const CUSTOMER_CHANNEL_OPTIONS = Object.entries(CUSTOMER_CHANNEL_CONFIG).map(
  ([value, cfg]) => ({ label: cfg.label, value })
);

export const CUSTOMER_SEGMENT_FILTER_OPTIONS = [
  { label: "Todos los segmentos", value: "" },
  ...CUSTOMER_SEGMENT_OPTIONS,
];

export const CUSTOMER_CHANNEL_FILTER_OPTIONS = [
  { label: "Todos los canales", value: "" },
  ...CUSTOMER_CHANNEL_OPTIONS,
];

// List filter options (use null as "all" value to match CustomerCrmList behavior)
export const CUSTOMER_SEGMENT_LIST_FILTER_OPTIONS = [
  { label: "Todos los segmentos", value: null as string | null },
  ...Object.entries(CUSTOMER_SEGMENT_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value })),
];

export const CUSTOMER_CHANNEL_LIST_FILTER_OPTIONS = [
  { label: "Todos los canales", value: null as string | null },
  ...Object.entries(CUSTOMER_CHANNEL_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value })),
];

export const CUSTOMER_TYPE_LIST_FILTER_OPTIONS = [
  { label: "Todos los tipos", value: null as string | null },
  ...Object.entries(CUSTOMER_TYPE_CONFIG).map(([value, cfg]) => ({ label: cfg.label, value })),
];

