# Guía: Crear un Nuevo Módulo CRUD

Esta guía te enseñará cómo crear un módulo CRUD completo siguiendo los patrones establecidos en el proyecto.

## Requisitos Previos

- Conocimiento básico de Next.js 14 (App Router)
- TypeScript
- React Hook Form
- Zod
- PrimeReact

## Paso 1: Definir la Entidad

### 1.1 Crear Interface TypeScript

Crea un archivo en `libs/interfaces/[módulo]/[entidad].interface.ts`

```typescript
// libs/interfaces/inventory/product.interface.ts

export interface Product {
  _id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  category: Category | string; // Relación con otra entidad
  estado?: "activo" | "inactivo";
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipo simplificado para referencias
export interface ProductReference {
  _id?: string;
  nombre: string;
}
```

**Reglas:**

- `_id` siempre opcional (se asigna en el backend)
- Relaciones pueden ser objeto completo o string (ID)
- Incluir `estado` para soft deletes
- Incluir `createdAt` y `updatedAt` para auditoría

### 1.2 Crear Schema de Validación Zod

Crea un archivo en `libs/zods/[módulo]/[entidad]Zod.tsx`

```typescript
// libs/zods/inventory/productZod.tsx

import { z } from "zod";

export const productSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  precio: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  stock: z.number().min(0, "El stock debe ser mayor o igual a 0"),
  category: z.union([
    z.string(), // ID de categoría
    z.object({
      _id: z.string(),
      nombre: z.string(),
    }),
  ]),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

// Tipo inferido del schema
export type ProductFormData = z.infer<typeof productSchema>;

// Schema para crear (sin _id)
export const createProductSchema = productSchema;

// Schema para actualizar (todos los campos opcionales excepto _id)
export const updateProductSchema = productSchema.partial().extend({
  _id: z.string(),
});
```

**Reglas:**

- Campos requeridos: `.min(1, "mensaje")`
- Campos opcionales: `.optional()`
- Enums para campos con valores fijos: `z.enum([...])`
- Relaciones: `z.union([z.string(), z.object({ ... })])`

## Paso 2: Crear el Servicio API

Crea un archivo en `app/api/[módulo]/[entidad]Service.ts`

```typescript
// app/api/inventory/productService.ts

import { apiClient } from "../apiClient";
import { Product } from "@/libs/interfaces/inventory/product.interface";
import { ProductFormData } from "@/libs/zods/inventory/productZod";

const BASE_URL = "/api/products";

// GET - Obtener todos
export const getProducts = () => {
  return apiClient.get<Product[]>(BASE_URL);
};

// GET - Obtener uno por ID
export const getProduct = (id: string) => {
  return apiClient.get<Product>(`${BASE_URL}/${id}`);
};

// POST - Crear
export const createProduct = (data: ProductFormData) => {
  return apiClient.post<Product>(BASE_URL, data);
};

// PUT - Actualizar
export const updateProduct = (id: string, data: ProductFormData) => {
  return apiClient.put<Product>(`${BASE_URL}/${id}`, data);
};

// DELETE - Eliminar
export const deleteProduct = (id: string) => {
  return apiClient.delete(`${BASE_URL}/${id}`);
};

// Funciones adicionales según necesidad
export const getProductByCode = (code: string) => {
  return apiClient.get<Product>(`${BASE_URL}/code/${code}`);
};

export const searchProducts = (query: string) => {
  return apiClient.get<Product[]>(`${BASE_URL}/search`, {
    params: { q: query },
  });
};
```

**Reglas:**

- Siempre importar tipos de las interfaces
- BASE_URL debe coincidir con la ruta del backend
- Usar tipado genérico: `apiClient.get<Type>`
- Mantener nombres consistentes: `getProducts`, `getProduct`, `createProduct`, etc.

## Paso 3: Crear el Componente List

Crea un archivo en `components/[módulo]/[entidades]/[Entidad]List.tsx`

