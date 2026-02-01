import React from "react";
import { Metadata } from "next";
import PaymentList from "@/components/workshop/payments/PaymentList";

export const metadata: Metadata = {
  title: "Pagos - Taller",
  description: "Gestión de pagos de facturas del taller",
};

export default function PaymentsPage() {
  return <PaymentList />;
}
