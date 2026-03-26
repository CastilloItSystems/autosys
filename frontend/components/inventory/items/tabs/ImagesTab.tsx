"use client";
import React, { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Image } from "primereact/image";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { IItemImage } from "@/app/api/inventory/itemService";

interface ImagesTabProps {
  images: IItemImage[];
  onImagesChange: (images: IItemImage[]) => void;
}

export default function ImagesTab({ images, onImagesChange }: ImagesTabProps) {
  const [imageDialog, setImageDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    onImagesChange([
      ...images,
      { url: newImageUrl, isPrimary: images.length === 0, order: images.length },
    ]);
    setNewImageUrl("");
    setImageDialog(false);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-content-between align-items-center">
        <h3 className="text-xl font-bold text-900">Galería de Imágenes</h3>
        <Button
          type="button"
          label="+ Agregar Imagen"
          icon="pi pi-plus"
          onClick={() => setImageDialog(true)}
          size="small"
        />
      </div>

      {images.length === 0 ? (
        <div className="text-center p-4 bg-surface-50 rounded border-1 border-surface-200">
          <p className="text-surface-500">Sin imágenes cargadas</p>
        </div>
      ) : (
        <div className="grid">
          {images.map((img, idx) => (
            <div key={idx} className="col-12 md:col-6 lg:col-4 p-2">
              <div className="border-1 border-surface-200 rounded p-3">
                <div className="mb-2 flex justify-content-between align-items-start">
                  <div className="flex gap-2">
                    {img.isPrimary && (
                      <Tag value="Primaria" severity="success" icon="pi pi-star" />
                    )}
                  </div>
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    onClick={() => onImagesChange(images.filter((_, i) => i !== idx))}
                  />
                </div>
                <Image
                  src={img.url}
                  alt={`imagen-${idx}`}
                  width="100%"
                  preview
                  imageStyle={{ height: "200px", objectFit: "cover" }}
                />
                <div className="mt-3 text-sm">
                  <div className="mb-2 flex justify-content-between">
                    <span>Primaria:</span>
                    <InputSwitch
                      checked={img.isPrimary}
                      onChange={(e) =>
                        onImagesChange(
                          images.map((im, i) => ({
                            ...im,
                            isPrimary: i === idx ? e.value : false,
                          }))
                        )
                      }
                    />
                  </div>
                  <div>
                    <span>Orden: {img.order}</span>
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
        header="Agregar Imagen"
        modal
        style={{ width: "90vw", maxWidth: "500px" }}
      >
        <div className="grid gap-3">
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">URL de Imagen</label>
            <InputText
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full"
            />
          </div>
          <div className="col-12 flex gap-2 justify-content-end">
            <Button
              type="button"
              label="Cancelar"
              severity="secondary"
              onClick={() => setImageDialog(false)}
            />
            <Button type="button" label="Agregar" onClick={addImage} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
