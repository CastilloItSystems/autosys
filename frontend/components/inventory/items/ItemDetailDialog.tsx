"use client";
import React from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressBar } from "primereact/progressbar";
import { Chip } from "primereact/chip";
import { Item } from "@/app/api/inventory/itemService";

interface ItemDetailDialogProps {
  visible: boolean;
  item: Item | null;
  onHide: () => void;
}

const fmt = (val: number | undefined | null) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    val || 0,
  );

const fmtUSD = (val: number | undefined | null) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    val || 0,
  );

const getPrimaryImage = (item: Item) => {
  if (!item.images || item.images.length === 0)
    return "/demo/images/product/product-placeholder.svg";
  const primary = item.images.find((img) => img.isPrimary);
  return (
    primary?.url ||
    item.images[0]?.url ||
    "/demo/images/product/product-placeholder.svg"
  );
};

// ---- Small reusable pieces ----

const InfoField = ({
  label,
  value,
  icon,
  full,
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
  full?: boolean;
}) => (
  <div className={`${full ? "col-12" : "col-12 md:col-6"} mb-3`}>
    <div className="surface-50 border-round p-3 h-full">
      <div className="flex align-items-center gap-2 mb-1">
        {icon && <i className={`${icon} text-primary text-sm`} />}
        <span className="text-xs text-500 font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span className="text-base font-semibold text-900">{value ?? "-"}</span>
    </div>
  </div>
);

const StatCard = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  color: string;
  icon: string;
}) => (
  <div className="col-6 md:col-3 mb-3">
    <div className="surface-card border-round border-1 border-surface-border p-3 text-center h-full">
      <i className={`${icon} text-2xl ${color} mb-2 block`} />
      <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
      <span className="text-xs text-500 font-medium uppercase">{label}</span>
    </div>
  </div>
);

const PriceCard = ({
  label,
  value,
  color,
  icon,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
  sub?: string;
}) => (
  <div className="col-12 md:col-4 mb-3">
    <div
      className={`border-round-xl p-4 border-left-4 ${color} surface-card shadow-1`}
    >
      <div className="flex justify-content-between align-items-start mb-2">
        <span className="text-xs text-500 font-medium uppercase">{label}</span>
        <i
          className={`${icon} text-xl`}
          style={{ color: "var(--primary-color)" }}
        />
      </div>
      <div className="text-2xl font-bold text-900 mb-1">{value}</div>
      {sub && <div className="text-xs text-500">{sub}</div>}
    </div>
  </div>
);

