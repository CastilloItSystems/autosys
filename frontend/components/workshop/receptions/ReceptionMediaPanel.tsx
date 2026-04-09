"use client";
import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import receptionMediaService, {
  type ReceptionDamage,
  type ReceptionPhoto,
  type DamageSeverity,
  type PhotoType,
} from "@/app/api/workshop/receptionMediaService";

const SEVERITY_CONFIG: Record<
  DamageSeverity,
  { label: string; severity: "success" | "warning" | "danger" }
> = {
  MINOR: { label: "Menor", severity: "success" },
  MODERATE: { label: "Moderado", severity: "warning" },
  SEVERE: { label: "Severo", severity: "danger" },
};

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  FRONTAL: "Frontal",
  REAR: "Trasera",
  LEFT: "Lateral izq.",
  RIGHT: "Lateral der.",
  INTERIOR: "Interior",
  DAMAGE: "Daño",
  DOCUMENT: "Documento",
  OTHER: "Otra",
};

const SEVERITY_OPTIONS = [
  { label: "Menor", value: "MINOR" },
  { label: "Moderado", value: "MODERATE" },
  { label: "Severo", value: "SEVERE" },
];

const PHOTO_TYPE_OPTIONS = Object.entries(PHOTO_TYPE_LABELS).map(
  ([value, label]) => ({ label, value }),
);

interface Props {
  receptionId: string;
  readOnly?: boolean;
  toast: React.RefObject<any>;
}

