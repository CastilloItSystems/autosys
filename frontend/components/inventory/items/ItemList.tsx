"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { DataView } from "primereact/dataview";
import { SelectButton } from "primereact/selectbutton";
import {
  AutoComplete,
  AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { Sidebar } from "primereact/sidebar";
import { motion } from "framer-motion";
import itemService, { Item } from "@/app/api/inventory/itemService";
import searchService from "@/app/api/inventory/searchService";
import type { ISearchFilters } from "@/app/api/inventory/searchService";
import ItemForm from "./ItemForm";
import ItemDetailDialog from "./ItemDetailDialog";
import CreateButton from "@/components/common/CreateButton";
import DeleteConfirmDialog from "@/components/common/DeleteConfirmDialog";
import FormActionButtons from "@/components/common/FormActionButtons";
import { AdvancedSearchPanel } from "@/components/inventory/search/AdvancedSearchPanel";

const ItemList = () => {
  // Datos
  const [items, setItems] = useState<Item[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(12);
  const [showActive, setShowActive] = useState<boolean>(true);
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [detailsDialog, setDetailsDialog] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionItem, setActionItem] = useState<Item | null>(null);
  const [filterSidebar, setFilterSidebar] = useState<boolean>(false);
  const [layout, setLayout] = useState<"grid" | "list" | "table">("table");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<ISearchFilters>({});
  const menuRef = useRef<Menu>(null);
  const toast = useRef<Toast>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cargar items cuando cambien los filtros
  useEffect(() => {
    const hasAdvancedFilters = Object.keys(advancedFilters).length > 0;

    if ((searchQuery && searchQuery.trim().length > 0) || hasAdvancedFilters) {
      // Si hay búsqueda o filtros avanzados, usar searchService
      performSearch();
    } else {
      // Si no hay búsqueda ni filtros, cargar todo normal
      loadItems();
    }
  }, [
    page,
    rows,
    searchQuery,
    showActive,
    advancedFilters,
    sortField,
    sortOrder,
  ]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemService.getAll({
        page: page + 1,
        limit: rows,
        isActive: showActive,
        sortBy: sortField,
        sortOrder: sortOrder,
      });

      const itemsData = response.data || [];
      const total = response.meta?.total || 0;
      console.log("items", itemsData);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading items:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar artículos",
        life: 3000,
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const response = await searchService.search({
        query: searchQuery,
        filters: {
          ...advancedFilters,
          isActive: showActive ? true : undefined,
        },
        page: page + 1,
        limit: rows,
        sortBy: sortField,
        sortOrder: sortOrder,
      });

      // Mapear resultados de búsqueda a Item
      const searchItems = response.data.map((res: any) => ({
        ...res,
        model: { name: res.modelName },
        category: { name: res.categoryName },
        brand: { name: res.brandName },
        // Images are already in correct structure from backend update
      }));

      setItems(searchItems as unknown as Item[]);
      setTotalRecords(response.meta?.total || 0);
    } catch (error) {
      console.error("Search error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error en la búsqueda",
        life: 3000,
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    const newPage =
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows);
    setPage(newPage);
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder === 1 ? "asc" : "desc");
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const searchSuggestions = async (event: AutoCompleteCompleteEvent) => {
    const query = event.query;

    // Debounce manual
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchService.search({
          query: query,
          page: 1,
          limit: 10,
        });

        setSuggestions(results.data);
      } catch (error) {
        setSuggestions([]);
      }
    }, 300); // 300ms delay
  };

  const onSuggestionSelect = (e: any) => {
    // Al seleccionar una sugerencia, mostramos los detalles directamente
    // o filtramos la tabla por ese item específico
    const selected = e.value;

    // Opción 1: Mostrar detalles directamente
    // const fullItem = { ...selected, category: { name: selected.categoryName } };
    // showDetails(fullItem as unknown as Item);

    // Opción 2: Filtrar la tabla (elegida por consistencia)
    setSearchQuery(selected.identity || selected.sku || selected.name);
    setPage(0);
  };

  const handleAdvancedSearch = (filters: ISearchFilters, query: string) => {
    setAdvancedFilters(filters);
    setSearchQuery(query);
    setFilterSidebar(false);
    setPage(0);
  };

  const itemSuggestionTemplate = (item: any) => {
    return (
      <div className="flex align-items-center justify-content-between gap-2">
        <div className="flex flex-column">
          <span className="font-bold text-sm">{item.name}</span>
          <span className="text-xs text-600">
            {item.sku || item.code ? `${item.sku || item.code} - ` : ""}
            {item.identity ? `${item.identity} - ` : ""}
            {item.categoryName}
          </span>
        </div>
        <span className="font-semibold text-primary text-sm">
          ${item.salePrice}
        </span>
      </div>
    );
  };

  const openNew = () => {
    setSelectedItem(null);
    setFormDialog(true);
  };

  const editItem = (item: Item) => {
    setSelectedItem({ ...item });
    setFormDialog(true);
  };

  const confirmDeleteItem = (item: Item) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const showDetails = (item: Item) => {
    setSelectedItem(item);
    setDetailsDialog(true);
  };

  const handleToggleItem = async (item: Item) => {
    try {
      await itemService.toggleActive(item.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Artículo ${item.isActive ? "desactivado" : "activado"}`,
        life: 3000,
      });
      loadItems();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cambiar estado del artículo",
        life: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem?.id) return;
    setIsDeleting(true);
    try {
      await itemService.delete(selectedItem.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Artículo eliminado correctamente",
        life: 3000,
      });
      loadItems();
      setDeleteDialog(false);
      setSelectedItem(null);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar artículo",
        life: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedItem?.id
        ? "Artículo actualizado correctamente"
        : "Artículo creado correctamente",
      life: 3000,
    });
    loadItems();
    setFormDialog(false);
  };

  const getMenuItems = (item: Item | null): MenuItem[] => {
    if (!item) return [];
    return [
      {
        label: "Ver detalles",
        icon: "pi pi-eye",
        command: () => showDetails(item),
      },
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => editItem(item),
      },
      {
        label: item.isActive ? "Desactivar" : "Activar",
        icon: item.isActive ? "pi pi-pause" : "pi pi-play",
        command: () => handleToggleItem(item),
      },
      {
        separator: true,
      },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => confirmDeleteItem(item),
      },
    ];
  };

  // Templates for DataTable
  const actionBodyTemplate = (rowData: Item) => {
    return (
      <Button
        icon="pi pi-cog"
        rounded
        text
        aria-controls="popup_menu"
        aria-haspopup
        onClick={(e) => {
          setActionItem(rowData);
          menuRef.current?.toggle(e);
        }}
        tooltip="Opciones"
        tooltipOptions={{ position: "left" }}
      />
    );
  };

  const statusBodyTemplate = (rowData: Item) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const skuBodyTemplate = (rowData: Item) => {
    return <span className="font-bold">{rowData.sku || "-"}</span>;
  };

  const codeBodyTemplate = (rowData: Item) => {
    return (
      <span className="font-bold text-primary">{rowData.code || "-"}</span>
    );
  };

  const identityBodyTemplate = (rowData: Item) => {
    return <span>{rowData.identity || "-"}</span>;
  };

  const locationBodyTemplate = (rowData: Item) => {
    return (
      <div className="flex align-items-center gap-2">
        <i
          className="pi pi-map-marker text-500"
          style={{ fontSize: "0.8rem" }}
        ></i>
        <span className="text-sm font-medium">{rowData.location || "-"}</span>
      </div>
    );
  };

  const quantityBodyTemplate = (rowData: Item) => {
    const amount = rowData.quantity || 0;
    const minStock = rowData.minStock || 0;
    const severity =
      amount === 0 ? "danger" : amount <= minStock ? "warning" : "success";
    return <Tag value={amount.toString()} severity={severity} rounded />;
  };

  const priceBodyTemplate = (rowData: Item) => {
    if (!rowData.salePrice) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(rowData.salePrice);
  };

  const marginBodyTemplate = (rowData: Item) => {
    if (!rowData.costPrice || !rowData.salePrice) return "-";
    const margin =
      ((rowData.salePrice - rowData.costPrice) / rowData.costPrice) * 100;
    const severity =
      margin < 10 ? "danger" : margin < 20 ? "warning" : "success";
    return <Tag value={`${margin.toFixed(0)}%`} severity={severity} rounded />;
  };

  const imagesBodyTemplate = (rowData: Item) => {
    const count = rowData.images?.length || 0;
    if (count === 0) return <Tag value="0" severity="info" rounded />;
    return <Tag value={`📷 ${count}`} severity="success" rounded />;
  };

  const tagsBodyTemplate = (rowData: Item) => {
    if (!rowData.tags || rowData.tags.length === 0) return "-";
    return rowData.tags
      .slice(0, 2)
      .map((tag, idx) => (
        <Tag
          key={idx}
          value={tag}
          style={{ marginRight: "4px" }}
          severity="info"
        />
      ));
  };

  // Templates for DataView
  const getSeverity = (item: Item) => {
    const amount = item.quantity || 0;
    const minStock = item.minStock || 0;
    if (amount === 0) return "danger";
    if (amount <= minStock) return "warning";
    return "success";
  };

  const getPrimaryImage = (item: Item) => {
    if (!item.images || item.images.length === 0) {
      return "/demo/images/product/product-placeholder.svg";
    }
    const primary = item.images.find((img) => img.isPrimary);
    return (
      primary?.url ||
      item.images[0]?.url ||
      "/demo/images/product/product-placeholder.svg"
    );
  };

  const getMargin = (item: Item) => {
    if (!item.costPrice || !item.salePrice) return null;
    return ((item.salePrice - item.costPrice) / item.costPrice) * 100;
  };

  const formatPrice = (value: number | undefined | null) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value || 0);

  const gridItem = (item: Item) => {
    const severity = getSeverity(item);
    const margin = getMargin(item);
    return (
      <div className="col-12 sm:col-6 md:col-4 lg:col-3 xl:col-3 p-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <div
            className="surface-card shadow-1 border-round h-full flex flex-column justify-content-between border-left-3"
            style={{
              borderLeftColor:
                severity === "danger"
                  ? "var(--red-500)"
                  : severity === "warning"
                  ? "var(--yellow-500)"
                  : "var(--green-500)",
            }}
          >
            {/* Header: categoría + estado */}
            <div className="flex align-items-center justify-content-between gap-1 px-3 pt-3 pb-1">
              <div className="flex align-items-center gap-1 min-w-0">
                <i
                  className="pi pi-tag text-600"
                  style={{ fontSize: "0.7rem" }}
                ></i>
                <span
                  className="font-semibold text-600 text-overflow-ellipsis white-space-nowrap overflow-hidden"
                  style={{ fontSize: "0.75rem" }}
                >
                  {item.category?.name || "-"}
                </span>
              </div>
              <Tag
                value={item.isActive ? "Activo" : "Inactivo"}
                severity={item.isActive ? "success" : "secondary"}
                rounded
                className="text-xs flex-shrink-0"
              />
            </div>

            {/* Imagen + info principal */}
            <div className="flex flex-column align-items-center gap-2 px-3 py-2">
              <img
                src={getPrimaryImage(item)}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "110px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div className="text-center w-full">
                <div
                  className="text-primary font-bold mb-1"
                  style={{ fontSize: "0.75rem" }}
                >
                  {item.sku || item.code}
                </div>
                <div
                  className="font-bold text-900 text-overflow-ellipsis white-space-nowrap overflow-hidden"
                  style={{ fontSize: "0.95rem" }}
                  title={item.name}
                >
                  {item.name}
                </div>
                {item.identity && (
                  <div className="text-600" style={{ fontSize: "0.72rem" }}>
                    Identidad: {item.identity}
                  </div>
                )}
                {item.brand?.name && (
                  <div
                    className="flex align-items-center justify-content-center gap-1 mt-1 text-600"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <i className="pi pi-box" style={{ fontSize: "0.65rem" }} />
                    <span>{item.brand.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Precio destacado */}
            <div className="text-center px-3 mb-1">
              <span className="text-xl font-bold text-primary">
                {formatPrice(item.salePrice)}
              </span>
            </div>

            {/* Stock + Margen compactos */}
            <div className="flex align-items-center justify-content-center gap-2 px-3 pb-1">
              <Tag
                value={`${item.quantity || 0}`}
                severity={severity}
                rounded
                className="text-xs"
              />
              {margin !== null ? (
                <Tag
                  value={`${margin.toFixed(0)}%`}
                  severity={
                    margin < 10 ? "danger" : margin < 20 ? "warning" : "success"
                  }
                  rounded
                  className="text-xs"
                />
              ) : null}
              <span className="text-500" style={{ fontSize: "0.65rem" }}>
                Min: {item.minStock || 0}
              </span>
            </div>

            {/* Meta info compacta */}
            <div
              className="flex align-items-center justify-content-center gap-2 px-3 pb-1 text-500"
              style={{ fontSize: "0.65rem" }}
            >
              {item.location && (
                <span title="Ubicación">
                  <i
                    className="pi pi-map-marker mr-1"
                    style={{ fontSize: "0.6rem" }}
                  />
                  {item.location}
                </span>
              )}
              {item.images && item.images.length > 0 && (
                <span>
                  <i
                    className="pi pi-image mr-1"
                    style={{ fontSize: "0.6rem" }}
                  />
                  {item.images.length}
                </span>
              )}
              {item.tags && item.tags.length > 0 && (
                <span>
                  <i
                    className="pi pi-hashtag mr-1"
                    style={{ fontSize: "0.6rem" }}
                  />
                  {item.tags.length}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-content-center border-top-1 surface-border px-2 py-1 gap-0">
              <Button
                icon="pi pi-cog"
                rounded
                text
                size="small"
                aria-controls="popup_menu"
                aria-haspopup
                onClick={(e) => {
                  setActionItem(item);
                  menuRef.current?.toggle(e);
                }}
                tooltip="Opciones"
                tooltipOptions={{ position: "top" }}
                className="p-1"
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const listItem = (item: Item, index: number) => {
    const severity = getSeverity(item);
    const margin = getMargin(item);
    return (
      <div className="col-12 p-2" key={item.id}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="surface-card shadow-1 border-round p-3 flex flex-wrap align-items-center gap-3 border-left-3"
            style={{
              borderLeftColor:
                severity === "danger"
                  ? "var(--red-500)"
                  : severity === "warning"
                  ? "var(--yellow-500)"
                  : "var(--green-500)",
            }}
          >
            {/* Imagen */}
            <img
              src={getPrimaryImage(item)}
              alt={item.name}
              style={{
                width: "5rem",
                height: "5rem",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />

            {/* Info principal */}
            <div className="flex-1 min-w-min">
              <div className="flex align-items-center gap-2 mb-1">
                <span className="font-semibold text-lg">{item.name}</span>
                <Tag
                  value={item.isActive ? "Activo" : "Inactivo"}
                  severity={item.isActive ? "success" : "secondary"}
                  rounded
                  className="text-xs"
                />
              </div>
              <div className="flex align-items-center gap-3 text-sm text-600 flex-wrap">
                <span className="font-bold text-primary">
                  {item.sku ? `SKU: ${item.sku}` : ""}
                  {item.code
                    ? ` ${item.sku ? "|" : ""} Código: ${item.code}`
                    : ""}
                </span>
                {item.identity && <span>Identidad: {item.identity}</span>}
                <span>
                  <i className="pi pi-tag text-xs mr-1" />
                  {item.category?.name || "-"}
                </span>
                {item.brand?.name && (
                  <span>
                    <i className="pi pi-box text-xs mr-1" />
                    {item.brand.name}
                  </span>
                )}
                {item.location && (
                  <span>
                    <i className="pi pi-map-marker text-xs mr-1" />
                    {item.location}
                  </span>
                )}
                {item.tags && item.tags.length > 0 && (
                  <span>
                    <i className="pi pi-hashtag text-xs mr-1" />
                    {item.tags.slice(0, 2).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Métricas */}
            <div className="flex align-items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-500">Stock</div>
                <Tag
                  value={String(item.quantity || 0)}
                  severity={severity}
                  rounded
                  className="text-sm"
                />
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Min</div>
                <span className="text-sm font-semibold">
                  {item.minStock || 0}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Precio</div>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(item.salePrice)}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Costo</div>
                <span className="text-sm font-semibold">
                  {formatPrice(item.costPrice)}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-500">Margen</div>
                {margin !== null ? (
                  <Tag
                    value={`${margin.toFixed(0)}%`}
                    severity={
                      margin < 10
                        ? "danger"
                        : margin < 20
                        ? "warning"
                        : "success"
                    }
                    rounded
                    className="text-sm"
                  />
                ) : (
                  <span className="text-sm text-400">—</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex align-items-center gap-1">
              <Button
                icon="pi pi-cog"
                rounded
                text
                size="small"
                aria-controls="popup_menu"
                aria-haspopup
                onClick={(e) => {
                  setActionItem(item);
                  menuRef.current?.toggle(e);
                }}
                tooltip="Opciones"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const itemTemplate = (item: Item, layout: string, index: number) => {
    if (!item) return null;
    if (layout === "list") return listItem(item, index);
    else if (layout === "grid") return gridItem(item);
  };

  const dataViewTemplate = (items: Item[], layout: string) => {
    if (!items || items.length === 0) return null;

    if (layout === "grid") {
      return (
        <div className="grid grid-nogutter">
          {items.map((item) => gridItem(item))}
        </div>
      );
    } else {
      return (
        <div className="grid grid-nogutter">
          {items.map((item, index) => listItem(item, index))}
        </div>
      );
    }
  };

  const headerTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
        <div className="flex align-items-center gap-2">
          <h4 className="m-0">Artículos</h4>
          <span className="text-600 text-sm">({totalRecords} total)</span>
        </div>
        <div className="flex gap-2 flex-wrap align-items-center">
          <Button
            label={showActive ? "Todos" : "Solo activos"}
            icon={showActive ? "pi pi-filter-slash" : "pi pi-filter"}
            outlined
            size="small"
            onClick={() => {
              setShowActive(!showActive);
              setPage(0);
            }}
          />
          <span className="p-input-icon-left w-20rem">
            <i className="pi pi-search" style={{ zIndex: 1 }} />
            <AutoComplete
              value={searchQuery}
              suggestions={suggestions}
              completeMethod={searchSuggestions}
              field="name"
              placeholder="Buscar (SKU, Código, Identidad, Nombre...)"
              itemTemplate={itemSuggestionTemplate}
              onSelect={onSuggestionSelect}
              onChange={(e) => handleSearch(e.value)}
              delay={300}
              inputClassName="w-full pl-5"
              className="w-full"
            />
          </span>
          <CreateButton label="Nuevo Artículo" onClick={openNew} />
          <Button
            icon="pi pi-sliders-h"
            rounded
            text
            onClick={() => setFilterSidebar(true)}
            tooltip="Filtros avanzados"
          />
        </div>
      </div>
    );
  };

  const layoutOptions = [
    { icon: "pi pi-table", value: "table" },
    { icon: "pi pi-list", value: "list" },
    { icon: "pi pi-th-large", value: "grid" },
  ];

  const layoutTemplate = (option: any) => {
    return <i className={option.icon}></i>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <div className="card">
        {headerTemplate()}

        <div className="mt-4 flex align-items-center justify-content-end mb-3">
          <SelectButton
            value={layout}
            onChange={(e) => e.value && setLayout(e.value)}
            options={layoutOptions}
            itemTemplate={layoutTemplate}
            allowEmpty={false}
          />
        </div>

        {layout === "table" ? (
          <DataTable
            value={items}
            paginator
            first={page * rows}
            rows={rows}
            totalRecords={totalRecords}
            rowsPerPageOptions={[6, 12, 24, 50]}
            onPage={onPageChange}
            onSort={onSort}
            sortField={sortField}
            sortOrder={sortOrder === "asc" ? 1 : -1}
            dataKey="id"
            loading={loading}
            emptyMessage="No se encontraron artículos"
            lazy
            scrollable
            tableStyle={{ minWidth: "50rem" }}
            size="small"
          >
            <Column
              field="sku"
              header="SKU"
              sortable
              body={skuBodyTemplate}
              style={{ minWidth: "110px" }}
            />
            <Column
              field="code"
              header="Código"
              sortable
              body={codeBodyTemplate}
              style={{ minWidth: "110px" }}
            />
            <Column
              field="name"
              header="Nombre"
              sortable
              style={{ minWidth: "250px" }}
            />
            <Column
              field="identity"
              header="Identidad"
              sortable
              body={identityBodyTemplate}
              style={{ minWidth: "160px" }}
            />
            <Column
              field="location"
              header="Ubicación"
              body={locationBodyTemplate}
              sortable
              style={{ minWidth: "140px" }}
            />
            <Column
              field="brand.name"
              header="Marca"
              style={{ minWidth: "120px" }}
            />
            <Column
              field="model.name"
              header="Modelo"
              style={{ minWidth: "120px" }}
            />
            <Column
              field="category.name"
              header="Categoría"
              style={{ minWidth: "120px" }}
            />
            <Column
              field="salePrice"
              header="Precio"
              body={priceBodyTemplate}
              sortable
              style={{ minWidth: "100px" }}
            />
            <Column
              header="Margen"
              body={marginBodyTemplate}
              style={{ minWidth: "90px" }}
            />
            <Column
              field="quantity"
              header="Stock"
              body={quantityBodyTemplate}
              style={{ minWidth: "80px" }}
            />
            <Column
              header="Imágenes"
              body={imagesBodyTemplate}
              style={{ minWidth: "100px" }}
            />
            <Column
              header="Tags"
              body={tagsBodyTemplate}
              style={{ minWidth: "120px" }}
            />
            <Column
              field="isActive"
              header="Estado"
              body={statusBodyTemplate}
              sortable
              style={{ minWidth: "100px" }}
            />
            <Column
              header="Acciones"
              body={actionBodyTemplate}
              exportable={false}
              frozen={true}
              alignFrozen="right"
              style={{ width: "6rem", textAlign: "center" }}
              headerStyle={{ textAlign: "center" }}
            />
          </DataTable>
        ) : (
          <DataView
            value={items}
            listTemplate={(items) => dataViewTemplate(items, layout)}
            paginator
            rows={rows}
            first={page * rows}
            totalRecords={totalRecords}
            onPage={onPageChange}
            loading={loading}
            emptyMessage="No se encontraron artículos"
            rowsPerPageOptions={[6, 12, 24, 50]}
            lazy
          />
        )}
      </div>

      <Dialog
        visible={formDialog}
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        maximizable
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-box mr-3 text-primary text-3xl"></i>
                {selectedItem?.id ? "Modificar Artículo" : "Crear Artículo"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
        footer={
          <FormActionButtons
            formId="item-form"
            isUpdate={!!selectedItem?.id}
            onCancel={() => setFormDialog(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ItemForm
          model={selectedItem}
          formId="item-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <DeleteConfirmDialog
        visible={deleteDialog}
        onHide={() => {
          setDeleteDialog(false);
          setSelectedItem(null);
        }}
        itemName={selectedItem?.name}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />

      <Menu
        model={getMenuItems(actionItem)}
        popup
        ref={menuRef}
        id="popup_menu"
      />

      <ItemDetailDialog
        visible={detailsDialog}
        item={selectedItem}
        onHide={() => setDetailsDialog(false)}
      />

      <Sidebar
        visible={filterSidebar}
        onHide={() => setFilterSidebar(false)}
        position="right"
        className="w-full md:w-30rem"
        header={<h2>Filtros Avanzados</h2>}
      >
        <AdvancedSearchPanel onSearch={handleAdvancedSearch} />
      </Sidebar>
    </motion.div>
  );
};

export default ItemList;
