// modules/crm/opportunities/index.ts
export { default as OpportunityBoard } from "./components/OpportunityBoard";
export { default as OpportunityForm } from "./components/OpportunityForm";
export { default as OpportunityList } from "./components/OpportunityList";
export {
  useOpportunitiesData,
  useOpportunityDetailData,
} from "./hooks/useOpportunitiesData";
export * from "./interfaces/opportunity.interface";
export * from "./interfaces/opportunityForm.interface";
export * from "./utils/opportunity.utils";
