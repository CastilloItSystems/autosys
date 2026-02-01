import React from "react";
import { Metadata } from "next";
import WorkOrderKanban from "@/components/workshop/kanban/WorkOrderKanban";

export const metadata: Metadata = {
  title: "Tablero de Órdenes de Trabajo - Taller",
  description: "Gestión visual de órdenes de trabajo con tablero Kanban",
};

export default function WorkshopOperationPage() {
  return <WorkOrderKanban />;
}
