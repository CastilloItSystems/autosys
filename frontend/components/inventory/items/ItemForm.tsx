"use client";
import React, { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ProgressSpinner } from "primereact/progressspinner";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";

import itemService, {
  Item,
  IPricing,
  IPricingTier,
  IItemImage,
} from "@/app/api/inventory/itemService";
import brandsService from "@/app/api/inventory/brandService";
import categoriesService from "@/app/api/inventory/categoryService";
import unitsService from "@/app/api/inventory/unitService";
import modelsService from "@/app/api/inventory/modelService";
import { handleFormError } from "@/utils/errorHandlers";

import BasicDataTab from "./tabs/BasicDataTab";
import PricingTab from "./tabs/PricingTab";
import PricingTiersTab from "./tabs/PricingTiersTab";
import ImagesTab from "./tabs/ImagesTab";
import SpecificationsTab from "./tabs/SpecificationsTab";
import BrandForm from "../brands/BrandForm";
import CategoryForm from "../categories/CategoryForm";
import UnitForm from "../units/UnitForm";
import ItemModelForm from "../itemModels/ItemModelForm";
import FormActionButtons from "@/components/common/FormActionButtons";

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
  minMargin: z.number().min(0).max(100).optional().default(0),
  maxMargin: z.number().min(0).max(100).optional().default(0),
  discountPercentage: z.number().min(0).max(100).nullable(),
  costForeign: z.number().min(0).optional(),
  exchangeRate: z.number().min(0).optional(),
  taxRateSale: z.number().min(0).max(100).optional(),
  taxRatePurchase: z.number().min(0).max(100).optional(),
  priceLevels: z
    .array(z.object({ level: z.number(), priceForeign: z.number().min(0) }))
    .optional(),
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
  identity: z.string().max(100).optional(),
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
  useStock: z.boolean().default(true),
  isFractionable: z.boolean().default(false),
  isComposite: z.boolean().default(false),
  isInternalUse: z.boolean().default(false),
  useServer: z.boolean().default(false),
  suspendedForPurchase: z.boolean().default(false),
  shortName: z.string().max(20).optional(),
  reference: z.string().max(20).optional(),
  contraindications: z.string().optional(),
  warrantyDays: z.number().min(0).default(0),
  packagingQty: z.number().min(1).default(1),
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

const EMPTY_PRICE_LEVELS = Array.from({ length: 8 }, (_, i) => ({
  level: i + 1,
  priceForeign: 0,
}));

