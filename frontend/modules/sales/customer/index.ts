export { default as CustomerList } from "./components/CustomerList";
export { default as CustomerForm } from "./components/CustomerForm";
export { default as CustomerDetailDialog } from "./components/CustomerDetailDialog";
export type { Customer } from "./services/customerService";
export {
  CustomerType,
  CUSTOMER_TYPE_CONFIG,
} from "./interfaces/customer.interface";
export {
  createCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "./schemas/customerZod";
export { default as customerService } from "./services/customerService";
