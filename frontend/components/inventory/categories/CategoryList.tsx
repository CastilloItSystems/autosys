"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import {
  getCategories,
  deleteCategory,
} from "@/app/api/inventory/categoryService";
import CategoryForm from "./CategoryForm";
import { ProgressSpinner } from "primereact/progressspinner";
import CreateButton from "@/components/common/CreateButton";
import CustomActionButtons from "@/components/common/CustomActionButtons";

const CategoryList = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res && Array.isArray(res.categories)) setCategories(res.categories);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setCategory(null);
    setFormDialog(true);
  };

  const hideFormDialog = () => {
    setCategory(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (category?.id) {
        await deleteCategory(category.id);
        setCategories(categories.filter((b) => b.id !== category.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Categoría eliminada",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCategory(null);
      setDeleteDialog(false);
    }
  };

  const actionBody = (rowData: any) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={() => {
        setCategory(rowData);
        setFormDialog(true);
      }}
      onDelete={() => {
        setCategory(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  return (
    <div>
      <Toast ref={toast} />
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Categorías</h2>
          <CreateButton onClick={openFormDialog} />
        </div>

        {loading ? (
          <div className="flex align-items-center justify-content-center p-5">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable value={categories} responsiveLayout="scroll">
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
        header={category ? "Editar Categoría" : "Crear Categoría"}
        style={{ width: "50%" }}
        content={
          <CategoryForm
            category={category}
            hideFormDialog={hideFormDialog}
            categories={categories}
            setCategories={setCategories}
            setCategory={setCategory}
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
            ¿Eliminar la categoría <strong>{category?.nombre}</strong>?
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

export default CategoryList;
