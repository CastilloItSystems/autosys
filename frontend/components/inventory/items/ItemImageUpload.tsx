"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import * as imageService from "@/app/api/inventory/imageUploadService";
import type { IItemImage } from "@/app/api/inventory/imageUploadService";

interface ItemImageUploadProps {
  itemId: string;
  onImagesChange?: (images: IItemImage[]) => void;
  maxImages?: number;
}

export const ItemImageUpload: React.FC<ItemImageUploadProps> = ({
  itemId,
  onImagesChange,
  maxImages = 10,
}) => {
  const toast = useRef<Toast>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<IItemImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<IItemImage | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [dragover, setDragover] = useState(false);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, [itemId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await imageService.getByItem(itemId);
      const loadedImages = response.data;
      setImages(loadedImages);
      onImagesChange?.(loadedImages);
    } catch (error: any) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate files
    for (const file of fileArray) {
      const validation = imageService.validate(file);
      if (!validation.valid) {
        toast.current?.show({
          severity: "warn",
          summary: "Archivo no válido",
          detail: validation.error,
        });
        return;
      }
    }

    // Check limits
    if (images.length + fileArray.length > maxImages) {
      toast.current?.show({
        severity: "warn",
        summary: "Límite de imágenes",
        detail: `Máximo ${maxImages} imágenes permitidas`,
      });
      return;
    }

    uploadFiles(fileArray);
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    try {
      const response = await imageService.upload(itemId, files);

      // Reload images
      await loadImages();

      toast.current?.show({
        severity: "success",
        summary: "Imágenes subidas",
        detail: `${response.data.length} imagen(es) subida(s) correctamente`,
      });
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error al subir",
        detail: error.message || "Error al subir imágenes",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await imageService.delete(id);
      await loadImages();
      toast.current?.show({
        severity: "success",
        summary: "Eliminada",
        detail: "Imagen eliminada correctamente",
      });
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar imagen",
      });
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await imageService.setPrimary(id);
      await loadImages();
      toast.current?.show({
        severity: "success",
        summary: "Actualizada",
        detail: "Imagen primaria actualizada",
      });
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al actualizar imagen primaria",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-content-center p-4">
          <ProgressSpinner />
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      <Card title="Imágenes del artículo">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed border-300 border-round p-4 mb-4 text-center transition-all ${
            dragover ? "border-primary bg-primary-50" : ""
          } ${uploading ? "opacity-60" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ cursor: "pointer" }}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: "none" }}
            disabled={uploading}
          />

          {uploading ? (
            <div>
              <ProgressSpinner style={{ width: "50px", height: "50px" }} />
              <p className="mt-2">Subiendo imágenes...</p>
            </div>
          ) : (
            <div>
              <i className="pi pi-cloud-upload text-4xl text-primary mb-2 block"></i>
              <p className="text-lg font-semibold mb-1">
                Arrastra imágenes aquí o haz click
              </p>
              <p className="text-sm text-600">
                Soporta JPEG, PNG o WebP. Máximo 5MB cada una
              </p>
              <p className="text-xs text-500 mt-2">
                {images.length}/{maxImages} imágenes
              </p>
            </div>
          )}
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div>
            <h4 className="mb-3">
              Imágenes ({images.length}/{maxImages})
            </h4>
            <div className="grid gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="col-12 sm:col-6 md:col-4 lg:col-3"
                >
                  <Card
                    className="p-0 position-relative"
                    style={{ overflow: "hidden" }}
                  >
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div
                        className="position-absolute"
                        style={{ top: "8px", right: "8px", zIndex: 1 }}
                      >
                        <Tag value="Principal" severity="success" />
                      </div>
                    )}

                    {/* Image Preview */}
                    <div
                      onClick={() => {
                        setSelectedImage(image);
                        setShowImagePreview(true);
                      }}
                      style={{
                        width: "100%",
                        height: "150px",
                        overflow: "hidden",
                        cursor: "pointer",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <img
                        src={image.url}
                        alt="Item image"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="p-2 flex gap-2 flex-wrap">
                      {!image.isPrimary && (
                        <Button
                          label="Principal"
                          icon="pi pi-star"
                          size="small"
                          severity="warning"
                          className="flex-grow-1"
                          onClick={() => handleSetPrimary(image.id)}
                        />
                      )}
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        severity="danger"
                        rounded
                        onClick={() => handleDeleteImage(image.id)}
                      />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && !uploading && (
          <div className="text-center text-600 py-4">
            <i className="pi pi-image text-3xl block mb-2"></i>
            <p>Sin imágenes aún. Sube tu primera imagen</p>
          </div>
        )}
      </Card>

      {/* Image Preview Dialog */}
      <Dialog
        visible={showImagePreview}
        onHide={() => setShowImagePreview(false)}
        header="Vista previa"
        modal
        style={{ width: "90vw", maxWidth: "600px" }}
      >
        {selectedImage && (
          <div className="text-center">
            <img
              src={selectedImage.url}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "500px" }}
            />
            {selectedImage.isPrimary && (
              <div className="mt-3">
                <Tag value="Imagen principal" severity="success" />
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ItemImageUpload;
