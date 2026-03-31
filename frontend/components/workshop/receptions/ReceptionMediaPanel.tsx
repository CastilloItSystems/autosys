"use client";
import React, { useEffect, useState, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Galleria } from "primereact/galleria";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import receptionMediaService, {
  type ReceptionDamage,
  type ReceptionPhoto,
  type DamageSeverity,
  type PhotoType,
} from "@/app/api/workshop/receptionMediaService";

const SEVERITY_CONFIG: Record<DamageSeverity, { label: string; severity: "success" | "warning" | "danger" }> = {
  MINOR: { label: "Menor", severity: "success" },
  MODERATE: { label: "Moderado", severity: "warning" },
  SEVERE: { label: "Severo", severity: "danger" },
};

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  FRONTAL: "Frontal", REAR: "Trasera", LEFT: "Lateral izq.", RIGHT: "Lateral der.",
  INTERIOR: "Interior", DAMAGE: "Daño", DOCUMENT: "Documento", OTHER: "Otra",
};

const SEVERITY_OPTIONS = [
  { label: "Menor", value: "MINOR" },
  { label: "Moderado", value: "MODERATE" },
  { label: "Severo", value: "SEVERE" },
];

const PHOTO_TYPE_OPTIONS = Object.entries(PHOTO_TYPE_LABELS).map(([value, label]) => ({ label, value }));

interface Props {
  receptionId: string;
  readOnly?: boolean;
}