```typescript
// components/inventory/products/ProductList.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Product } from "@/libs/interfaces/inventory/product.interface";
import { getProducts, deleteProduct } from "@/app/api/inventory/productService";
import ProductForm from "./ProductForm";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const toast = useRef<Toast>(null);

  // Cargar datos
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los productos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleNew = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete?._id) return;

    try {
      await deleteProduct(productToDelete._id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto eliminado correctamente",
        life: 3000,
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar el producto",
        life: 3000,
      });
    } finally {
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleSaveSuccess = () => {
    setShowForm(false);
    fetchProducts();
  };

  // Column templates
  const priceBodyTemplate = (rowData: Product) => {
    return `$${rowData.precio.toFixed(2)}`;
  };

  const stockBodyTemplate = (rowData: Product) => {
    const severity =
      rowData.stock > 10 ? "success" : rowData.stock > 0 ? "warning" : "danger";
    return <Tag value={rowData.stock} severity={severity} />;
  };

  const estadoBodyTemplate = (rowData: Product) => {
    const severity = rowData.estado === "activo" ? "success" : "danger";
    return <Tag value={rowData.estado} severity={severity} />;
  };

  const actionsBodyTemplate = (rowData: Product) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          onClick={() => handleEdit(rowData)}
          tooltip="Editar"
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => handleDeleteClick(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  // Header
  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Productos</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          placeholder="Buscar..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </span>
      <Button label="Nuevo" icon="pi pi-plus" onClick={handleNew} />
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />

      <DataTable
        value={products}
        loading={loading}
        dataKey="_id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilter={globalFilter}
        header={header}
        emptyMessage="No se encontraron productos"
      >
        <Column field="nombre" header="Nombre" sortable />
        <Column field="descripcion" header="Descripción" />
        <Column
          field="precio"
          header="Precio"
          body={priceBodyTemplate}
          sortable
        />
        <Column
          field="stock"
          header="Stock"
          body={stockBodyTemplate}
          sortable
        />
        <Column
          field="estado"
          header="Estado"
          body={estadoBodyTemplate}
          sortable
        />
        <Column
          body={actionsBodyTemplate}
          exportable={false}
          style={{ minWidth: "8rem" }}
        />
      </DataTable>

      {/* Form Dialog */}
      <Dialog
        visible={showForm}
        style={{ width: "600px" }}
        header={selectedProduct ? "Editar Producto" : "Nuevo Producto"}
        modal
        onHide={() => setShowForm(false)}
      >
        <ProductForm
          product={selectedProduct}
          onSave={handleSaveSuccess}
          onCancel={() => setShowForm(false)}
          toast={toast}
        />
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        visible={showDeleteDialog}
        style={{ width: "450px" }}
        header="Confirmar"
        modal
        footer={
          <>
            <Button
              label="No"
              icon="pi pi-times"
              text
              onClick={() => setShowDeleteDialog(false)}
            />
            <Button
              label="Sí"
              icon="pi pi-check"
              severity="danger"
              onClick={handleDeleteConfirm}
            />
          </>
        }
        onHide={() => setShowDeleteDialog(false)}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          <span>
            ¿Está seguro que desea eliminar <b>{productToDelete?.nombre}</b>?
          </span>
        </div>
      </Dialog>
    </div>
  );
}
```

## Paso 4: Crear el Componente Form

Crea un archivo en `components/[módulo]/[entidades]/[Entidad]Form.tsx`

