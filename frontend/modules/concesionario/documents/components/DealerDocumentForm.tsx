"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import dealerDocumentService from "../services/dealerDocumentService";
import { handleFormError } from "@/utils/errorHandlers";
import type {
  DealerDocumentFormValues,
  DealerDocumentFormProps,
} from "../interfaces/dealerDocumentForm.interface";
import {
  DOCUMENT_STATUS_OPTIONS,
  DOCUMENT_REF_OPTIONS,
} from "../utils/dealerDocument.utils";

export default function DealerDocumentForm({
  document,
  onSave,
  formId,
  onSubmittingChange,
  toast,
}: DealerDocumentFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerDocumentFormValues>({
    mode: "onBlur",
    defaultValues: {
      referenceType: document?.referenceType || "UNIT",
      referenceId: document?.referenceId || "",
      documentType: document?.documentType || "",
      name: document?.name || "",
      fileUrl: document?.fileUrl || "",
      status: document?.status || "PENDING",
    },
  });

  const onSubmit = async (data: DealerDocumentFormValues) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        referenceType: data.referenceType,
        referenceId: data.referenceId || null,
        documentType: data.documentType.trim(),
        name: data.name.trim(),
        fileUrl: data.fileUrl.trim(),
        status: data.status,
      };
      if (document?.id) {
        await dealerDocumentService.update(document.id, payload);
      } else {
        await dealerDocumentService.create(payload);
      }
      await onSave();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  return (
    <form
      id={formId || "dealer-document-form"}
      onSubmit={handleSubmit(onSubmit)}
      className="p-fluid"
    >
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Tipo Referencia</label>
          <Controller
            name="referenceType"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={DOCUMENT_REF_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">ID Referencia</label>
          <Controller
            name="referenceId"
            control={control}
            render={({ field }) => (
              <InputText {...field} value={field.value || ""} />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Tipo Documento *</label>
          <Controller
            name="documentType"
            control={control}
            rules={{ required: "Tipo documento requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.documentType ? "p-invalid" : ""}
                autoFocus
              />
            )}
          />
          {errors.documentType && (
            <small className="p-error">{errors.documentType.message}</small>
          )}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estatus</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={DOCUMENT_STATUS_OPTIONS}
              />
            )}
          />
        </div>

        <div className="col-12 field">
          <label className="font-semibold">Nombre *</label>
          <Controller
            name="name"
            control={control}
            rules={{ required: "Nombre requerido" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.name ? "p-invalid" : ""}
              />
            )}
          />
          {errors.name && (
            <small className="p-error">{errors.name.message}</small>
          )}
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">URL Archivo *</label>
          <Controller
            name="fileUrl"
            control={control}
            rules={{ required: "URL requerida" }}
            render={({ field }) => (
              <InputText
                {...field}
                className={errors.fileUrl ? "p-invalid" : ""}
              />
            )}
          />
          {errors.fileUrl && (
            <small className="p-error">{errors.fileUrl.message}</small>
          )}
        </div>
      </div>
    </form>
  );
}
