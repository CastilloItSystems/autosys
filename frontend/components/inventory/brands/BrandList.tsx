"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { getBrands, deleteBrand } from "@/app/api/inventory/brandService";
import BrandForm from "./BrandForm";
import { ProgressSpinner } from "primereact/progressspinner";
import CreateButton from "@/components/common/CreateButton";
import CustomActionButtons from "@/components/common/CustomActionButtons";

const BrandList = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [brand, setBrand] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await getBrands();
      if (res && Array.isArray(res.brands)) setBrands(res.brands);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setBrand(null);
    setFormDialog(true);
  };

  const hideFormDialog = () => {
    setBrand(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (brand?.id) {
        await deleteBrand(brand.id);
        setBrands(brands.filter((b) => b.id !== brand.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Marca eliminada",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBrand(null);
      setDeleteDialog(false);
    }
  };

  const actionBody = (rowData: any) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={() => {
        setBrand(rowData);
        setFormDialog(true);
      }}
      onDelete={() => {
        setBrand(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  return (
    <div>
      <Toast ref={toast} />
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Marcas</h2>
          <CreateButton onClick={openFormDialog} />
        </div>

        {loading ? (
          <div className="flex align-items-center justify-content-center p-5">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable value={brands} responsiveLayout="scroll">
            <Column field="nombre" header="Nombre" />
            <Column
              body={actionBody}
              header="Acciones"
              style={{ width: "8rem" }}
            />
          </DataTable>
        )}
      </div>

      <Dialog
        visible={formDialog}
        onHide={hideFormDialog}
        header={brand ? "Editar Marca" : "Crear Marca"}
        style={{ width: "50%" }}
        content={
          <BrandForm
            brand={brand}
            hideFormDialog={hideFormDialog}
            brands={brands}
            setBrands={setBrands}
            setBrand={setBrand}
            showToast={(s, t, d) =>
              toast.current?.show({ severity: s, summary: t, detail: d })
            }
            toast={toast}
          />
        }
      ></Dialog>

      <Dialog
        visible={deleteDialog}
        onHide={() => setDeleteDialog(false)}
        header="Confirmar"
        style={{ width: "30%" }}
      >
        <div className="flex flex-column gap-3">
          <p>
            ¿Eliminar la marca <strong>{brand?.nombre}</strong>?
          </p>
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" onClick={() => setDeleteDialog(false)} />
            <Button
              label="Eliminar"
              className="p-button-danger"
              onClick={handleDelete}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default BrandList;