```typescript
// components/inventory/products/ProductForm.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Product } from "@/libs/interfaces/inventory/product.interface";
import { Category } from "@/libs/interfaces/inventory/category.interface";
import {
  productSchema,
  ProductFormData,
} from "@/libs/zods/inventory/productZod";
import {
  createProduct,
  updateProduct,
} from "@/app/api/inventory/productService";
import { getCategories } from "@/app/api/inventory/categoryService";

interface ProductFormProps {
  product: Product | null;
  onSave: () => void;
  onCancel: () => void;
  toast: React.RefObject<Toast>;
}

export default function ProductForm({
  product,
  onSave,
  onCancel,
  toast,
}: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      precio: 0,
      stock: 0,
      category: "",
      estado: "activo",
    },
  });

  // Cargar datos relacionados
  useEffect(() => {
    fetchCategories();
  }, []);

  // Cargar datos del producto en modo edición
  useEffect(() => {
    if (product) {
      reset({
        nombre: product.nombre,
        descripcion: product.descripcion || "",
        precio: product.precio,
        stock: product.stock,
        category:
          typeof product.category === "string"
            ? product.category
            : product.category._id,
        estado: product.estado || "activo",
      });
    }
  }, [product, reset]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.filter((c) => c.estado === "activo"));
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);

      if (product?._id) {
        await updateProduct(product._id, data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Producto actualizado correctamente",
          life: 3000,
        });
      } else {
        await createProduct(data);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Producto creado correctamente",
          life: 3000,
        });
      }

      onSave();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo guardar el producto",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const estadoOptions = [
    { label: "Activo", value: "activo" },
    { label: "Inactivo", value: "inactivo" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      {/* Nombre */}
      <div className="field">
        <label htmlFor="nombre" className="font-bold">
          Nombre *
        </label>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <InputText
              id="nombre"
              {...field}
              className={errors.nombre ? "p-invalid" : ""}
            />
          )}
        />
        {errors.nombre && (
          <small className="p-error">{errors.nombre.message}</small>
        )}
      </div>

      {/* Descripción */}
      <div className="field">
        <label htmlFor="descripcion" className="font-bold">
          Descripción
        </label>
        <Controller
          name="descripcion"
          control={control}
          render={({ field }) => <InputText id="descripcion" {...field} />}
        />
      </div>

      {/* Categoría */}
      <div className="field">
        <label htmlFor="category" className="font-bold">
          Categoría *
        </label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="category"
              value={field.value}
              options={categories}
              onChange={(e) => field.onChange(e.value)}
              optionLabel="nombre"
              optionValue="_id"
              placeholder="Seleccione una categoría"
              filter
              className={errors.category ? "p-invalid" : ""}
            />
          )}
        />
        {errors.category && (
          <small className="p-error">{errors.category.message}</small>
        )}
      </div>

      {/* Precio */}
      <div className="field">
        <label htmlFor="precio" className="font-bold">
          Precio *
        </label>
        <Controller
          name="precio"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="precio"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
              className={errors.precio ? "p-invalid" : ""}
            />
          )}
        />
        {errors.precio && (
          <small className="p-error">{errors.precio.message}</small>
        )}
      </div>

      {/* Stock */}
      <div className="field">
        <label htmlFor="stock" className="font-bold">
          Stock *
        </label>
        <Controller
          name="stock"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="stock"
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              className={errors.stock ? "p-invalid" : ""}
            />
          )}
        />
        {errors.stock && (
          <small className="p-error">{errors.stock.message}</small>
        )}
      </div>

      {/* Estado */}
      <div className="field">
        <label htmlFor="estado" className="font-bold">
          Estado
        </label>
        <Controller
          name="estado"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="estado"
              value={field.value}
              options={estadoOptions}
              onChange={(e) => field.onChange(e.value)}
            />
          )}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-2 justify-content-end mt-4">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          severity="secondary"
          onClick={onCancel}
          type="button"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          loading={loading}
          type="submit"
        />
      </div>
    </form>
  );
}
```

## Paso 5: Crear la Página (Route)

Crea un archivo en `app/([route-group])/[módulo]/[entidades]/page.tsx`

```typescript
// app/(main)/inventory/products/page.tsx

import ProductList from "@/components/inventory/products/ProductList";

export const metadata = {
  title: "Productos | Taller Template",
  description: "Gestión de productos",
};

export default function ProductsPage() {
  return <ProductList />;
}
```

## Paso 6: Agregar al Menú

Edita el archivo de menú correspondiente en `layout/AppMenu[Módulo].tsx`

```typescript
// layout/AppMenuWorkshop.tsx

const model = [
  // ... otros items
  {
    label: "Inventario",
    icon: "pi pi-fw pi-box",
    items: [
      {
        label: "Productos",
        icon: "pi pi-fw pi-shopping-cart",
        to: "/inventory/products",
      },
      {
        label: "Categorías",
        icon: "pi pi-fw pi-tags",
        to: "/inventory/categories",
      },
    ],
  },
];
```

## Checklist Final

- [ ] Interface TypeScript creada en `libs/interfaces`
- [ ] Schema Zod creado en `libs/zods`
- [ ] Servicio API creado en `app/api`
- [ ] Componente List creado en `components`
- [ ] Componente Form creado en `components`
- [ ] Página (route) creada en `app`
- [ ] Item agregado al menú en `layout`
- [ ] Pruebas de compilación exitosas
- [ ] Pruebas funcionales (CRUD completo)

## Comandos Útiles

```bash
# Verificar errores de TypeScript
npm run build

# Ejecutar en desarrollo
npm run dev

# Verificar linting
npm run lint
```

## Ejemplos Completos

Puedes revisar estos módulos como referencia:

- **CRM Module:** `/components/crm/vehicles/`
- **Inventory Module:** `/components/inventory/brands/`

## Próximos Pasos

- Ver patrones avanzados: `/docs/guides/advanced-patterns.md`
- Ver manejo de errores: `/docs/guides/error-handling.md`
- Ver optimización: `/docs/guides/performance.md`
