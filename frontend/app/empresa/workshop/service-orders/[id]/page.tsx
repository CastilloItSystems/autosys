"use client";
import React from "react";
import { useParams } from "next/navigation";
import ServiceOrderDetail from "@/components/workshop/service-orders/ServiceOrderDetail";

export default function ServiceOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  return <ServiceOrderDetail serviceOrderId={id} />;
}
