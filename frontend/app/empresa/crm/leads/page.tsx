"use client";
import React, { useState } from "react";
import { Button } from "primereact/button";
import LeadList from "@/components/crm/leads/LeadList";
import LeadKanban from "@/components/crm/leads/LeadKanban";

export default function LeadsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  return (
    <>
      {/* View toggle */}
      <div className="flex justify-content-end mb-2">
        <div
          className="flex"
          style={{
            border: "1px solid var(--surface-300)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <Button
            icon="pi pi-th-large"
            text
            tooltip="Vista Kanban"
            tooltipOptions={{ position: "bottom" }}
            style={{
              borderRadius: 0,
              padding: "6px 14px",
              backgroundColor:
                view === "kanban" ? "var(--primary-100)" : "transparent",
              color:
                view === "kanban"
                  ? "var(--primary-color)"
                  : "var(--text-color-secondary)",
            }}
            onClick={() => setView("kanban")}
          />
          <Button
            icon="pi pi-list"
            text
            tooltip="Vista lista"
            tooltipOptions={{ position: "bottom" }}
            style={{
              borderRadius: 0,
              padding: "6px 14px",
              borderLeft: "1px solid var(--surface-300)",
              backgroundColor:
                view === "list" ? "var(--primary-100)" : "transparent",
              color:
                view === "list"
                  ? "var(--primary-color)"
                  : "var(--text-color-secondary)",
            }}
            onClick={() => setView("list")}
          />
        </div>
      </div>

      {view === "kanban" ? <LeadKanban /> : <LeadList />}
    </>
  );
}
