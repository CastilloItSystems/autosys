// modules/crm/interactions/utils/interaction.utils.ts

export const INTERACTION_DIRECTION_OPTIONS = [
  { label: "Saliente (nosotros contactamos)", value: "OUTBOUND" },
  { label: "Entrante (nos contactaron)", value: "INBOUND" },
];

export const INTERACTION_TYPE_FILTER_OPTIONS = [
  { label: "Todos los tipos", value: "" },
  { label: "Llamada", value: "CALL" },
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Correo", value: "EMAIL" },
  { label: "Visita", value: "VISIT" },
  { label: "Nota", value: "NOTE" },
  { label: "Cotización", value: "QUOTE" },
  { label: "Seguimiento", value: "FOLLOW_UP" },
  { label: "Reunión", value: "MEETING" },
];

export const INTERACTION_CHANNEL_FILTER_OPTIONS = [
  { label: "Todos los canales", value: "" },
  { label: "Repuestos", value: "REPUESTOS" },
  { label: "Taller", value: "TALLER" },
  { label: "Vehículos", value: "VEHICULOS" },
  { label: "General", value: "GENERAL" },
];
