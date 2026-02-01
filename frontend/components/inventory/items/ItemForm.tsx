"use client";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { itemSchema } from "@/libs/zods/inventory";
import { createItem, updateItem } from "@/app/api/inventory/itemService";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { getBrands } from "@/app/api/inventory/brandService";
import { getCategories } from "@/app/api/inventory/categoryService";
import { getItemModels } from "@/app/api/inventory/itemModelService";
import { getUnits } from "@/app/api/inventory/unitService";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { handleFormError } from "@/utils/errorHandlers";
import { LayoutContext } from "@/layout/context/layoutcontext";

type FormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  item: any;
  hideFormDialog: () => void;
  items: any[];
  setItems: (items: any[]) => void;
  setItem: (item: any) => void;
  showToast: (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => void;
  toast: React.RefObject<Toast> | null;
}

const estadoOptions = [
  { label: "Activo", value: "activo" },
  { label: "Inactivo", value: "inactivo" },
];

const ItemForm = ({
  item,
  toast,
  hideFormDialog,
  items,
  setItems,
  showToast,
}: ItemFormProps) => {
  const { layoutConfig } = useContext(LayoutContext);
  const filledInput = layoutConfig.inputStyle === "filled";

  const [submitting, setSubmitting] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [imageText, setImageText] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      unidad: "unidad",
      precioCosto: 0,
      precioVenta: 0,
      stockMinimo: 0,
      stockMaximo: 0,
      estado: "activo",
    },
  });

  useEffect(() => {
    if (item) {
      // Set form values, ensuring relational fields are set to their id (string)
      Object.keys(item).forEach((key) => {
        const k = key as keyof FormData;
        const val = (item as any)[key];
        if (
          k === "marca" ||
          k === "categoria" ||
          k === "modelo" ||
          k === "unidad"
        ) {
          // if relation is an object, use its id; otherwise use the value directly
          if (val && typeof val === "object" && (val as any).id)
            setValue(k, (val as any).id as any);
          else setValue(k, val as any);
        } else {
          setValue(k, val as any);
        }
      });
      if (item.imagenes && Array.isArray(item.imagenes)) {
        setImageText(item.imagenes.join(", "));
      }
    }
  }, [item, setValue]);

  // fetch brands, categories and models for dropdowns
  useEffect(() => {
    const load = async () => {
      try {
        const bRes = await getBrands();
        const cRes = await getCategories();
        const mRes = await getItemModels();
        // assume responses have arrays at .brands/.categories/.models or return arrays directly
        setBrands(
          Array.isArray(bRes?.brands) ? bRes.brands : bRes?.brands ?? bRes ?? []
        );
        setCategories(
          Array.isArray(cRes?.categories)
            ? cRes.categories
            : cRes?.categories ?? cRes ?? []
        );
        setModels(
          Array.isArray(mRes?.models) ? mRes.models : mRes?.models ?? mRes ?? []
        );

        const uRes = await getUnits();
        setUnits(
          Array.isArray(uRes?.units) ? uRes.units : uRes?.units ?? uRes ?? []
        );

        // normalize current item selections if item exists
        if (item) {
          // Prefer to set relational fields to their id (string) so Dropdowns bound to optionValue="id" receive the right type
          const marcaVal = (item as any).marca;
          if (marcaVal) {
            setValue(
              "marca" as any,
              typeof marcaVal === "string" ? marcaVal : marcaVal.id
            );
          }
          const categoriaVal = (item as any).categoria;
          if (categoriaVal) {
            setValue(
              "categoria" as any,
              typeof categoriaVal === "string" ? categoriaVal : categoriaVal.id
            );
          }
          const modeloVal = (item as any).modelo;
          if (modeloVal) {
            setValue(
              "modelo" as any,
              typeof modeloVal === "string" ? modeloVal : modeloVal.id
            );
          }
          const unidadVal = (item as any).unidad;
          if (unidadVal) {
            setValue(
              "unidad" as any,
              typeof unidadVal === "string" ? unidadVal : unidadVal.id
            );
          }
        }
      } catch (err) {
        console.error("Error loading select options", err);
      }
    };
    load();
  }, [item, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      // Ensure imagenes is an array parsed from the images text input
      if (imageText && (!data.imagenes || !Array.isArray(data.imagenes))) {
        // @ts-ignore
        data.imagenes = imageText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      // Normalize relations to ids if user selected objects
      const payload: any = { ...data };
      if (payload.marca && typeof payload.marca === "object")
        payload.marca = payload.marca.id;
      if (payload.categoria && typeof payload.categoria === "object")
        payload.categoria = payload.categoria.id;
      if (payload.modelo && typeof payload.modelo === "object")
        payload.modelo = payload.modelo.id;
      if (payload.unidad && typeof payload.unidad === "object")
        payload.unidad = payload.unidad.id;
      if (item) {
        const updatedItem = await updateItem(item.id, payload);
        const updatedItems = items.map((t) =>
          t.id === updatedItem.id ? updatedItem : t
        );
        setItems(updatedItems);
        showToast("success", "Éxito", "Artículo actualizado");
      } else {
        const newItem = await createItem(payload);
        setItems([...items, newItem]);
        showToast("success", "Éxito", "Artículo creado");
      }
      hideFormDialog();
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-fluid surface-50 p-3 border-round shadow-2">
          {/* Header del Formulario */}
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-box mr-3 text-primary text-3xl"></i>
                {item ? "Modificar Artículo" : "Crear Artículo"}
              </h2>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <div className="grid formgrid row-gap-2">
            {/* SKU */}
            <div className="field col-12 md:col-4">
              <label htmlFor="sku" className="font-medium text-900">
                SKU
              </label>
              <InputText
                id="sku"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("sku")}
              />
              {errors.sku && (
                <small className="p-error">{errors.sku.message}</small>
              )}
            </div>

            {/* Código */}
            <div className="field col-12 md:col-4">
              <label htmlFor="codigo" className="font-medium text-900">
                Código
              </label>
              <InputText
                id="codigo"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("codigo")}
              />
              {errors.codigo && (
                <small className="p-error">{errors.codigo.message}</small>
              )}
            </div>

            {/* Nombre */}
            <div className="field col-12 md:col-4">
              <label htmlFor="nombre" className="font-medium text-900">
                Nombre <span className="text-red-500">*</span>
              </label>
              <InputText
                id="nombre"
                type="text"
                className={classNames("w-full", {
                  "p-invalid": errors.nombre,
                  "p-filled": filledInput,
                })}
                {...register("nombre")}
              />
              {errors.nombre && (
                <small className="p-error">{errors.nombre.message}</small>
              )}
            </div>

            {/* Marca */}
            <div className="field col-12 md:col-4">
              <label htmlFor="marca" className="font-medium text-900">
                Marca
              </label>
              <Controller
                name="marca"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="marca"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={brands}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione una marca"
                    filter
                    filterBy="nombre"
                    filterPlaceholder="Buscar marca"
                    showClear
                    className={classNames("w-full", {
                      "p-invalid": errors.marca,
                    })}
                  />
                )}
              />
              {errors.marca && (
                <small className="p-error">{errors.marca.message}</small>
              )}
            </div>

            {/* Modelo */}
            <div className="field col-12 md:col-4">
              <label htmlFor="modelo" className="font-medium text-900">
                Modelo
              </label>
              <Controller
                name="modelo"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="modelo"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={models}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione un modelo"
                    filter
                    filterBy="nombre"
                    filterPlaceholder="Buscar modelo"
                    showClear
                    className={classNames("w-full", {
                      "p-invalid": errors.modelo,
                    })}
                  />
                )}
              />
              {errors.modelo && (
                <small className="p-error">{errors.modelo.message}</small>
              )}
            </div>

            {/* Categoría */}
            <div className="field col-12 md:col-4">
              <label htmlFor="categoria" className="font-medium text-900">
                Categoría
              </label>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="categoria"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={categories}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione una categoría"
                    filter
                    filterBy="nombre"
                    filterPlaceholder="Buscar categoría"
                    showClear
                    className={classNames("w-full", {
                      "p-invalid": errors.categoria,
                    })}
                  />
                )}
              />
              {errors.categoria && (
                <small className="p-error">{errors.categoria.message}</small>
              )}
            </div>

            {/* Unidad */}
            <div className="field col-12 md:col-3">
              <label htmlFor="unidad" className="font-medium text-900">
                Unidad
              </label>
              <Controller
                name="unidad"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="unidad"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={units}
                    optionLabel="nombre"
                    optionValue="id"
                    placeholder="Seleccione una unidad"
                    filter
                    filterBy="nombre"
                    filterPlaceholder="Buscar unidad"
                    showClear
                    className={classNames("w-full", {
                      "p-invalid": errors.unidad,
                    })}
                  />
                )}
              />
              {errors.unidad && (
                <small className="p-error">{errors.unidad.message}</small>
              )}
            </div>

            {/* Precio Costo */}
            <div className="field col-12 md:col-3">
              <label htmlFor="precioCosto" className="font-medium text-900">
                Precio Costo
              </label>
              <Controller
                name="precioCosto"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioCosto"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    className={classNames("w-full", {
                      "p-invalid": errors.precioCosto,
                    })}
                  />
                )}
              />
              {errors.precioCosto && (
                <small className="p-error">{errors.precioCosto.message}</small>
              )}
            </div>

            {/* Precio Venta */}
            <div className="field col-12 md:col-3">
              <label htmlFor="precioVenta" className="font-medium text-900">
                Precio Venta
              </label>
              <Controller
                name="precioVenta"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="precioVenta"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    mode="currency"
                    currency="USD"
                    locale="en-US"
                    className={classNames("w-full", {
                      "p-invalid": errors.precioVenta,
                    })}
                  />
                )}
              />
              {errors.precioVenta && (
                <small className="p-error">{errors.precioVenta.message}</small>
              )}
            </div>

            {/* Estado */}
            <div className="field col-12 md:col-3">
              <label htmlFor="estado" className="font-medium text-900">
                Estado
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    id="estado"
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={estadoOptions}
                    placeholder="Seleccione un estado"
                    className={classNames("w-full", {
                      "p-invalid": errors.estado,
                    })}
                  />
                )}
              />
              {errors.estado && (
                <small className="p-error">{errors.estado.message}</small>
              )}
            </div>

            {/* Stock Mínimo */}
            <div className="field col-12 md:col-6">
              <label htmlFor="stockMinimo" className="font-medium text-900">
                Stock Mínimo
              </label>
              <Controller
                name="stockMinimo"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="stockMinimo"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    className={classNames("w-full", {
                      "p-invalid": errors.stockMinimo,
                    })}
                  />
                )}
              />
              {errors.stockMinimo && (
                <small className="p-error">{errors.stockMinimo.message}</small>
              )}
            </div>

            {/* Stock Máximo */}
            <div className="field col-12 md:col-6">
              <label htmlFor="stockMaximo" className="font-medium text-900">
                Stock Máximo
              </label>
              <Controller
                name="stockMaximo"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    id="stockMaximo"
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    min={0}
                    className={classNames("w-full", {
                      "p-invalid": errors.stockMaximo,
                    })}
                  />
                )}
              />
              {errors.stockMaximo && (
                <small className="p-error">{errors.stockMaximo.message}</small>
              )}
            </div>

            {/* Descripción */}
            <div className="field col-12">
              <label htmlFor="descripcion" className="font-medium text-900">
                Descripción
              </label>
              <InputTextarea
                id="descripcion"
                rows={3}
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("descripcion")}
              />
              {errors.descripcion && (
                <small className="p-error">{errors.descripcion.message}</small>
              )}
            </div>

            {/* Imágenes (URLs separadas por coma) */}
            <div className="field col-12">
              <label htmlFor="imagenes" className="font-medium text-900">
                Imágenes (URLs separadas por coma)
              </label>
              <InputText
                id="imagenes"
                value={imageText}
                onChange={(e) => {
                  setImageText(e.target.value);
                  const arr = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setValue("imagenes" as any, arr);
                }}
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
              />
              {errors.imagenes && (
                <small className="p-error">{errors.imagenes.message}</small>
              )}
            </div>

            {/* Created By */}
            <div className="field col-12 md:col-6">
              <label htmlFor="createdBy" className="font-medium text-900">
                Creado Por
              </label>
              <InputText
                id="createdBy"
                type="text"
                className={classNames("w-full", {
                  "p-filled": filledInput,
                })}
                {...register("createdBy")}
              />
              {errors.createdBy && (
                <small className="p-error">{errors.createdBy.message}</small>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="field col-12 text-right">
              <Button
                type="submit"
                label={item ? "Actualizar" : "Crear"}
                icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
                className="p-button-success"
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
