"use client";
import React from "react";
import ExitNoteList from "@/components/inventory/exitNotes/ExitNoteList";

export default function WorkshopRequestsPage() {
  return (
    <>
      <ExitNoteList fixedType="WORKSHOP_SUPPLY" />
    </>
  );
}
