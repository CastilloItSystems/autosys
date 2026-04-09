"use client";
import React, { useState, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { Galleria } from "primereact/galleria";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";

export type PhotoCategory =
  | "FRONTAL"
  | "LATERAL_LEFT"
  | "LATERAL_RIGHT"
  | "REAR"
  | "INTERIOR"
  | "DAMAGE"
  | "DOCUMENT";

export interface Photo {
  id?: string;
  category: PhotoCategory;
  fileUrl: string;
  fileName?: string;
  description?: string;
}

interface PhotoCaptureProps {
  photos: Photo[];
  onChange?: (photos: Photo[]) => void;
  onUpload?: (file: File, category: PhotoCategory) => Promise<string>;
  disabled?: boolean;
}

const CATEGORIES: { key: PhotoCategory; label: string; icon: string }[] = [
  { key: "FRONTAL", label: "Frontal", icon: "pi-car" },
  { key: "LATERAL_LEFT", label: "Lateral Izq.", icon: "pi-arrow-left" },
  { key: "LATERAL_RIGHT", label: "Lateral Der.", icon: "pi-arrow-right" },
  { key: "REAR", label: "Trasera", icon: "pi-replay" },
  { key: "INTERIOR", label: "Interior", icon: "pi-home" },
  { key: "DAMAGE", label: "Daños", icon: "pi-exclamation-triangle" },
  { key: "DOCUMENT", label: "Documentos", icon: "pi-file" },
];

export default function PhotoCapture({
  photos,
  onChange,
  onUpload,
  disabled = false,
}: PhotoCaptureProps) {
  const toastRef = useRef<Toast>(null);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState<Partial<Record<PhotoCategory, boolean>>>({});

  const getPhotosForCategory = (category: PhotoCategory) =>
    photos.filter((p) => p.category === category);

  const handleUpload = async (
    event: FileUploadHandlerEvent,
    category: PhotoCategory
  ) => {
    const file = event.files[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [category]: true }));
    try {
      let url: string;

      if (onUpload) {
        url = await onUpload(file, category);
      } else {
        // Local fallback: use object URL
        url = URL.createObjectURL(file);
      }

      const newPhoto: Photo = {
        id: `local-${Date.now()}`,
        category,
        fileUrl: url,
        fileName: file.name,
      };

      onChange?.([...photos, newPhoto]);
      toastRef.current?.show({
        severity: "success",
        summary: "Foto agregada",
        detail: file.name,
        life: 2000,
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error al subir",
        detail: err?.message ?? "No se pudo subir la foto",
        life: 4000,
      });
    } finally {
      setUploading((prev) => ({ ...prev, [category]: false }));
    }
  };

  const handleRemove = (photo: Photo) => {
    onChange?.(photos.filter((p) => p !== photo));
  };

  const itemTemplate = (photo: Photo) => (
    <div className="relative" style={{ width: 120, height: 100 }}>
      <img
        src={photo.fileUrl}
        alt={photo.fileName ?? "foto"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 6,
          cursor: "pointer",
        }}
        onClick={() => setPreviewPhoto(photo)}
      />
      {!disabled && (
        <Button
          icon="pi pi-times"
          rounded
          text
          severity="danger"
          size="small"
          className="absolute"
          style={{ top: 2, right: 2, width: 24, height: 24, padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            handleRemove(photo);
          }}
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
        />
      )}
      {photo.fileName && (
        <div
          className="absolute bottom-0 left-0 right-0 text-white text-xs px-1 py-1"
          style={{
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
            borderRadius: "0 0 6px 6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {photo.fileName}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Toast ref={toastRef} />

      <TabView>
        {CATEGORIES.map((cat) => {
          const catPhotos = getPhotosForCategory(cat.key);
          const isUploading = uploading[cat.key] ?? false;

          return (
            <TabPanel
              key={cat.key}
              header={
                <span className="flex align-items-center gap-2">
                  <i className={`pi ${cat.icon} text-sm`} />
                  {cat.label}
                  {catPhotos.length > 0 && (
                    <span className="bg-primary text-white border-circle text-xs px-1">
                      {catPhotos.length}
                    </span>
                  )}
                </span>
              }
            >
              <div className="flex flex-column gap-3">
                {/* Upload button */}
                {!disabled && (
                  <div>
                    <FileUpload
                      mode="basic"
                      accept="image/*"
                      maxFileSize={10_000_000}
                      chooseLabel={
                        isUploading ? "Subiendo..." : "Agregar foto"
                      }
                      chooseIcon={isUploading ? "pi pi-spin pi-spinner" : "pi pi-camera"}
                      disabled={isUploading || disabled}
                      customUpload
                      uploadHandler={(e) => handleUpload(e, cat.key)}
                      auto
                    />
                  </div>
                )}

                {/* Photo grid */}
                {catPhotos.length === 0 ? (
                  <div className="flex flex-column align-items-center justify-content-center p-4 text-500 border-1 border-dashed border-round surface-border">
                    <i className={`pi ${cat.icon} text-3xl mb-2`} />
                    <span className="text-sm">Sin fotos en esta categoría</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {catPhotos.map((photo, idx) => (
                      <div key={photo.id ?? idx}>{itemTemplate(photo)}</div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>
          );
        })}
      </TabView>

      {/* Full-size preview dialog */}
      <Dialog
        header={previewPhoto?.fileName ?? "Vista previa"}
        visible={!!previewPhoto}
        onHide={() => setPreviewPhoto(null)}
        style={{ width: "min(700px, 95vw)" }}
        dismissableMask
      >
        {previewPhoto && (
          <div className="flex justify-content-center">
            <img
              src={previewPhoto.fileUrl}
              alt={previewPhoto.fileName ?? "foto"}
              style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
            />
          </div>
        )}
      </Dialog>
    </>
  );
}
