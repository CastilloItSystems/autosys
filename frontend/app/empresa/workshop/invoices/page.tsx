import React from "react";
import InvoiceList from "@/components/workshop/invoices/InvoiceList";

export const metadata = {
  title: "Facturas - Taller",
  description: "Gestión de facturas del taller",
};

const InvoicesPage = () => {
  return <InvoiceList />;
};

export default InvoicesPage;
