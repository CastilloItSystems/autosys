"use client";
import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Image } from "primereact/image";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import itemService, { IItemImage } from "@/app/api/inventory/itemService";

interface ImagesTabProps {
  itemId?: string;
  images: IItemImage[];
  onImagesChange: (images: IItemImage[]) => void;
  toast: React.RefObject<any>;
}

export default function ImagesTab({
  itemId,
  images,
  onImagesChange,
  toast,
}: ImagesTabProps) {
  const [imageDialog, setImageDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileUploadRef = useRef<FileUpload>(null);

  const addImageManual = () => {
    if (!newImageUrl.trim()) return;
    onImagesChange([
      ...images,
      {
        url: newImageUrl,
        isPrimary: images.length === 0,
        order: images.length,
      },
    ]);
    setNewImageUrl("");
    setImageDialog(false);
  };

  const handleUpload = async (event: FileUploadHandlerEvent) => {
    if (!itemId) return;

    setIsUploading(true);
    try {
      const files = event.files;
      const res = await itemService.uploadItemImages(itemId, files);

      if (res.data) {
        // Combinar imágenes existentes con las nuevas
        onImagesChange([...images, ...res.data]);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: `${files.length} imágenes subidas correctamente`,
        });
      }

      fileUploadRef.current?.clear();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron subir las imágenes",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (idx: number) => {
    const imgToDelete = images[idx];

    // Si la imagen tiene ID, borrarla en el backend (R2)
    if (imgToDelete.id) {
      try {
        await itemService.deleteItemImage(imgToDelete.id);
      } catch (error) {
        console.error("Error deleting image from R2:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "No se pudo eliminar la imagen del servidor",
        });
        return; // No borrar del estado si falló el backend
      }
    }

    onImagesChange(images.filter((_, i) => i !== idx));
    toast.current?.show({
      severity: "info",
      summary: "Eliminada",
      detail: "Imagen eliminada correctamente",
    });
  };

  const handleSetPrimary = async (idx: number, checked: boolean) => {
    const img = images[idx];

    if (checked && img.id) {
      try {
        await itemService.setPrimaryImage(img.id);
      } catch (error) {
        console.error("Error setting primary image:", error);
      }
    }

    onImagesChange(
      images.map((im, i) => ({
        ...im,
        isPrimary: i === idx ? checked : false,
      })),
    );
  };

  return (
    <div className="p-4">
      {/* <div className="mb-4 flex flex-column md:flex-row justify-content-between align-items-center gap-3">
        <h3 className="text-xl font-bold text-900 m-0">Galería de Imágenes</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            label="URL Manual"
            icon="pi pi-link"
            onClick={() => setImageDialog(true)}
            severity="secondary"
            size="small"
            outlined
          />
        </div>
      </div> */}

      {!itemId ? (
        <Message
          severity="info"
          text="Debe guardar el artículo antes de poder subir imágenes al servidor."
          className="w-full mb-4"
        />
      ) : (
        <div className="mb-4">
          <FileUpload
            ref={fileUploadRef}
            name="images"
            multiple
            accept="image/*"
            maxFileSize={5000000} // 5MB
            customUpload
            uploadHandler={handleUpload}
            emptyTemplate={
              <p className="m-0">
                Arrastre y suelte imágenes aquí para subirlas.
              </p>
            }
            chooseLabel="Seleccionar"
            uploadLabel="Subir a Imagen"
            cancelLabel="Cancelar"
            className="w-full"
            disabled={isUploading}
          />
          {isUploading && (
            <div className="flex align-items-center gap-2 mt-2 text-primary">
              <ProgressSpinner
                style={{ width: "20px", height: "20px" }}
                strokeWidth="8"
              />
              <span>Subiendo archivos al articulo...</span>
            </div>
          )}
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center p-5 bg-surface-50 border-round border-1 border-dashed border-surface-300">
          <i className="pi pi-images text-4xl text-surface-400 mb-3 block"></i>
          <p className="text-surface-500 m-0">
            Sin imágenes cargadas en este artículo
          </p>
        </div>
      ) : (
        <div className="grid">
          {images.map((img, idx) => (
            <div key={img.id || idx} className="col-12 md:col-6 lg:col-4 p-2">
              <div className="surface-card border-1 border-surface-200 border-round p-3 shadow-1 h-full flex flex-column">
                <div className="mb-2 flex justify-content-between align-items-start">
                  <div className="flex gap-2">
                    {img.isPrimary && (
                      <Tag
                        value="Primaria"
                        severity="success"
                        icon="pi pi-star-fill"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    onClick={() => handleDelete(idx)}
                    tooltip="Eliminar imagen"
                  />
                </div>

                <div
                  className="flex-grow-1 flex align-items-center justify-content-center bg-black-alpha-10 border-round mb-3 overflow-hidden"
                  style={{ height: "200px" }}
                >
                  <Image
                    src={img.url}
                    alt={`imagen-${idx}`}
                    width="100%"
                    preview
                    imageStyle={{
                      maxHeight: "200px",
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />
                </div>

                <div className="mt-auto pt-2 border-top-1 border-surface-100">
                  <div className="flex justify-content-between align-items-center">
                    <span className="text-sm font-medium text-700">
                      Imagen Principal
                    </span>
                    <InputSwitch
                      checked={img.isPrimary}
                      onChange={(e) => handleSetPrimary(idx, e.value)}
                    />
                  </div>
                  <div className="mt-2 text-xs text-500 flex justify-content-between">
                    <span>Orden: {img.order}</span>
                    {img.id && (
                      <span className="text-primary">Sincronizado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        visible={imageDialog}
        onHide={() => setImageDialog(false)}
        header="Agregar Imagen por URL"
        modal
        style={{ width: "90vw", maxWidth: "500px" }}
      >
        <div className="grid gap-3 pt-2">
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">
              URL de Imagen
            </label>
            <InputText
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full"
              autoFocus
            />
          </div>
          <div className="col-12 flex gap-2 justify-content-end mt-3">
            <Button
              type="button"
              label="Cancelar"
              severity="secondary"
              text
              onClick={() => setImageDialog(false)}
            />
            <Button
              type="button"
              label="Agregar a Galería"
              onClick={addImageManual}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
