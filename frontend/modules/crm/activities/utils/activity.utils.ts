// modules/crm/activities/utils/activity.utils.ts

import { ACTIVITY_STATUS_OPTIONS } from "../interfaces/activity.interface";

export const ACTIVITY_TYPE_FILTER_OPTIONS = [
  { label: "Todos los tipos", value: "" },
  { label: "Llamada", value: "CALL" },
  { label: "Correo", value: "EMAIL" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Reunión", value: "MEETING" },
  { label: "Cotización", value: "QUOTE" },
  { label: "Tarea", value: "TASK" },
];

export const ACTIVITY_STATUS_FILTER_OPTIONS = [
  { label: "Todos los estados", value: "" },
  ...ACTIVITY_STATUS_OPTIONS,
];
