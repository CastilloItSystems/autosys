"use client";
import React, { useEffect, useState } from "react";

// Form libraries
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// PrimeReact components
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputSwitch } from "primereact/inputswitch";
import { Image } from "primereact/image";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";

// API functions
import itemService, {
  Item,
  IPricing,
  IPricingTier,
  IItemImage,
} from "@/app/api/inventory/itemService";
import brandsService from "@/app/api/inventory/brandService";
import categoriesService from "@/app/api/inventory/categoryService";
import unitsService from "@/app/api/inventory/unitService";
import { handleFormError } from "@/utils/errorHandlers";
import modelsService from "@/app/api/inventory/modelService";

// ============================================
// SCHEMA VALIDATION
// ============================================
const pricingTierSchema = z.object({
  id: z.string().optional(),
  minQuantity: z.number().min(1, "Cantidad mínima debe ser >= 1"),
  maxQuantity: z.number().nullable(),
  tierPrice: z.number().min(0, "Precio debe ser >= 0"),
  discountPercentage: z.number().min(0).max(100, "Descuento 0-100%").nullable(),
});

const pricingSchema = z.object({
  costPrice: z.number().min(0, "Costo debe ser >= 0"),
  salePrice: z.number().min(0, "Precio descuento debe ser >= 0"),
  wholesalePrice: z.number().min(0).nullable(),
  minMargin: z.number().min(0).max(100, "Margen 0-100%"),
  maxMargin: z.number().min(0).max(100, "Margen 0-100%"),
  discountPercentage: z.number().min(0).max(100).nullable(),
  tiers: z.array(pricingTierSchema).optional(),
});

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("URL inválida"),
  isPrimary: z.boolean(),
  order: z.number(),
});

const itemSchema = z.object({
  code: z
    .string()
    .min(3, "Código min 3 caracteres")
    .max(50, "Código max 50 caracteres"),
  name: z
    .string()
    .min(3, "Nombre min 3 caracteres")
    .max(200, "Nombre max 200 caracteres"),
  description: z.string().max(2000, "Máx 2000 caracteres").optional(),
  brandId: z.string().min(1, "Marca requerida"),
  categoryId: z.string().min(1, "Categoría requerida"),
  modelId: z.string().optional(),
  unitId: z.string().min(1, "Unidad requerida"),
  sku: z.string().min(3, "SKU min 3").max(50, "SKU max 50").toUpperCase(),
  barcode: z.string().max(50).optional(),
  minStock: z.number().min(0).default(5),
  maxStock: z.number().min(0).nullable(),
  reorderPoint: z.number().min(0).default(10),
  location: z.string().max(20).optional(),
  costPrice: z.number().min(0),
  salePrice: z.number().min(0),
  wholesalePrice: z.number().min(0).nullable(),
  isActive: z.boolean().default(true),
  isSerialized: z.boolean().default(false),
  hasBatch: z.boolean().default(false),
  hasExpiry: z.boolean().default(false),
  allowNegativeStock: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  technicalSpecs: z.record(z.any()).optional(),
  pricing: pricingSchema.optional(),
  images: z.array(imageSchema).optional(),
});

type FormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  model: Item | null;
  formId?: string;
  onSave: () => void | Promise<void>;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<any>;
}