export default function ReceptionMediaPanel({
  receptionId,
  readOnly = false,
  toast,
}: Props) {
  const [damages, setDamages] = useState<ReceptionDamage[]>([]);
  const [photos, setPhotos] = useState<ReceptionPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  // Damage form
  const [damageDialog, setDamageDialog] = useState(false);
  const [editDamage, setEditDamage] = useState<ReceptionDamage | null>(null);
  const [damageForm, setDamageForm] = useState({
    zone: "",
    description: "",
    severity: "MINOR" as DamageSeverity,
    photoUrl: "",
  });
  const [damageFile, setDamageFile] = useState<File | null>(null);
  const [damagePreview, setDamagePreview] = useState<string | null>(null);
  const [savingDamage, setSavingDamage] = useState(false);

  // Photo form
  const [photoDialog, setPhotoDialog] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    url: "",
    type: "OTHER" as PhotoType,
    description: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  useEffect(() => {
    load();
  }, [receptionId]);

  // ── Damage handlers ────────────────────────────────────────────────────────
  const openNewDamage = () => {
    setEditDamage(null);
    setDamageForm({
      zone: "",
      description: "",
      severity: "MINOR",
      photoUrl: "",
    });
    setDamageFile(null);
    setDamagePreview(null);
    setDamageDialog(true);
  };
  const openEditDamage = (d: ReceptionDamage) => {
    setEditDamage(d);
    setDamageForm({
      zone: d.zone,
      description: d.description,
      severity: d.severity,
      photoUrl: d.photoUrl ?? "",
    });
    setDamageFile(null);
    setDamagePreview(d.photoUrl ?? null);
    setDamageDialog(true);
  };
  const handleDamageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDamageFile(file);
      setDamagePreview(URL.createObjectURL(file));
    }
  };
  const saveDamage = async () => {
    if (!damageForm.zone || !damageForm.description) return;
    setSavingDamage(true);
    try {
      let finalPhotoUrl = damageForm.photoUrl;
      if (damageFile) {
        const { url } = await receptionMediaService.uploadMedia(
          receptionId,
          damageFile,
        );
        finalPhotoUrl = url;
      }

      const payload = { ...damageForm, photoUrl: finalPhotoUrl || undefined };
      if (editDamage) {
        await receptionMediaService.editDamage(
          receptionId,
          editDamage.id,
          payload,
        );
      } else {
        await receptionMediaService.addDamage(receptionId, payload);
      }
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: editDamage ? "Daño actualizado" : "Daño registrado",
        life: 3000,
      });
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
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Daño eliminado",
        life: 3000,
      });
      load();
    } catch (err) {
      handleFormError(err, toast.current!);
    }
  };

  // ── Photo handlers ─────────────────────────────────────────────────────────
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };
  const openNewPhoto = () => {
    setPhotoForm({ url: "", type: "OTHER", description: "" });
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoDialog(true);
  };
  const savePhoto = async () => {
    if (!photoForm.url && !photoFile) return;
    setSavingPhoto(true);
    try {
      let finalUrl = photoForm.url;
      if (photoFile) {
        const { url } = await receptionMediaService.uploadMedia(
          receptionId,
          photoFile,
        );
        finalUrl = url;
      }
      await receptionMediaService.addPhoto(receptionId, {
        ...photoForm,
        url: finalUrl,
        description: photoForm.description || undefined,
      });
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Foto registrada",
        life: 3000,
      });
      setPhotoDialog(false);
      setPhotoForm({ url: "", type: "OTHER", description: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
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
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Foto eliminada",
        life: 3000,
      });
      load();
    } catch (err) {
      handleFormError(err, toast.current!);
    }
  };

  if (loading)
    return (
      <div className="flex justify-content-center py-4">
        <ProgressSpinner style={{ width: 36, height: 36 }} />
      </div>
    );

  return (
    <>
      {/* ── Sección Daños ── */}
      <div className="mb-5">
        <div className="flex align-items-center justify-content-between mb-3 pb-2 border-bottom-1 border-200">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-exclamation-triangle text-orange-500"></i>
            <span className="font-semibold text-base text-700">
              Daños registrados
            </span>
            {damages.length > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 border-round">
                {damages.length}
              </span>
            )}
          </div>
          {!readOnly && (
            <Button
              type="button"
              label="Agregar daño"
              icon="pi pi-plus"
              size="small"
              onClick={(e) => {
                e.preventDefault();
                openNewDamage();
              }}
            />
          )}
        </div>

        <DataTable
          value={damages}
          size="small"
          emptyMessage="Sin daños registrados"
        >
          <Column field="zone" header="Zona" />
          <Column
            field="description"
            header="Descripción"
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Foto"
            body={(row: ReceptionDamage) => {
              if (!row.photoUrl)
                return <span className="text-500 text-sm">—</span>;
              return (
                <img
                  src={row.photoUrl}
                  alt="Foto del daño"
                  style={{
                    width: "40px",
                    height: "40px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => row.photoUrl && window.open(row.photoUrl, "_blank")}
                />
              );
            }}
          />
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
                  <Button
                    type="button"
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      openEditDamage(row);
                    }}
                  />
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    onClick={(e) => {
                      e.preventDefault();
                      removeDamage(row.id);
                    }}
                  />
                </div>
              )}
              style={{ width: "80px" }}
            />
          )}
        </DataTable>
      </div>

      {/* ── Sección Fotos ── */}
      <div>
        <div className="flex align-items-center justify-content-between mb-3 pb-2 border-bottom-1 border-200">
          <div className="flex align-items-center gap-2">
            <i className="pi pi-images text-primary"></i>
            <span className="font-semibold text-base text-700">
              Fotos del vehículo
            </span>
            {photos.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 border-round">
                {photos.length}
              </span>
            )}
          </div>
          {!readOnly && (
            <Button
              type="button"
              label="Agregar foto"
              icon="pi pi-plus"
              size="small"
              onClick={(e) => {
                e.preventDefault();
                openNewPhoto();
              }}
            />
          )}
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-column align-items-center justify-content-center py-5 surface-50 border-round border-1 border-dashed border-300">
            <i className="pi pi-images text-4xl text-300 mb-3"></i>
            <span className="text-500 text-sm">Sin fotos registradas</span>
          </div>
        ) : (
          <div className="grid">
            {photos.map((ph, idx) => (
              <div key={ph.id} className="col-6 md:col-3">
                <div className="relative border-round overflow-hidden surface-100 cursor-pointer"
                  style={{ aspectRatio: "4/3" }}
                  onClick={() => {
                    setGalleriaIndex(idx);
                    setGalleriaVisible(true);
                  }}
                >
                  <img
                    src={ph.url}
                    alt={ph.description ?? ph.type}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex align-items-center justify-content-between px-2 py-1 bg-black-alpha-60">
                    <span className="text-white text-xs font-medium">
                      {PHOTO_TYPE_LABELS[ph.type]}
                    </span>
                    <i className="pi pi-search-plus text-white text-xs"></i>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      className="absolute top-0 right-0 m-1 flex align-items-center justify-content-center w-2rem h-2rem bg-black-alpha-50 border-round border-none cursor-pointer hover:bg-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(ph.id);
                      }}
                    >
                      <i className="pi pi-trash text-white text-xs"></i>
                    </button>
                  )}
                </div>
                {ph.description && (
                  <p className="text-500 text-xs mt-1 mb-0 text-center">
                    {ph.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dialog Fullscreen para fotos */}
        <Dialog
          visible={galleriaVisible}
          onHide={() => setGalleriaVisible(false)}
          style={{ width: "95vw", height: "95vh" }}
          maximizable
          modal
          header={
            <div className="flex align-items-center justify-content-between w-full">
              <span>
                {PHOTO_TYPE_LABELS[photos[galleriaIndex]?.type]}
                {photos[galleriaIndex]?.description && (
                  <span className="ml-3 text-sm text-600">
                    {photos[galleriaIndex].description}
                  </span>
                )}
              </span>
              <span className="text-sm text-600">
                {galleriaIndex + 1} / {photos.length}
              </span>
            </div>
          }
        >
          <div className="flex align-items-center justify-content-center h-full bg-black-alpha-90">
            <img
              src={photos[galleriaIndex]?.url}
              alt={photos[galleriaIndex]?.description ?? photos[galleriaIndex]?.type}
              style={{ maxHeight: "80vh", maxWidth: "100%", objectFit: "contain" }}
            />
          </div>
          <Toolbar
            start={
              <Button
                type="button"
                icon="pi pi-chevron-left"
                rounded
                text
                onClick={() =>
                  setGalleriaIndex((galleriaIndex - 1 + photos.length) % photos.length)
                }
              />
            }
            center={
              <span className="text-sm text-600">
                Usa las flechas para navegar
              </span>
            }
            end={
              <Button
                type="button"
                icon="pi pi-chevron-right"
                rounded
                text
                onClick={() =>
                  setGalleriaIndex((galleriaIndex + 1) % photos.length)
                }
              />
            }
            className="bg-transparent border-none p-0"
          />
        </Dialog>
      </div>

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
            <Button
              type="button"
              label="Cancelar"
              outlined
              severity="secondary"
              onClick={(e) => {
                e.preventDefault();
                setDamageDialog(false);
              }}
              disabled={savingDamage}
            />
            <Button
              type="button"
              label="Guardar"
              icon="pi pi-check"
              onClick={(e) => {
                e.preventDefault();
                saveDamage();
              }}
              loading={savingDamage}
            />
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveDamage();
          }}
          className="flex flex-column gap-3 p-fluid"
        >
          <div>
            <label className="block text-900 font-medium mb-1">
              Zona <span className="text-red-500">*</span>
            </label>
            <InputText
              value={damageForm.zone}
              onChange={(e) =>
                setDamageForm((f) => ({ ...f, zone: e.target.value }))
              }
              placeholder="Ej: Puerta delantera izq."
            />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              value={damageForm.description}
              onChange={(e) =>
                setDamageForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Describe el daño..."
            />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">Severidad</label>
            <Dropdown
              value={damageForm.severity}
              options={SEVERITY_OPTIONS}
              onChange={(e) =>
                setDamageForm((f) => ({ ...f, severity: e.value }))
              }
            />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">
              Foto (opcional)
            </label>
            <div className="flex align-items-center gap-3">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="damage-file-upload"
                style={{ display: "none" }}
                onChange={handleDamageFileChange}
              />
              <Button
                type="button"
                icon="pi pi-camera"
                label="Seleccionar foto"
                outlined
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("damage-file-upload")?.click();
                }}
              />
              {damagePreview && (
                <img
                  src={damagePreview}
                  alt="Previsualización"
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              )}
            </div>
          </div>
        </form>
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
            <Button
              type="button"
              label="Cancelar"
              outlined
              severity="secondary"
              onClick={(e) => {
                e.preventDefault();
                setPhotoDialog(false);
              }}
              disabled={savingPhoto}
            />
            <Button
              type="button"
              label="Guardar"
              icon="pi pi-check"
              onClick={(e) => {
                e.preventDefault();
                savePhoto();
              }}
              loading={savingPhoto}
            />
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            savePhoto();
          }}
          className="flex flex-column gap-3 p-fluid"
        >
          <div>
            <label className="block text-900 font-medium mb-1">
              Foto <span className="text-red-500">*</span>
            </label>
            <div className="flex align-items-center gap-3">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="photo-file-upload"
                style={{ display: "none" }}
                onChange={handlePhotoFileChange}
              />
              <Button
                type="button"
                icon="pi pi-camera"
                label="Seleccionar foto"
                outlined
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("photo-file-upload")?.click();
                }}
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Previsualización"
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">Tipo</label>
            <Dropdown
              value={photoForm.type}
              options={PHOTO_TYPE_OPTIONS}
              onChange={(e) => setPhotoForm((f) => ({ ...f, type: e.value }))}
            />
          </div>
          <div>
            <label className="block text-900 font-medium mb-1">
              Descripción
            </label>
            <InputText
              value={photoForm.description}
              onChange={(e) =>
                setPhotoForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Descripción opcional..."
            />
          </div>
        </form>
      </Dialog>
    </>
  );
}
