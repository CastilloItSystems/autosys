"use client";

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import {
  AutoComplete,
  type AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import FormActionButtons from "@/shared/components/FormActionButtons";
import MembershipForm from "./MembershipForm";
import { searchUsers, type UserSearchResult } from "../services/user.service";

interface AddExistingMemberDialogProps {
  visible: boolean;
  onHide: () => void;
  /** Se llama tras crear la membership (para refrescar la lista). */
  onSave: () => void;
  toast: React.RefObject<Toast | null>;
}

const FORM_ID = "add-existing-member-form";

/**
 * Agrega un usuario YA EXISTENTE a la empresa activa creándole una membership.
 * La creación de usuarios nuevos vive solo en el área global (/users).
 */
const AddExistingMemberDialog = ({
  visible,
  onHide,
  onSave,
  toast,
}: AddExistingMemberDialogProps) => {
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  // `acValue` es el valor crudo del AutoComplete: string mientras se escribe,
  // objeto cuando se selecciona. Sin esto, el input controlado por el objeto
  // borraba el texto al tipear.
  const [acValue, setAcValue] = useState<string | UserSearchResult>("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async (e: AutoCompleteCompleteEvent) => {
    const q = e.query?.trim() ?? "";
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      setSuggestions(await searchUsers(q));
    } catch {
      setSuggestions([]);
    }
  };

  const handleHide = () => {
    setSelectedUser(null);
    setAcValue("");
    setSuggestions([]);
    setIsSubmitting(false);
    onHide();
  };

  const handleSaved = () => {
    handleHide();
    onSave();
  };

  return (
    <Dialog
      visible={visible}
      style={{ width: "650px" }}
      header={
        <div className="mb-2 text-center md:text-left">
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
              <i className="pi pi-user-plus mr-3 text-primary text-3xl" />
              Agregar usuario existente
            </h2>
          </div>
        </div>
      }
      modal
      className="p-fluid"
      footer={
        selectedUser ? (
          <FormActionButtons
            onCancel={handleHide}
            isUpdate={false}
            submitLabel="Agregar a la empresa"
            formId={FORM_ID}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="flex w-full gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              className="flex-1"
              onClick={handleHide}
            />
          </div>
        )
      }
      onHide={handleHide}
    >
      <div className="p-2">
        <label className="block text-900 font-medium mb-2">
          Usuario <span className="text-red-500">*</span>
        </label>
        <AutoComplete
          value={acValue}
          suggestions={suggestions}
          completeMethod={handleSearch}
          field="nombre"
          delay={300}
          placeholder="Buscar por nombre o correo…"
          dropdown
          forceSelection
          itemTemplate={(item: UserSearchResult) => (
            <div className="flex flex-column">
              <span className="font-medium">{item.nombre}</span>
              <small className="text-color-secondary">{item.correo}</small>
            </div>
          )}
          onChange={(e) => {
            setAcValue(e.value);
            setSelectedUser(
              e.value && typeof e.value === "object"
                ? (e.value as UserSearchResult)
                : null,
            );
          }}
          className="w-full"
        />
        <small className="text-color-secondary">
          Solo aparecen usuarios que aún no pertenecen a esta empresa. Para crear
          uno nuevo, usá la sección global de Usuarios.
        </small>

        {selectedUser && (
          <div className="mt-4">
            <MembershipForm
              userId={selectedUser.id}
              onSave={handleSaved}
              onCancel={handleHide}
              toast={toast}
              formId={FORM_ID}
              onSubmittingChange={setIsSubmitting}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default AddExistingMemberDialog;