const EMPTY_DEFAULTS = {
  code: "",
  name: "",
  description: "",
  brandId: "",
  categoryId: "",
  modelId: "",
  unitId: "",
  sku: "",
  barcode: "",
  identity: "",
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
  useStock: true,
  isFractionable: false,
  isComposite: false,
  isInternalUse: false,
  useServer: false,
  suspendedForPurchase: false,
  shortName: "",
  reference: "",
  contraindications: "",
  warrantyDays: 0,
  packagingQty: 1,
  tags: [],
  images: [],
};

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

  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [pricing, setPricing] = useState<IPricing | null>(null);
  const [tiers, setTiers] = useState<IPricingTier[]>([]);
  const [priceLevels, setPriceLevels] =
    useState<{ level: number; priceForeign: number }[]>(EMPTY_PRICE_LEVELS);
  const [images, setImages] = useState<IItemImage[]>([]);

  const [brandDialog, setBrandDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [unitDialog, setUnitDialog] = useState(false);
  const [modelDialog, setModelDialog] = useState(false);
  const [isQuickCreateSubmitting, setIsQuickCreateSubmitting] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(itemSchema),
    mode: "onBlur",
    defaultValues: EMPTY_DEFAULTS,
  });

  const costPrice = watch("costPrice");
  const salePrice = watch("salePrice");
  const calculatedMargin =
    costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

  // Load dropdown data
  useEffect(() => {
    Promise.all([
      brandsService.getActive(),
      categoriesService.getActive(),
      modelsService.getActive(),
      unitsService.getActive(),
    ])
      .then(([brandsRes, categoriesRes, modelsRes, unitsRes]) => {
        setBrands(Array.isArray(brandsRes?.data) ? brandsRes.data : []);
        setCategories(
          Array.isArray(categoriesRes?.data) ? categoriesRes.data : [],
        );
        setModels(Array.isArray(modelsRes?.data) ? modelsRes.data : []);
        setUnits(Array.isArray(unitsRes?.data) ? unitsRes.data : []);
      })
      .catch((err) => console.error("Error loading dropdown data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (isLoading) return;

    if (item) {
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
        identity: item.identity || "",
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
        useStock: item.useStock ?? true,
        isFractionable: item.isFractionable ?? false,
        isComposite: item.isComposite ?? false,
        isInternalUse: item.isInternalUse ?? false,
        useServer: item.useServer ?? false,
        suspendedForPurchase: item.suspendedForPurchase ?? false,
        shortName: item.shortName || "",
        reference: item.reference || "",
        contraindications: item.contraindications || "",
        warrantyDays: item.warrantyDays ?? 0,
        packagingQty: item.packagingQty ?? 1,
        tags: Array.isArray(item.tags) ? item.tags : [],
      });

      if (item.technicalSpecs && typeof item.technicalSpecs === "object") {
        setSpecs(
          Object.entries(item.technicalSpecs).map(([label, value]) => ({
            label,
            value: String(value),
          })),
        );
      } else {
        setSpecs([]);
      }

      if (item.pricing) {
        setPricing(item.pricing);
        setTiers(item.pricing.tiers || []);
        if (item.pricing.priceLevels?.length) {
          const existing = item.pricing.priceLevels;
          setPriceLevels(
            Array.from({ length: 8 }, (_, i) => {
              const found = existing.find((pl) => pl.level === i + 1);
              return {
                level: i + 1,
                priceForeign: found ? Number(found.priceForeign) : 0,
              };
            }),
          );
        }
      }

      setImages(item.images || []);
    } else {
      reset(EMPTY_DEFAULTS);
      setSpecs([]);
      setPricing(null);
      setTiers([]);
      setPriceLevels(EMPTY_PRICE_LEVELS);
      setImages([]);
    }
  }, [item, reset, isLoading]);

  const handleBrandSave = async (created?: any) => {
    setBrandDialog(false);
    setLoadingBrands(true);
    try {
      const res = await brandsService.getActive();
      const updated = Array.isArray(res?.data) ? res.data : [];
      setBrands(updated);
      if (created?.id) setValue("brandId", created.id);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleCategorySuccess = async (created?: any) => {
    setLoadingCategories(true);
    try {
      const res = await categoriesService.getActive();
      const updated = Array.isArray(res?.data) ? res.data : [];
      setCategories(updated);
      if (created?.id) setValue("categoryId", created.id);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleUnitSave = async (created?: any) => {
    setUnitDialog(false);
    setLoadingUnits(true);
    try {
      const res = await unitsService.getActive();
      const updated = Array.isArray(res?.data) ? res.data : [];
      setUnits(updated);
      if (created?.id) setValue("unitId", created.id);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleModelSave = async (created?: any) => {
    setModelDialog(false);
    setLoadingModels(true);
    try {
      const res = await modelsService.getActive();
      const updated = Array.isArray(res?.data) ? res.data : [];
      setModels(updated);
      if (created?.id) setValue("modelId", created.id);
    } finally {
      setLoadingModels(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      const payload: any = { ...data };

      if (!payload.modelId) payload.modelId = null;
      if (!payload.barcode) payload.barcode = null;
      if (!payload.identity) payload.identity = null;
      if (!payload.location) payload.location = null;
      if (!payload.description) payload.description = null;
      if (!payload.shortName) payload.shortName = null;
      if (!payload.reference) payload.reference = null;
      if (!payload.contraindications) payload.contraindications = null;

      payload.technicalSpecs =
        specs.length > 0
          ? specs.reduce((acc: any, spec) => {
              if (spec.label.trim()) acc[spec.label.trim()] = spec.value;
              return acc;
            }, {})
          : null;

      if (data.costPrice || data.salePrice || pricing?.costForeign) {
        const activeLevels = priceLevels.filter((pl) => pl.priceForeign > 0);
        payload.pricing = {
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          wholesalePrice: data.wholesalePrice,
          minMargin: pricing?.minMargin ?? 0,
          maxMargin: pricing?.maxMargin ?? 0,
          discountPercentage: pricing?.discountPercentage,
          costForeign: pricing?.costForeign,
          exchangeRate: pricing?.exchangeRate,
          taxRateSale: pricing?.taxRateSale,
          taxRatePurchase: pricing?.taxRatePurchase,
          priceLevels: activeLevels.length > 0 ? activeLevels : undefined,
          tiers,
        };
      }

      payload.images = images;

      if (item?.id) {
        await itemService.update(item.id, payload);
      } else {
        await itemService.create(payload);
      }
      onSave();
    } catch (error: any) {
      handleFormError(error, toast);
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

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
    <>
      <form id={formId || "item-form"} onSubmit={handleSubmit(onSubmit)}>
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        >
          <TabPanel header="Datos Básicos" leftIcon="pi pi-box">
            <BasicDataTab
              control={control}
              errors={errors}
              brands={brands}
              categories={categories}
              models={models}
              units={units}
              isEditMode={!!item?.id}
              loadingBrands={loadingBrands}
              loadingCategories={loadingCategories}
              loadingModels={loadingModels}
              loadingUnits={loadingUnits}
              onAddBrand={() => setBrandDialog(true)}
              onAddCategory={() => setCategoryDialog(true)}
              onAddUnit={() => setUnitDialog(true)}
              onAddModel={() => setModelDialog(true)}
            />
          </TabPanel>

          <TabPanel header="Precios" leftIcon="pi pi-dollar">
            <PricingTab
              control={control}
              errors={errors}
              calculatedMargin={calculatedMargin}
              pricing={pricing}
              onPricingChange={setPricing}
              priceLevels={priceLevels}
              onPriceLevelsChange={setPriceLevels}
            />
          </TabPanel>

          <TabPanel header="Precios Escalonados" leftIcon="pi pi-chart-bar">
            <PricingTiersTab
              tiers={tiers}
              onTiersChange={setTiers}
              salePrice={salePrice}
            />
          </TabPanel>

          <TabPanel header="Imágenes" leftIcon="pi pi-images">
            <ImagesTab
              itemId={item?.id}
              images={images}
              onImagesChange={setImages}
              toast={toast}
            />
          </TabPanel>

          <TabPanel header="Especificaciones" leftIcon="pi pi-list">
            <SpecificationsTab specs={specs} onSpecsChange={setSpecs} />
          </TabPanel>
        </TabView>
      </form>

      {/* Brand quick-create */}
      <Dialog
        visible={brandDialog}
        onHide={() => setBrandDialog(false)}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-tag mr-3 text-primary text-3xl"></i>
                Nueva Marca
              </h2>
            </div>
          </div>
        }
        style={{ width: "450px" }}
        modal
        className="p-fluid"
        footer={
          <FormActionButtons
            formId="brand-form-inline"
            isUpdate={false}
            onCancel={() => setBrandDialog(false)}
            isSubmitting={isQuickCreateSubmitting}
          />
        }
      >
        <BrandForm
          brand={null}
          formId="brand-form-inline"
          onSave={() => {}}
          onCreated={handleBrandSave}
          onSubmittingChange={setIsQuickCreateSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Category quick-create */}
      <Dialog
        visible={categoryDialog}
        onHide={() => setCategoryDialog(false)}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-list mr-3 text-primary text-3xl"></i>
                Nueva Categoría
              </h2>
            </div>
          </div>
        }
        style={{ width: "450px" }}
        modal
        className="p-fluid"
        footer={
          <FormActionButtons
            formId="category-form-inline"
            isUpdate={false}
            onCancel={() => setCategoryDialog(false)}
            isSubmitting={isQuickCreateSubmitting}
          />
        }
      >
        <CategoryForm
          category={null}
          formId="category-form-inline"
          hideFormDialog={() => setCategoryDialog(false)}
          onCreated={handleCategorySuccess}
          onSubmittingChange={setIsQuickCreateSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Unit quick-create */}
      <Dialog
        visible={unitDialog}
        onHide={() => setUnitDialog(false)}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-box mr-3 text-primary text-3xl"></i>
                Nueva Unidad
              </h2>
            </div>
          </div>
        }
        style={{ width: "450px" }}
        modal
        className="p-fluid"
        footer={
          <FormActionButtons
            formId="unit-form-inline"
            isUpdate={false}
            onCancel={() => setUnitDialog(false)}
            isSubmitting={isQuickCreateSubmitting}
          />
        }
      >
        <UnitForm
          model={null}
          formId="unit-form-inline"
          onSave={() => {}}
          onCreated={handleUnitSave}
          onSubmittingChange={setIsQuickCreateSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Model quick-create */}
      <Dialog
        visible={modelDialog}
        onHide={() => setModelDialog(false)}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-objects-column mr-3 text-primary text-3xl"></i>
                Nuevo Modelo
              </h2>
            </div>
          </div>
        }
        style={{ width: "450px" }}
        modal
        className="p-fluid"
        footer={
          <FormActionButtons
            formId="model-form-inline"
            isUpdate={false}
            onCancel={() => setModelDialog(false)}
            isSubmitting={isQuickCreateSubmitting}
          />
        }
      >
        <ItemModelForm
          model={null}
          formId="model-form-inline"
          onSave={() => {}}
          onCreated={handleModelSave}
          onSubmittingChange={setIsQuickCreateSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  );
}
