// modules/crm/opportunities/utils/opportunity.utils.ts

export const OPPORTUNITY_CHANNEL_FILTER_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Repuestos", value: "REPUESTOS" },
  { label: "Taller", value: "TALLER" },
  { label: "Vehículos", value: "VEHICULOS" },
];

export const OPPORTUNITY_CHANNEL_OPTIONS = [
  { label: "Repuestos", value: "REPUESTOS" },
  { label: "Taller", value: "TALLER" },
  { label: "Vehículos", value: "VEHICULOS" },
];

export const OPPORTUNITY_STATUS_FILTER_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Abiertas", value: "OPEN" },
  { label: "Ganadas", value: "WON" },
  { label: "Perdidas", value: "LOST" },
];

export const OPPORTUNITY_STAGE_FLOW: Record<string, string[]> = {
  REPUESTOS: ["DISCOVERY", "QUOTED", "NEGOTIATION", "COMMITTED"],
  TALLER: ["DIAGNOSIS", "VALUATION", "QUOTE_SENT", "APPROVAL_PENDING"],
  VEHICULOS: ["CONTACT", "TEST_DRIVE", "PROPOSAL", "NEGOTIATION"],
};

export function getOpportunityFlow(channel: string): string[] {
  return (
    OPPORTUNITY_STAGE_FLOW[channel] ?? ["DISCOVERY", "QUALIFIED", "NEGOTIATION"]
  );
}
