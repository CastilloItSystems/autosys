"use client";
import React from "react";
import ExitNoteList from "@/components/inventory/exitNotes/ExitNoteList";

export default function ExitNotesPage() {
  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h5>Notas de Salida / Despachos</h5>
          <p>
            Gestión de salidas de inventario por ventas, garantías, préstamos,
            uso interno y más.
          </p>
          <ExitNoteList />
        </div>
      </div>
    </div>
  );
}