export default function ReceptionMediaPanel({ receptionId, readOnly = false }: Props) {
  const toast = useRef<Toast>(null);
  const [damages, setDamages] = useState<ReceptionDamage[]>([]);
  const [photos, setPhotos] = useState<ReceptionPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  // Damage form
  const [damageDialog, setDamageDialog] = useState(false);
  const [editDamage, setEditDamage] = useState<ReceptionDamage | null>(null);
  const [damageForm, setDamageForm] = useState({ zone: "", description: "", severity: "MINOR" as DamageSeverity, photoUrl: "" });
  const [savingDamage, setSavingDamage] = useState(false);

  // Photo form
  const [photoDialog, setPhotoDialog] = useState(false);
  const [photoForm, setPhotoForm] = useState({ url: "", type: "OTHER" as PhotoType, description: "" });
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Galleria
  const [galleriaVisible, setGalleriaVisible] = useState(false);
  const [galleriaIndex, setGalleriaIndex] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [dmgRes, phRes] = await Promise.all([
        receptionMediaService.getDamages(receptionId),
        receptionMediaService.getPhotos(receptionId),
      ]);
      setDamages(dmgRes.data ?? []);
      setPhotos(phRes.data ?? []);
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [receptionId]);

  // ── Damage handlers ────────────────────────────────────────────────────────
  const openNewDamage = () => {
    setEditDamage(null);
    setDamageForm({ zone: "", description: "", severity: "MINOR", photoUrl: "" });
    setDamageDialog(true);
  };
  const openEditDamage = (d: ReceptionDamage) => {
    setEditDamage(d);
    setDamageForm({ zone: d.zone, description: d.description, severity: d.severity, photoUrl: d.photoUrl ?? "" });
    setDamageDialog(true);
  };
  const saveDamage = async () => {
    if (!damageForm.zone || !damageForm.description) return;
    setSavingDamage(true);
    try {
      const payload = { ...damageForm, photoUrl: damageForm.photoUrl || undefined };
      if (editDamage) {
        await receptionMediaService.editDamage(receptionId, editDamage.id, payload);
      } else {
        await receptionMediaService.addDamage(receptionId, payload);
      }
      toast.current?.show({ severity: "success", summary: "Éxito", detail: editDamage ? "Daño actualizado" : "Daño registrado", life: 3000 });
      setDamageDialog(false);
      load();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setSavingDamage(false);
    }
  };
  const removeDamage = async (id: string) => {
    try {
      await receptionMediaService.removeDamage(receptionId, id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Daño eliminado", life: 3000 });
      load();
    } catch (err) {
      handleFormError(err, toast.current!);
    }
  };

  // ── Photo handlers ─────────────────────────────────────────────────────────
  const savePhoto = async () => {
    if (!photoForm.url) return;
    setSavingPhoto(true);
    try {
      await receptionMediaService.addPhoto(receptionId, { ...photoForm, description: photoForm.description || undefined });
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Foto registrada", life: 3000 });
      setPhotoDialog(false);
      setPhotoForm({ url: "", type: "OTHER", description: "" });
      load();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setSavingPhoto(false);
    }
  };
  const removePhoto = async (id: string) => {
    try {
      await receptionMediaService.removePhoto(receptionId, id);
      toast.current?.show({ severity: "success", summary: "Éxito", detail: "Foto eliminada", life: 3000 });
      load();
    } catch (err) {
      handleFormError(err, toast.current!);
    }
  };

  if (loading) return <div className="flex justify-content-center py-4"><ProgressSpinner style={{ width: 36, height: 36 }} /></div>;

  return (
    <>
      <Toast ref={toast} />

      <TabView>
        {/* ── Daños ── */}
        <TabPanel header="Daños" leftIcon="pi pi-exclamation-triangle mr-2">
          <div className="flex justify-content-end mb-2">
            {!readOnly && (
              <Button label="Agregar daño" icon="pi pi-plus" size="small" onClick={openNewDamage} />
            )}
          </div>
          <DataTable value={damages} size="small" emptyMessage="Sin daños registrados">
            <Column field="zone" header="Zona" />
            <Column field="description" header="Descripción" style={{ minWidth: "200px" }} />
            <Column
              field="severity"
              header="Severidad"
              body={(row: ReceptionDamage) => {
                const cfg = SEVERITY_CONFIG[row.severity];
                return <Tag value={cfg.label} severity={cfg.severity} />;
              }}
            />
            {!readOnly && (
              <Column
                header=""
                body={(row: ReceptionDamage) => (
                  <div className="flex gap-1">
                    <Button icon="pi pi-pencil" text rounded size="small" onClick={() => openEditDamage(row)} />
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger" onClick={() => removeDamage(row.id)} />
                  </div>
                )}
                style={{ width: "80px" }}
              />
            )}
          </DataTable>
        </TabPanel>

        {/* ── Fotos ── */}
        <TabPanel header={`Fotos (${photos.length})`} leftIcon="pi pi-images mr-2">
          <div className="flex justify-content-end mb-2">
            {!readOnly && (
              <Button label="Agregar foto" icon="pi pi-plus" size="small" onClick={() => setPhotoDialog(true)} />
            )}
          </div>
          {photos.length === 0 ? (
            <div className="text-center text-500 py-4">Sin fotos registradas</div>
          ) : (
            <div className="grid">
              {photos.map((ph, idx) => (
                <div key={ph.id} className="col-6 md:col-3 p-2">
                  <div
                    className="border-round overflow-hidden surface-100 relative cursor-pointer"
                    style={{ aspectRatio: "4/3" }}
                    onClick={() => { setGalleriaIndex(idx); setGalleriaVisible(true); }}
                  >
                    <img
                      src={ph.url}
                      alt={ph.description ?? ph.type}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-image.png"; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black-alpha-50 px-2 py-1">
                      <span className="text-white text-xs">{PHOTO_TYPE_LABELS[ph.type]}</span>
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      icon="pi pi-trash"
                      text
                      severity="danger"
                      size="small"
                      className="w-full mt-1"
                      label="Eliminar"
                      onClick={() => removePhoto(ph.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <Galleria
            value={photos}
            activeIndex={galleriaIndex}
            onItemChange={(e) => setGalleriaIndex(e.index)}
            visible={galleriaVisible}
            onHide={() => setGalleriaVisible(false)}
            fullScreen
            circular
            showItemNavigators
            showThumbnails={false}
            item={(item: ReceptionPhoto) => (
              <img src={item.url} alt={item.description ?? item.type} style={{ maxHeight: "80vh", maxWidth: "90vw", objectFit: "contain" }} />
            )}
            caption={(item: ReceptionPhoto) => (
              <div className="text-center">
                <span className="font-semibold">{PHOTO_TYPE_LABELS[item.type]}</span>
                {item.description && <span className="ml-2 text-300">{item.description}</span>}
              </div>
            )}
          />
        </TabPanel>
      </TabView>

      {/* Damage Dialog */}
      <Dialog
        visible={damageDialog}
        onHide={() => setDamageDialog(false)}
        header={editDamage ? "Editar daño" : "Registrar daño"}
        style={{ width: "420px" }}
        modal
        draggable={false}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined severity="secondary" onClick={() => setDamageDialog(false)} disabled={savingDamage} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveDamage} loading={savingDamage} />
          </div>
        }
      >
        <div className="flex flex-column gap-3 p-fluid">
          <div>
            <label className="block text-900 font-medium mb-1">Zona <span className="text-red-500">*</span></label>
            <InputText value={damageForm.zone} onChange={(e) => setDamageForm((f) => ({ ...f, zone: e.target.value }))} placeholder="Ej: Puerta delantera izq." />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">Descripción <span className="text-red-500">*</span></label>
            <InputTextarea value={damageForm.description} onChange={(e) => setDamageForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe el daño..." />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">Severidad</label>
            <Dropdown value={damageForm.severity} options={SEVERITY_OPTIONS} onChange={(e) => setDamageForm((f) => ({ ...f, severity: e.value }))} />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">URL foto (opcional)</label>
            <InputText value={damageForm.photoUrl} onChange={(e) => setDamageForm((f) => ({ ...f, photoUrl: e.target.value }))} placeholder="https://..." />
          </div>
        </div>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog
        visible={photoDialog}
        onHide={() => setPhotoDialog(false)}
        header="Agregar foto"
        style={{ width: "400px" }}
        modal
        draggable={false}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined severity="secondary" onClick={() => setPhotoDialog(false)} disabled={savingPhoto} />
            <Button label="Guardar" icon="pi pi-check" onClick={savePhoto} loading={savingPhoto} />
          </div>
        }
      >
        <div className="flex flex-column gap-3 p-fluid">
          <div>
            <label className="block text-900 font-medium mb-1">URL de la foto <span className="text-red-500">*</span></label>
            <InputText value={photoForm.url} onChange={(e) => setPhotoForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">Tipo</label>
            <Dropdown value={photoForm.type} options={PHOTO_TYPE_OPTIONS} onChange={(e) => setPhotoForm((f) => ({ ...f, type: e.value }))} />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">Descripción</label>
            <InputText value={photoForm.description} onChange={(e) => setPhotoForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descripción opcional..." />
          </div>
        </div>
      </Dialog>
    </>
  );
}
