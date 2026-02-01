"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { getUnits, deleteUnit } from "@/app/api/inventory/unitService";
import UnitForm from "./UnitForm";
import { ProgressSpinner } from "primereact/progressspinner";
import CreateButton from "@/components/common/CreateButton";
import CustomActionButtons from "@/components/common/CustomActionButtons";

const UnitList = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [unit, setUnit] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const toast = useRef<any>(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await getUnits();
      if (res && Array.isArray(res.units)) setUnits(res.units);
      else if (Array.isArray(res)) setUnits(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = () => {
    setUnit(null);
    setFormDialog(true);
  };

  const hideFormDialog = () => {
    setUnit(null);
    setFormDialog(false);
  };

  const handleDelete = async () => {
    try {
      if (unit?.id) {
        await deleteUnit(unit.id);
        setUnits(units.filter((u) => u.id !== unit.id));
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Unidad eliminada",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUnit(null);
      setDeleteDialog(false);
    }
  };

  const actionBody = (rowData: any) => (
    <CustomActionButtons
      rowData={rowData}
      onEdit={() => {
        setUnit(rowData);
        setFormDialog(true);
      }}
      onDelete={() => {
        setUnit(rowData);
        setDeleteDialog(true);
      }}
    />
  );

  return (
    <div>
      <Toast ref={toast} />
      <div className="card">
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">Unidades</h2>
          <CreateButton onClick={openFormDialog} />
        </div>

        {loading ? (
          <div className="flex align-items-center justify-content-center p-5">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable value={units} responsiveLayout="scroll">
            <Column field="nombre" header="Nombre" />
            <Column field="abreviacion" header="Abreviación" />
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
        header={unit ? "Editar Unidad" : "Crear Unidad"}
        style={{ width: "50%" }}
        content={
          <UnitForm
            unit={unit}
            hideFormDialog={hideFormDialog}
            units={units}
            setUnits={setUnits}
            setUnit={setUnit}
            showToast={(s: string, t: string, d: string) =>
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
            ¿Eliminar la unidad <strong>{unit?.nombre}</strong>?
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

export default UnitList;
