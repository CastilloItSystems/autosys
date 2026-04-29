// modules/crm/leads/utils/lead.utils.ts

import { LEAD_STATUS_CONFIG } from "../interfaces/lead.interface";

export const LEAD_CHANNEL_FILTER_OPTIONS = [
  { label: "Todos los canales", value: "" },
  { label: "Repuestos", value: "REPUESTOS" },
  { label: "Taller", value: "TALLER" },
  { label: "Vehículos", value: "VEHICULOS" },
];

export const LEAD_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estados", value: "" },
  ...Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => ({
    label: cfg.label,
    value,
  })),
];
