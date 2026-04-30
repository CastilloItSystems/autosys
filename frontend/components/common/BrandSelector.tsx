"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import brandsService, {
  type Brand,
  type BrandType,
} from "@/modules/inventory/brands/services/brandService";
import BrandForm from "@/modules/inventory/brands/components/BrandForm";
import FormActionButtons from "@/shared/components/FormActionButtons";

interface BrandSelectorProps {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  showCreate?: boolean;
  type?: BrandType;
}

export default function BrandSelector({
  value,
  onChange,
  disabled = false,
  invalid = false,
  placeholder = "Seleccionar marca...",
  showCreate = true,
  type,
}: BrandSelectorProps) {
  const toast = useRef<Toast>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    brandsService
      .getActive(type)
      .then((res) => {
        if (!cancelled) setBrands(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const options = useMemo(
    () =>
      brands.map((b) => ({
        label: b.name,
        value: b.id,
      })),
    [brands],
  );

  const handleCreated = async (created?: any) => {
    setCreateDialog(false);
    if (created?.id) {
      setBrands((prev) => [...prev, created as Brand]);
      onChange(created.id);
    } else {
      setLoading(true);
      brandsService
        .getActive(type)
        .then((res) => setBrands(Array.isArray(res?.data) ? res.data : []))
        .finally(() => setLoading(false));
    }
  };

  const footer = showCreate ? (
    <div className="p-2 border-top-1 surface-border">
      <Button
        label="Nueva marca"
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
        placeholder={loading ? "Cargando marcas..." : placeholder}
        disabled={disabled || loading}
        filter
        showClear
        filterPlaceholder="Buscar marca..."
        emptyMessage="Sin marcas"
        emptyFilterMessage="Sin resultados"
        panelFooterTemplate={footer}
        className={invalid ? "p-invalid w-full" : "w-full"}
      />

      <Dialog
        visible={createDialog}
        style={{ width: "560px" }}
        breakpoints={{ "900px": "75vw", "600px": "100vw" }}
        header="Nueva marca"
        modal
        onHide={() => setCreateDialog(false)}
        footer={
          <FormActionButtons
            formId="brand-form-selector"
            isUpdate={false}
            onCancel={() => setCreateDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <BrandForm
          brand={null}
          formId="brand-form-selector"
          onSave={() => {}}
          onCreated={handleCreated}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  );
}
