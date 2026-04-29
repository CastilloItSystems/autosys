"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import customerCrmService from "@/app/api/crm/customerCrmService";
import CustomerForm from "@/components/sales/customer/CustomerForm";
import FormActionButtons from "@/shared/components/FormActionButtons";
import type { CustomerCrm } from "@/libs/interfaces/crm/customer.crm.interface";

interface CustomerSelectorProps {
  value: string | null | undefined;
  onChange: (id: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  showCreate?: boolean;
}

export default function CustomerSelector({
  value,
  onChange,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar cliente...",
  showCreate = true,
}: CustomerSelectorProps) {
  const toast = useRef<Toast>(null);
  const [customers, setCustomers] = useState<CustomerCrm[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customerCrmService
      .getActive()
      .then((res) => {
        if (!cancelled) setCustomers(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setCustomers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () =>
      customers.map((c) => ({
        label: `${c.name} (${c.code})`,
        value: c.id,
      })),
    [customers],
  );

  const handleCreated = async (created?: any) => {
    setCreateDialog(false);
    if (created?.id) {
      setCustomers((prev) => [...prev, created as CustomerCrm]);
      onChange(created.id);
    } else {
      setLoading(true);
      customerCrmService
        .getActive()
        .then((res) => setCustomers(Array.isArray(res?.data) ? res.data : []))
        .finally(() => setLoading(false));
    }
  };

  const footer = showCreate ? (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nuevo cliente"
        icon="pi pi-plus"
        text
        size="small"
        type="button"
        className="w-full justify-content-start"
        onClick={() => setCreateDialog(true)}
      />
    </div>
  ) : undefined;

  return (
    <>
      <Toast ref={toast} />

      <Dropdown
        value={value ?? null}
        options={options}
        onChange={(e) => onChange(e.value)}
        placeholder={loading ? "Cargando clientes..." : placeholder}
        disabled={disabled || loading}
        filter
        showClear
        filterPlaceholder="Buscar cliente..."
        emptyMessage="Sin clientes"
        emptyFilterMessage="Sin resultados"
        panelFooterTemplate={footer}
        className={invalid ? "p-invalid w-full" : "w-full"}
      />

      <Dialog
        visible={createDialog}
        style={{ width: "640px" }}
        breakpoints={{ "900px": "75vw", "600px": "100vw" }}
        header="Nuevo cliente"
        modal
        onHide={() => setCreateDialog(false)}
        footer={
          <FormActionButtons
            formId="customer-form-selector"
            isUpdate={false}
            onCancel={() => setCreateDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <CustomerForm
          customer={null}
          formId="customer-form-selector"
          onSave={() => {}}
          onCreated={handleCreated}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  );
}
