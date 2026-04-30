"use client";
import React from "react";
import ExitNoteList from "@/modules/inventory/exitNotes/components/ExitNoteList";

export default function WorkshopRequestsPage() {
  return (
    <>
      <ExitNoteList fixedType="WORKSHOP_SUPPLY" />
    </>
  );
}