export default function ItemForm({
  model: item,
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: ItemFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // Pricing state
  const [pricing, setPricing] = useState<IPricing | null>(null);
  const [tiers, setTiers] = useState<IPricingTier[]>([]);

  // Images state
  const [images, setImages] = useState<IItemImage[]>([]);
  const [imageDialog, setImageDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(itemSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      description: "",
      brandId: "",
      categoryId: "",
      modelId: "",
      unitId: "",
      sku: "",
      barcode: "",
      minStock: 5,
      maxStock: 100,
      reorderPoint: 10,
      location: "",
      costPrice: 0,
      salePrice: 0,
      wholesalePrice: null,
      isActive: true,
      isSerialized: false,
      hasBatch: false,
      hasExpiry: false,
      allowNegativeStock: false,
      tags: [],
      images: [],
    },
  });

  const costPrice = watch("costPrice");
  const salePrice = watch("salePrice");

  // Watch for margin changes
  const calculatedMargin =
    costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandsRes, categoriesRes, modelsRes, unitsRes] =
          await Promise.all([
            brandsService.getActive(),
            categoriesService.getActive(),
            modelsService.getActive(),
            unitsService.getActive(),
          ]);

        // Estructura consistente en todos los endpoints
        const brandsData = brandsRes?.data || [];
        const categoriesData = categoriesRes?.data || [];
        const modelsData = modelsRes?.data || [];
        const unitsData = unitsRes?.data || [];

        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setModels(Array.isArray(modelsData) ? modelsData : []);
        setUnits(Array.isArray(unitsData) ? unitsData : []);

        console.log("Datos cargados:", {
          brands: brandsData?.length || 0,
          categories: categoriesData?.length || 0,
          models: modelsData?.length || 0,
          units: unitsData?.length || 0,
        });
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load item data if editing
  useEffect(() => {
    if (item && !isLoading) {
      reset({
        code: item.code || "",
        name: item.name || "",
        description: item.description || "",
        brandId: item.brandId || "",
        categoryId: item.categoryId || "",
        modelId: item.modelId || "",
        unitId: item.unitId || "",
        sku: item.sku || "",
        barcode: item.barcode || "",
        minStock: item.minStock || 5,
        maxStock: item.maxStock || 100,
        reorderPoint: item.reorderPoint || 10,
        location: item.location || "",
        costPrice: item.costPrice || 0,
        salePrice: item.salePrice || 0,
        wholesalePrice: item.wholesalePrice || null,
        isActive: item.isActive ?? true,
        isSerialized: item.isSerialized ?? false,
        hasBatch: item.hasBatch ?? false,
        hasExpiry: item.hasExpiry ?? false,
        allowNegativeStock: item.allowNegativeStock ?? false,
        tags: item.tags || [],
      });

      // Load pricing if exists
      if (item.pricing) {
        setPricing(item.pricing);
        setTiers(item.pricing.tiers || []);
      }

      // Load images
      if (item.images) {
        setImages(item.images);
      }
    } else if (!item && !isLoading) {
      reset({
        code: "",
        name: "",
        description: "",
        brandId: "",
        categoryId: "",
        modelId: "",
        unitId: "",
        sku: "",
        barcode: "",
        minStock: 5,
        maxStock: 100,
        reorderPoint: 10,
        location: "",
        costPrice: 0,
        salePrice: 0,
        wholesalePrice: null,
        isActive: true,
        isSerialized: false,
        hasBatch: false,
        hasExpiry: false,
        allowNegativeStock: false,
        tags: [],
        images: [],
      });
      setPricing(null);
      setTiers([]);
      setImages([]);
    }
  }, [item, reset, isLoading]);

  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload: any = { ...data };

      // Add pricing if exists or has values
      if (
        data.costPrice ||
        data.salePrice ||
        pricing?.minMargin !== undefined
      ) {
        payload.pricing = {
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          wholesalePrice: data.wholesalePrice,
          minMargin: pricing?.minMargin || 0,
          maxMargin: pricing?.maxMargin || 100,
          discountPercentage: pricing?.discountPercentage,
          tiers: tiers,
        };
      }

      // Add images
      payload.images = images;

      if (item?.id) {
        await itemService.update(item.id, payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Artículo actualizado correctamente",
          life: 3000,
        });
      } else {
        await itemService.create(payload);
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Artículo creado correctamente",
          life: 3000,
        });
      }
      onSave();
    } catch (error: any) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Error al guardar",
        life: 3000,
      });
    }
  };

  // ============================================
  // TAB 1: DATOS BÁSICOS
  // ============================================
  const DatosBasicosTab = () => (
    <div className="grid">
      {/* Row 1: SKU, Código, Barcode */}
      <div className="col-12 md:col-4">
        <label htmlFor="sku" className="block text-900 font-medium mb-2">
          SKU <span className="text-red-500">*</span>
        </label>
        <Controller
          name="sku"
          control={control}
          render={({ field }) => (
            <InputText
              id="sku"
              {...field}
              placeholder="ART-001"
              className={errors.sku ? "p-invalid" : ""}
              disabled={!!item?.id}
              autoFocus
              value={field.value?.toUpperCase() || ""}
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
            />
          )}
        />
        {errors.sku && (
          <small className="p-error block">{errors.sku.message}</small>
        )}
      </div>

      <div className="col-12 md:col-4">
        <label htmlFor="code" className="block text-900 font-medium mb-2">
          Código <span className="text-red-500">*</span>
        </label>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <InputText
              id="code"
              {...field}
              placeholder="Código único"
              className={errors.code ? "p-invalid" : ""}
              disabled={!!item?.id}
            />
          )}
        />
        {errors.code && (
          <small className="p-error block">{errors.code.message}</small>
        )}
      </div>

      <div className="col-12 md:col-4">
        <label htmlFor="barcode" className="block text-900 font-medium mb-2">
          Barcode
        </label>
        <Controller
          name="barcode"
          control={control}
          render={({ field }) => (
            <InputText
              id="barcode"
              {...field}
              placeholder="Código barras"
              className=""
            />
          )}
        />
      </div>

      {/* Row 2: Nombre completo */}
      <div className="col-12">
        <label htmlFor="name" className="block text-900 font-medium mb-2">
          Nombre <span className="text-red-500">*</span>
        </label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <InputText
              id="name"
              {...field}
              placeholder="Nombre del artículo"
              className={errors.name ? "p-invalid" : ""}
            />
          )}
        />
        {errors.name && (
          <small className="p-error block">{errors.name.message}</small>
        )}
      </div>

      {/* Row 3: Descripción */}
      <div className="col-12">
        <label
          htmlFor="description"
          className="block text-900 font-medium mb-2"
        >
          Descripción
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <InputTextarea
              id="description"
              {...field}
              placeholder="Descripción"
              rows={2}
              className={errors.description ? "p-invalid" : ""}
            />
          )}
        />
      </div>

      {/* Row 4: Marca, Categoría, Modelo, Unidad (4 columnas) */}
      <div className="col-12 md:col-3">
        <label htmlFor="brandId" className="block text-900 font-medium mb-2">
          Marca <span className="text-red-500">*</span>
        </label>
        <Controller
          name="brandId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="brandId"
              {...field}
              options={brands}
              optionLabel="name"
              optionValue="id"
              placeholder="Marca"
              filter
              showClear
              className={errors.brandId ? "p-invalid" : ""}
            />
          )}
        />
        {errors.brandId && (
          <small className="p-error block">{errors.brandId.message}</small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="categoryId" className="block text-900 font-medium mb-2">
          Categoría <span className="text-red-500">*</span>
        </label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="categoryId"
              {...field}
              options={categories}
              optionLabel="name"
              optionValue="id"
              placeholder="Categoría"
              filter
              showClear
              className={errors.categoryId ? "p-invalid" : ""}
            />
          )}
        />
        {errors.categoryId && (
          <small className="p-error block">{errors.categoryId.message}</small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="modelId" className="block text-900 font-medium mb-2">
          Modelo
        </label>
        <Controller
          name="modelId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="modelId"
              {...field}
              options={models}
              optionLabel="name"
              optionValue="id"
              placeholder="Modelo"
              filter
              showClear
              className=""
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="unitId" className="block text-900 font-medium mb-2">
          Unidad <span className="text-red-500">*</span>
        </label>
        <Controller
          name="unitId"
          control={control}
          render={({ field }) => (
            <Dropdown
              id="unitId"
              {...field}
              options={units}
              optionLabel="name"
              optionValue="id"
              placeholder="Unidad"
              filter
              showClear
              className={errors.unitId ? "p-invalid" : ""}
            />
          )}
        />
        {errors.unitId && (
          <small className="p-error block">{errors.unitId.message}</small>
        )}
      </div>

      {/* Row 5: Stock Min, Max, Reorden, Ubicación (4 columnas) */}
      <div className="col-12 md:col-3">
        <label htmlFor="minStock" className="block text-900 font-medium mb-2">
          Stock Mínimo
        </label>
        <Controller
          name="minStock"
          control={control}
          render={({ field }) => (
            <InputNumber id="minStock" {...field} min={0} className="" />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="maxStock" className="block text-900 font-medium mb-2">
          Stock Máximo
        </label>
        <Controller
          name="maxStock"
          control={control}
          render={({ field }) => (
            <InputNumber id="maxStock" {...field} min={0} className="" />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label
          htmlFor="reorderPoint"
          className="block text-900 font-medium mb-2"
        >
          Punto Reorden
        </label>
        <Controller
          name="reorderPoint"
          control={control}
          render={({ field }) => (
            <InputNumber id="reorderPoint" {...field} min={0} className="" />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="location" className="block text-900 font-medium mb-2">
          Ubicación
        </label>
        <Controller
          name="location"
          control={control}
          render={({ field }) => (
            <InputText
              id="location"
              {...field}
              placeholder="M1-R01"
              className=""
            />
          )}
        />
      </div>

      {/* Row 6: Configuración */}
      <div className="col-12">
        <label className="block text-900 font-medium mb-2">Configuración</label>
        <div className="flex align-items-center gap-3 flex-wrap">
          <div className="flex align-items-center gap-2">
            <label className="text-sm text-900">Activo</label>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </div>

          <div className="flex align-items-center gap-2">
            <label className="text-sm text-900">Serializado</label>
            <Controller
              name="isSerialized"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </div>

          <div className="flex align-items-center gap-2">
            <label className="text-sm text-900">Lotes</label>
            <Controller
              name="hasBatch"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </div>

          <div className="flex align-items-center gap-2">
            <label className="text-sm text-900">Vencimiento</label>
            <Controller
              name="hasExpiry"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </div>

          <div className="flex align-items-center gap-2">
            <label className="text-sm text-900">Stock Neg.</label>
            <Controller
              name="allowNegativeStock"
              control={control}
              render={({ field }) => (
                <InputSwitch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.value)}
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // TAB 2: PRECIOS
  // ============================================
  const PreciosTab = () => (
    <div className="grid">
      <div className="col-12">
        <h3 className="text-base font-bold text-900 mb-2">Precios Base</h3>
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="costPrice" className="block text-900 font-medium mb-2">
          Precio Costo <span className="text-red-500">*</span>
        </label>
        <Controller
          name="costPrice"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="costPrice"
              tabIndex={0}
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
              className={errors.costPrice ? "p-invalid" : ""}
            />
          )}
        />
        {errors.costPrice && (
          <small className="p-error block">{errors.costPrice.message}</small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label htmlFor="salePrice" className="block text-900 font-medium mb-2">
          Precio Venta <span className="text-red-500">*</span>
        </label>
        <Controller
          name="salePrice"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="salePrice"
              tabIndex={1}
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
              className={errors.salePrice ? "p-invalid" : ""}
            />
          )}
        />
        {errors.salePrice && (
          <small className="p-error block">{errors.salePrice.message}</small>
        )}
      </div>

      <div className="col-12 md:col-3">
        <label
          htmlFor="wholesalePrice"
          className="block text-900 font-medium mb-2"
        >
          Precio Mayoreo
        </label>
        <Controller
          name="wholesalePrice"
          control={control}
          render={({ field }) => (
            <InputNumber
              id="wholesalePrice"
              tabIndex={2}
              value={field.value}
              onValueChange={(e) => field.onChange(e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
              className=""
            />
          )}
        />
      </div>

      <div className="col-12 md:col-3">
        <label className="block text-900 font-medium mb-2">Margen %</label>
        <div className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded flex align-items-center justify-content-center h-full">
          <span className="text-lg font-bold text-blue-600">
            {calculatedMargin.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="col-12">
        <h3 className="text-base font-bold text-900 mb-2">
          Márgenes Permitidos
        </h3>
      </div>

      <div className="col-12 md:col-4">
        <label htmlFor="minMargin" className="block text-900 font-medium mb-2">
          Margen Mín. (%)
        </label>
        <InputNumber
          id="minMargin"
          tabIndex={3}
          value={pricing?.minMargin || 0}
          onValueChange={(e) =>
            setPricing({
              ...pricing,
              minMargin: e.value || 0,
            } as IPricing)
          }
          min={0}
          max={100}
          className=""
        />
      </div>

      <div className="col-12 md:col-4">
        <label htmlFor="maxMargin" className="block text-900 font-medium mb-2">
          Margen Máx. (%)
        </label>
        <InputNumber
          id="maxMargin"
          tabIndex={4}
          value={pricing?.maxMargin || 100}
          onValueChange={(e) =>
            setPricing({
              ...pricing,
              maxMargin: e.value || 100,
            } as IPricing)
          }
          min={0}
          max={100}
          className=""
        />
      </div>

      <div className="col-12 md:col-4">
        <label
          htmlFor="discountPercentage"
          className="block text-900 font-medium mb-2"
        >
          Descuento (%)
        </label>
        <InputNumber
          id="discountPercentage"
          tabIndex={5}
          value={pricing?.discountPercentage || 0}
          onValueChange={(e) =>
            setPricing({
              ...pricing,
              discountPercentage: e.value,
            } as IPricing)
          }
          min={0}
          max={100}
          className=""
        />
      </div>
    </div>
  );

  // ============================================
  // TAB 3: PRECIOS ESCALONADOS (TIERS)
  // ============================================
  const TiersTab = () => (
    <div className="p-4">
      <div className="mb-3 flex justify-content-between align-items-center">
        <h3 className="text-xl font-bold text-900">Precios por Cantidad</h3>
        <Button
          label="+ Agregar Tier"
          icon="pi pi-plus"
          onClick={() => {
            setTiers([
              ...tiers,
              {
                minQuantity:
                  tiers.length > 0
                    ? (tiers[tiers.length - 1].maxQuantity || 0) + 1
                    : 1,
                maxQuantity: null,
                tierPrice: salePrice,
                discountPercentage: null,
              },
            ]);
          }}
          size="small"
        />
      </div>

      {tiers.length === 0 ? (
        <div className="text-center p-4 bg-surface-50 rounded border-1 border-surface-200">
          <p className="text-surface-500">
            Sin precios escalonados configurados
          </p>
        </div>
      ) : (
        <DataTable value={tiers} responsiveLayout="scroll">
          <Column
            field="minQuantity"
            header="Cantidad Mínima"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.minQuantity}
                onValueChange={(e) => {
                  const newTiers = [...tiers];
                  newTiers[rowIndex].minQuantity = e.value || 1;
                  setTiers(newTiers);
                }}
                min={1}
              />
            )}
          />
          <Column
            field="maxQuantity"
            header="Cantidad Máxima"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.maxQuantity}
                onValueChange={(e) => {
                  const newTiers = [...tiers];
                  newTiers[rowIndex].maxQuantity = e.value;
                  setTiers(newTiers);
                }}
                min={0}
                placeholder="Sin límite"
              />
            )}
          />
          <Column
            field="tierPrice"
            header="Precio"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.tierPrice}
                onValueChange={(e) => {
                  const newTiers = [...tiers];
                  newTiers[rowIndex].tierPrice = e.value || 0;
                  setTiers(newTiers);
                }}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            )}
          />
          <Column
            field="discountPercentage"
            header="Descuento %"
            body={(row, { rowIndex }) => (
              <InputNumber
                value={row.discountPercentage}
                onValueChange={(e) => {
                  const newTiers = [...tiers];
                  newTiers[rowIndex].discountPercentage = e.value;
                  setTiers(newTiers);
                }}
                min={0}
                max={100}
              />
            )}
          />
          <Column
            header="Acciones"
            body={(row, { rowIndex }) => (
              <Button
                icon="pi pi-trash"
                severity="danger"
                rounded
                text
                onClick={() => {
                  setTiers(tiers.filter((_, i) => i !== rowIndex));
                }}
              />
            )}
            style={{ width: "4rem" }}
          />
        </DataTable>
      )}
    </div>
  );

  // ============================================
  // TAB 4: IMÁGENES
  // ============================================
  const ImagenesTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-content-between align-items-center">
        <h3 className="text-xl font-bold text-900">Galería de Imágenes</h3>
        <Button
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
                      <Tag
                        value="Primaria"
                        severity="success"
                        icon="pi pi-star"
                      />
                    )}
                  </div>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    onClick={() =>
                      setImages(images.filter((_, i) => i !== idx))
                    }
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
                      onChange={(e) => {
                        const newImages = images.map((im, i) => ({
                          ...im,
                          isPrimary: i === idx ? e.value : false,
                        }));
                        setImages(newImages);
                      }}
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

      {/* Add Image Dialog */}
      <Dialog
        visible={imageDialog}
        onHide={() => setImageDialog(false)}
        header="Agregar Imagen"
        modal
        style={{ width: "90vw", maxWidth: "500px" }}
      >
        <div className="grid gap-3">
          <div className="col-12">
            <label className="block text-900 font-medium mb-2">
              URL de Imagen
            </label>
            <InputText
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full"
            />
          </div>
          <div className="col-12 flex gap-2 justify-content-end">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => setImageDialog(false)}
            />
            <Button
              label="Agregar"
              onClick={() => {
                if (newImageUrl.trim()) {
                  setImages([
                    ...images,
                    {
                      url: newImageUrl,
                      isPrimary: images.length === 0,
                      order: images.length,
                    },
                  ]);
                  setNewImageUrl("");
                  setImageDialog(false);
                }
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center p-4">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="4"
          fill="var(--surface-ground)"
          animationDuration=".5s"
        />
        <p className="mt-3 text-600 font-medium">Preparando formulario...</p>
      </div>
    );
  }

  return (
    <form id={formId || "item-form"} onSubmit={handleSubmit(onSubmit)}>
      <TabView
        activeIndex={activeTab}
        onTabChange={(e) => setActiveTab(e.index)}
      >
        <TabPanel header="Datos Básicos" leftIcon="pi pi-box">
          <DatosBasicosTab />
        </TabPanel>

        <TabPanel header="Precios" leftIcon="pi pi-dollar">
          <PreciosTab />
        </TabPanel>

        <TabPanel header="Precios Escalonados" leftIcon="pi pi-chart-bar">
          <TiersTab />
        </TabPanel>

        <TabPanel header="Imágenes" leftIcon="pi pi-images">
          <ImagenesTab />
        </TabPanel>
      </TabView>
    </form>
  );
}
