// modules/crm/customer/index.ts
export { default as CustomerCrmList } from "./components/CustomerCrmList";
export { default as CustomerCrmForm } from "./components/CustomerCrmForm";
export { default as CustomerTimeline } from "./components/CustomerTimeline";
export { default as CustomerVehiclePanel } from "./components/CustomerVehiclePanel";
export {
  useCustomerCrmData,
  useCustomerDetailData,
  useCustomerOptionsData,
  useCustomerTimelineData,
  useCustomerVehicleCatalogOptionsData,
  useCustomerVehicleServiceHistoryData,
  useCustomerVehiclesData,
} from "./hooks/useCustomerCrmData";
export * from "./interfaces/customer.crm.interface";
export * from "./interfaces/customerVehicle.interface";
export * from "./interfaces/customerCrmForm.interface";
export * from "./schemas/customerCrmZod";
export * from "./schemas/customerVehicleZod";
export * from "./utils/customer.utils";