const BoolGroup = ({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: { label: string; value: boolean }[];
}) => (
  <div className="col-12 md:col-6 mb-3">
    <div className="surface-card border-round border-1 border-surface-border p-3 h-full">
      <div className="flex align-items-center gap-2 mb-3">
        <i className={`${icon} text-primary`} />
        <span className="font-semibold text-900 text-sm">{title}</span>
      </div>
      <div className="flex flex-column gap-2">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="flex align-items-center justify-content-between"
          >
            <span className="text-sm text-700">{label}</span>
            <Tag
              value={value ? "Sí" : "No"}
              severity={value ? "success" : "secondary"}
              className="text-xs"
              rounded
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ---- Main component ----

export default function ItemDetailDialog({
  visible,
  item,
  onHide,
}: ItemDetailDialogProps) {
  if (!item) return null;

  const margin =
    item.costPrice && item.salePrice && item.costPrice > 0
      ? ((item.salePrice - item.costPrice) / item.costPrice) * 100
      : null;

  const quantity = item.quantity || 0;
  const minStock = item.minStock || 0;
  const maxStock = item.maxStock || 0;
  const stockPct =
    maxStock > 0
      ? Math.min(Math.round((quantity / maxStock) * 100), 100)
      : null;
  const stockStatus =
    quantity === 0
      ? "Sin Stock"
      : quantity <= minStock
      ? "Bajo Stock"
      : "En Stock";
  const stockSeverity: any =
    quantity === 0 ? "danger" : quantity <= minStock ? "warning" : "success";
  const stockBarColor =
    quantity === 0
      ? "var(--red-500)"
      : quantity <= minStock
      ? "var(--orange-500)"
      : "var(--green-500)";

  const hasPriceLevels =
    item.pricing?.priceLevels && item.pricing.priceLevels.length > 0;
  const hasUsdModel =
    item.pricing?.costForeign != null && Number(item.pricing.costForeign) > 0;

  const dialogHeader = (
    <div className="mb-2 text-center md:text-left">
      <div className="border-bottom-2 border-primary pb-2">
        <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
          <i className="pi pi-info-circle mr-3 text-primary text-3xl" />
          Detalles del Artículo
        </h2>
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: "75vw" }}
      breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
      maximizable
      header={dialogHeader}
      modal
      onHide={onHide}
      contentClassName="p-0"
    >
      <div className="grid m-0">
        {/* ── Sidebar: imagen + resumen rápido ── */}
        <div
          className="col-12 md:col-3 flex flex-column gap-3 p-4"
          style={{
            borderRight: "1px solid var(--surface-border)",
            background: "var(--surface-50)",
          }}
        >
          <div className="border-round overflow-hidden shadow-1 bg-white">
            <img
              src={getPrimaryImage(item)}
              alt={item.name}
              className="w-full"
              style={{
                maxHeight: "180px",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* Stock rápido */}
          <div className="surface-card border-round border-1 border-surface-border p-3">
            <div className="flex justify-content-between align-items-center mb-2">
              <span className="text-xs text-500 uppercase font-medium">
                Stock
              </span>
              <Tag
                value={stockStatus}
                severity={stockSeverity}
                rounded
                className="text-xs"
              />
            </div>
            <div className="text-3xl font-bold text-900 mb-2">{quantity}</div>
            {stockPct !== null && (
              <ProgressBar
                value={stockPct}
                showValue={false}
                style={{ height: "6px" }}
                color={stockBarColor}
              />
            )}
            <div className="flex justify-content-between text-xs text-500 mt-1">
              <span>Mín: {minStock}</span>
              {maxStock > 0 && <span>Máx: {maxStock}</span>}
            </div>
          </div>

          {/* Precios rápidos */}
          <div className="surface-card border-round border-1 border-surface-border p-3">
            <span className="text-xs text-500 uppercase font-medium block mb-2">
              Precio de Venta
            </span>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {fmt(item.salePrice)}
            </div>
            <span className="text-xs text-500 uppercase font-medium block mb-1">
              Costo
            </span>
            <div className="text-lg font-semibold text-600">
              {fmt(item.costPrice)}
            </div>
            {margin !== null && (
              <div className="mt-2 flex align-items-center gap-2">
                <span className="text-xs text-500">Margen</span>
                <Tag
                  value={`${margin.toFixed(1)}%`}
                  severity={margin < 20 ? "warning" : "success"}
                  className="text-xs"
                  rounded
                />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-500 flex flex-column gap-1">
            {item.identity && (
              <div>
                <i className="pi pi-id-card mr-1" />
                ID: {item.identity}
              </div>
            )}
            {item.barcode && (
              <div>
                <i className="pi pi-barcode mr-1" />
                Barcode: {item.barcode}
              </div>
            )}
            {item.location && (
              <div>
                <i className="pi pi-map-marker mr-1" />
                Ubicación (Referencial): {item.location}
              </div>
            )}
            {item.unit?.name && (
              <div>
                <i className="pi pi-box mr-1" />
                Unidad: {item.unit.name}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="col-12 md:col-9 p-0">
          <TabView>
            {/* General */}
            <TabPanel header="General" leftIcon="pi pi-info-circle mr-2">
              <div className="grid p-2">
                <InfoField label="Nombre" value={item.name} icon="pi pi-box" />
                <InfoField
                  label="Nombre Corto"
                  value={item.shortName}
                  icon="pi pi-pencil"
                />
                <InfoField
                  label="Referencia"
                  value={item.reference}
                  icon="pi pi-link"
                />
                <InfoField
                  label="Marca"
                  value={item.brand?.name}
                  icon="pi pi-bookmark"
                />
                <InfoField
                  label="Categoría"
                  value={item.category?.name}
                  icon="pi pi-tag"
                />
                <InfoField
                  label="Modelo"
                  value={item.model?.name}
                  icon="pi pi-cog"
                />

                {item.description && (
                  <div className="col-12 mb-3">
                    <div className="surface-50 border-round p-3">
                      <div className="flex align-items-center gap-2 mb-1">
                        <i className="pi pi-align-left text-primary text-sm" />
                        <span className="text-xs text-500 font-medium uppercase">
                          Descripción
                        </span>
                      </div>
                      <p className="m-0 text-700 line-height-3">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )}

                {item.contraindications && (
                  <div className="col-12 mb-3">
                    <div
                      className="border-round p-3"
                      style={{
                        background: "var(--orange-50)",
                        border: "1px solid var(--orange-200)",
                      }}
                    >
                      <div className="flex align-items-center gap-2 mb-1">
                        <i className="pi pi-exclamation-triangle text-orange-500 text-sm" />
                        <span className="text-xs text-orange-600 font-medium uppercase">
                          Contraindicaciones
                        </span>
                      </div>
                      <p className="m-0 text-700 line-height-3">
                        {item.contraindications}
                      </p>
                    </div>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="col-12 mb-3">
                    <div className="surface-50 border-round p-3">
                      <div className="flex align-items-center gap-2 mb-2">
                        <i className="pi pi-tags text-primary text-sm" />
                        <span className="text-xs text-500 font-medium uppercase">
                          Etiquetas
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, i) => (
                          <Chip key={i} label={tag} className="text-xs" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Inventario */}
            <TabPanel header="Inventario" leftIcon="pi pi-warehouse mr-2">
              <div className="grid p-2">
                <StatCard
                  label="Stock Actual"
                  value={quantity}
                  color="text-primary"
                  icon="pi pi-box"
                />
                <StatCard
                  label="Stock Mínimo"
                  value={minStock}
                  color="text-orange-500"
                  icon="pi pi-arrow-down"
                />
                <StatCard
                  label="Stock Máximo"
                  value={maxStock || "-"}
                  color="text-blue-400"
                  icon="pi pi-arrow-up"
                />
                <StatCard
                  label="Punto Reorden"
                  value={item.reorderPoint || 0}
                  color="text-blue-500"
                  icon="pi pi-refresh"
                />

                {/* Barra de stock visual */}
                {stockPct !== null && (
                  <div className="col-12 mb-4">
                    <div className="surface-card border-round border-1 border-surface-border p-4">
                      <div className="flex justify-content-between align-items-center mb-2">
                        <span className="font-semibold text-900">
                          Nivel de Stock
                        </span>
                        <Tag
                          value={stockStatus}
                          severity={stockSeverity}
                          rounded
                        />
                      </div>
                      <ProgressBar
                        value={stockPct}
                        showValue
                        style={{ height: "12px" }}
                        color={stockBarColor}
                      />
                      <div className="flex justify-content-between text-xs text-500 mt-2">
                        <span>0</span>
                        <span>Mín: {minStock}</span>
                        <span>Máx: {maxStock}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-12 md:col-6 mb-3">
                  <div className="surface-card border-round border-1 border-surface-border p-3 text-center">
                    <i className="pi pi-shield text-primary text-2xl mb-2 block" />
                    <div className="text-xl font-bold mb-1">
                      {item.warrantyDays ?? 0} días
                    </div>
                    <span className="text-xs text-500 uppercase">Garantía</span>
                  </div>
                </div>
                <div className="col-12 md:col-6 mb-3">
                  <div className="surface-card border-round border-1 border-surface-border p-3 text-center">
                    <i className="pi pi-inbox text-primary text-2xl mb-2 block" />
                    <div className="text-xl font-bold mb-1">
                      {item.packagingQty ?? 1} uds.
                    </div>
                    <span className="text-xs text-500 uppercase">Empaque</span>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Precios */}
            <TabPanel header="Precios" leftIcon="pi pi-dollar mr-2">
              <div className="grid p-2">
                <PriceCard
                  label="Precio de Venta"
                  value={fmt(item.salePrice)}
                  color="border-green-500"
                  icon="pi pi-shopping-cart"
                  sub={
                    hasUsdModel
                      ? `USD ${fmtUSD(
                          item.pricing?.priceLevels?.[0]?.priceForeign,
                        )}`
                      : undefined
                  }
                />
                <PriceCard
                  label="Precio de Costo"
                  value={fmt(item.costPrice)}
                  color="border-blue-400"
                  icon="pi pi-wallet"
                  sub={
                    hasUsdModel
                      ? `USD ${fmtUSD(item.pricing?.costForeign)}`
                      : undefined
                  }
                />
                <PriceCard
                  label="Precio Mayoreo"
                  value={item.wholesalePrice ? fmt(item.wholesalePrice) : "-"}
                  color="border-purple-400"
                  icon="pi pi-users"
                />

                {margin !== null && (
                  <div className="col-12 mb-3">
                    <div className="surface-card border-round border-1 border-surface-border p-3">
                      <div className="flex justify-content-between align-items-center mb-2">
                        <span className="font-semibold text-900">
                          Margen de Ganancia
                        </span>
                        <Tag
                          value={`${margin.toFixed(2)}%`}
                          severity={margin < 20 ? "warning" : "success"}
                          className="text-base px-3"
                          rounded
                        />
                      </div>
                      <ProgressBar
                        value={Math.min(margin, 100)}
                        showValue={false}
                        style={{ height: "8px" }}
                        color={
                          margin < 20 ? "var(--orange-500)" : "var(--green-500)"
                        }
                      />
                    </div>
                  </div>
                )}

                {hasUsdModel && item.pricing && (
                  <>
                    <div className="col-12">
                      <Divider align="left">
                        <span className="text-sm font-semibold text-500">
                          <i className="pi pi-globe mr-2" />
                          Modelo Dólar
                        </span>
                      </Divider>
                    </div>
                    <InfoField
                      label="Costo USD"
                      value={fmtUSD(item.pricing.costForeign)}
                      icon="pi pi-dollar"
                    />
                    <InfoField
                      label="Tasa de Cambio"
                      value={
                        item.pricing.exchangeRate != null
                          ? `${Number(item.pricing.exchangeRate).toFixed(2)}`
                          : null
                      }
                      icon="pi pi-arrows-h"
                    />
                    <InfoField
                      label="IVA Venta"
                      value={
                        item.pricing.taxRateSale != null
                          ? `${item.pricing.taxRateSale}%`
                          : null
                      }
                      icon="pi pi-percentage"
                    />
                    <InfoField
                      label="IVA Compra"
                      value={
                        item.pricing.taxRatePurchase != null
                          ? `${item.pricing.taxRatePurchase}%`
                          : null
                      }
                      icon="pi pi-percentage"
                    />
                  </>
                )}

                {hasPriceLevels && item.pricing?.priceLevels && (
                  <>
                    <div className="col-12">
                      <Divider align="left">
                        <span className="text-sm font-semibold text-500">
                          <i className="pi pi-chart-bar mr-2" />
                          Niveles de Precio
                        </span>
                      </Divider>
                    </div>
                    <div className="col-12">
                      <div className="surface-card border-round border-1 border-surface-border overflow-hidden">
                        <table
                          className="w-full"
                          style={{ borderCollapse: "collapse" }}
                        >
                          <thead>
                            <tr style={{ background: "var(--surface-100)" }}>
                              <th className="p-3 text-left text-xs text-500 font-semibold uppercase">
                                Nivel
                              </th>
                              <th className="p-3 text-right text-xs text-500 font-semibold uppercase">
                                USD
                              </th>
                              <th className="p-3 text-right text-xs text-500 font-semibold uppercase">
                                Precio
                              </th>
                              <th className="p-3 text-right text-xs text-500 font-semibold uppercase">
                                c/IVA
                              </th>
                              <th className="p-3 text-center text-xs text-500 font-semibold uppercase">
                                Utilidad
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.pricing.priceLevels.map((pl, idx) => (
                              <tr
                                key={pl.level}
                                style={{
                                  borderTop: "1px solid var(--surface-200)",
                                  background:
                                    idx % 2 === 0
                                      ? "transparent"
                                      : "var(--surface-50)",
                                }}
                              >
                                <td className="p-3">
                                  <span
                                    className="inline-flex align-items-center justify-content-center border-round font-bold text-sm"
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      background: "var(--primary-100)",
                                      color: "var(--primary-700)",
                                    }}
                                  >
                                    {pl.level}
                                  </span>
                                </td>
                                <td className="p-3 text-right text-sm text-600">
                                  {fmtUSD(pl.priceForeign)}
                                </td>
                                <td className="p-3 text-right font-semibold text-900">
                                  {fmt(pl.price)}
                                </td>
                                <td className="p-3 text-right text-sm text-600">
                                  {fmt(pl.finalPrice)}
                                </td>
                                <td className="p-3 text-center">
                                  <Tag
                                    value={`${Number(pl.utility).toFixed(1)}%`}
                                    severity={
                                      Number(pl.utility) < 15
                                        ? "warning"
                                        : "success"
                                    }
                                    rounded
                                    className="text-xs"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabPanel>

            {/* Configuración */}
            <TabPanel header="Config." leftIcon="pi pi-cog mr-2">
              <div className="grid p-2">
                <BoolGroup
                  title="Inventario"
                  icon="pi pi-box"
                  items={[
                    { label: "Usa Stock", value: item.useStock ?? true },
                    { label: "Serializado", value: item.isSerialized ?? false },
                    { label: "Lotes", value: item.hasBatch ?? false },
                    { label: "Vencimiento", value: item.hasExpiry ?? false },
                    {
                      label: "Stock Negativo",
                      value: item.allowNegativeStock ?? false,
                    },
                  ]}
                />
                <BoolGroup
                  title="Producto"
                  icon="pi pi-shopping-bag"
                  items={[
                    {
                      label: "Fraccionable",
                      value: item.isFractionable ?? false,
                    },
                    { label: "Compuesto", value: item.isComposite ?? false },
                    {
                      label: "Uso Interno",
                      value: item.isInternalUse ?? false,
                    },
                    { label: "Usa Servidor", value: item.useServer ?? false },
                    {
                      label: "Susp. en Compra",
                      value: item.suspendedForPurchase ?? false,
                    },
                  ]}
                />
              </div>
            </TabPanel>

            {/* Especificaciones (solo si hay) */}
            {item.technicalSpecs &&
              Object.keys(item.technicalSpecs).length > 0 && (
                <TabPanel header="Especif." leftIcon="pi pi-list mr-2">
                  <div className="grid p-2">
                    {Object.entries(item.technicalSpecs).map(([key, val]) => (
                      <InfoField
                        key={key}
                        label={key}
                        value={String(val)}
                        icon="pi pi-minus"
                      />
                    ))}
                  </div>
                </TabPanel>
              )}
          </TabView>
        </div>
      </div>
    </Dialog>
  );
}
