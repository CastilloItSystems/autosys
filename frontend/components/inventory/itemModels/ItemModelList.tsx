"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import {
  getItemModels,
  deleteItemModel,
} from "@/app/api/inventory/itemModelService";
import ItemModelForm from "./ItemModelForm";
import { ProgressSpinner } from "primereact/progressspinner";
import CreateButton from "@/components/common/CreateButton";
import CustomActionButtons from "@/components/common/CustomActionButtons";

const ItemModelList = () => {
  const [models, setModels] = useState<any[]>([]);
  const [model, setModel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const toast = useRef<Toast | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await getItemModels();
      if (res && Array.isArray(res.models)) setModels(res.models);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setModel(null);
    setFormDialog(true);
  };

  const hideFormDialog = () => {
    setModel(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (model?.id) {
        await deleteItemModel(model.id);
        setModels(models.filter((b) => b.id !== model.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Modelo eliminado",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setModel(null);
      setDeleteDialog(false);
    }
  };

  const actionBody = (rowData: any) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={() => {
        setModel(rowData);
        setFormDialog(true);
      }}
      onDelete={() => {
        setModel(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  return (
    <div>
      <Toast ref={toast} />
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Modelos</h2>
          <CreateButton onClick={openFormDialog} />
        </div>

        {loading ? (
          <div className="flex align-items-center justify-content-center p-5">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable value={models} responsiveLayout="scroll">
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
        header={model ? "Editar Modelo" : "Crear Modelo"}
        style={{ width: "50%" }}
        content={
          <ItemModelForm
            model={model}
            hideFormDialog={hideFormDialog}
            models={models}
            setModels={setModels}
            setModel={setModel}
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
            ¿Eliminar el modelo <strong>{model?.nombre}</strong>?
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

export default ItemModelList;
