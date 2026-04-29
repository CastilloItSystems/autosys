// modules/crm/cases/index.ts
export { default as CaseList } from "./components/CaseList";
export { default as CaseForm } from "./components/CaseForm";
export { default as CaseKanban } from "./components/CaseKanban";
export { default as CaseStatusDialog } from "./components/CaseStatusDialog";
export { default as CaseDetailDialog } from "./components/CaseDetailDialog";
export { default as caseService } from "./services/caseService";
export * from "./interfaces/case.interface";
export * from "./schemas/caseZod";
export * from "./utils/case.utils";
