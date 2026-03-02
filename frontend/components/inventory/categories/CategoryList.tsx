"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import categoriesService, {
  Category,
} from "@/app/api/inventory/categoryService";
import CategoryForm from "./CategoryForm";
import CreateButton from "@/components/common/CreateButton";

export default function CategoryList() {
  // Datos
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  // Filtros y paginación
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [showActive, setShowActive] = useState<boolean>(true);

  // UI
  const [loading, setLoading] = useState<boolean>(true);
  const [formDialog, setFormDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [hierarchyDialog, setHierarchyDialog] = useState<boolean>(false);
  const [categoryToShowHierarchy, setCategoryToShowHierarchy] =
    useState<Category | null>(null);
  const toast = useRef<Toast>(null);

  // Cargar categorías cuando cambien los filtros
  useEffect(() => {
    loadCategories();
  }, [page, rows, searchQuery, showActive]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesService.getAll({
        page: page + 1,
        limit: rows,
        search: searchQuery || undefined,
        isActive: showActive ? "true" : undefined,
      });
      console.log(response);
      const categoriesData = response.data || [];
      const total = response.meta?.total || 0;

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar categorías",
        life: 3000,
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    // Con lazy=true, event tiene: { first, rows, sortBy, filters, globalFilter }
    // Sin lazy=true, event tiene: { page, rows, first... }
    const newPage =
      event.page !== undefined
        ? event.page
        : Math.floor(event.first / event.rows);
    setPage(newPage);
    setRows(event.rows);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const openNew = () => {
    setSelectedCategory(null);
    setFormDialog(true);
  };

  const editCategory = (category: Category) => {
    setSelectedCategory({ ...category });
    setFormDialog(true);
  };

  const confirmDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory?.id) return;

    try {
      await categoriesService.delete(selectedCategory.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: "Categoría eliminada correctamente",
        life: 3000,
      });
      loadCategories();
      setDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al eliminar la categoría",
        life: 3000,
      });
    }
  };

  const handleToggleCategory = async (category: Category) => {
    try {
      await categoriesService.toggleActive(category.id);
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Categoría ${
          category.isActive ? "desactivada" : "activada"
        } correctamente`,
        life: 3000,
      });
      loadCategories();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cambiar estado de la categoría",
        life: 3000,
      });
    }
  };

  const handleSave = () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedCategory?.id
        ? "Categoría actualizada correctamente"
        : "Categoría creada correctamente",
      life: 3000,
    });
    loadCategories();
    setFormDialog(false);
  };

  // Templates
  const openHierarchyModal = (category: Category) => {
    setCategoryToShowHierarchy(category);
    setHierarchyDialog(true);
  };

  const actionBodyTemplate = (rowData: Category) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          severity="info"
          text
          onClick={() => editCategory(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"}
          rounded
          severity={rowData.isActive ? "warning" : "success"}
          text
          onClick={() => handleToggleCategory(rowData)}
          tooltip={rowData.isActive ? "Desactivar" : "Activar"}
        />
        <Button
          icon="pi pi-trash"
          rounded
          severity="danger"
          text
          onClick={() => confirmDeleteCategory(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Category) => {
    return (
      <Tag
        value={rowData.isActive ? "Activo" : "Inactivo"}
        severity={rowData.isActive ? "success" : "secondary"}
        rounded
      />
    );
  };

  const codeBodyTemplate = (rowData: Category) => {
    return <span className="font-bold text-primary">{rowData.code}</span>;
  };

  const renderCategoryHierarchy = (
    category: Category | null,
    depth = 0,
  ): React.ReactNode => {
    if (!category) return null;

    const paddingLeft = depth * 24;
    const isRoot = !category.parent;
    const children = category.children || [];

    return (
      <div key={category.id}>
        <div
          className="flex align-items-center gap-2 py-2"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {depth === 0 ? (
            <i className="pi pi-folder text-primary text-lg"></i>
          ) : (
            <i className="pi pi-folder-open text-500 text-sm"></i>
          )}
          <div className="flex flex-column gap-1 flex-grow-1">
            <span
              className={depth === 0 ? "font-bold text-primary" : "font-medium"}
            >
              {category.name}
            </span>
            <span className="text-xs text-600">({category.code})</span>
          </div>
          {isRoot && (
            <Tag
              value="Raíz"
              severity="success"
              rounded
              style={{ fontSize: "0.75rem" }}
            />
          )}
          {children.length > 0 && (
            <Tag
              value={`${children.length} sub`}
              severity="info"
              rounded
              style={{ fontSize: "0.75rem" }}
            />
          )}
        </div>
        {children.length > 0 && (
          <div>
            {children.map((child) => renderCategoryHierarchy(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const parentBodyTemplate = (rowData: Category) => {
    if (!rowData.parent) {
      return <span className="text-gray-400 italic">Raíz</span>;
    }
    return (
      <div className="flex flex-column gap-1">
        <span className="font-medium">{rowData.parent.name}</span>
        <span className="text-xs text-600">({rowData.parent.code})</span>
      </div>
    );
  };

  const childrenCountBodyTemplate = (rowData: Category) => {
    const count = rowData.childrenCount || rowData._count?.children || 0;
    if (count === 0) {
      return <span className="text-gray-400">—</span>;
    }
    return (
      <div className="flex align-items-center gap-2">
        <Tag
          value={`${count} ${count === 1 ? "subcategoría" : "subcategorías"}`}
          severity="info"
          rounded
        />
        <Button
          icon="pi pi-search"
          rounded
          severity="secondary"
          text
          size="small"
          onClick={() => openHierarchyModal(rowData)}
          tooltip="Ver jerarquía"
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Categorías</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex gap-2">
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
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </span>
        <CreateButton label="Nueva Categoría" onClick={openNew} />
      </div>
    </div>
  );

  const deleteDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={() => setDeleteDialog(false)}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={handleDelete}
      />
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Toast ref={toast} />
      <div className="card">
        <DataTable
          value={categories}
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={onPageChange}
          dataKey="id"
          loading={loading}
          header={header}
          emptyMessage="No se encontraron categorías"
          sortMode="multiple"
          lazy
        >
          <Column
            field="code"
            header="Código"
            sortable
            body={codeBodyTemplate}
            style={{ minWidth: "80px" }}
          />
          <Column
            field="name"
            header="Nombre"
            sortable
            style={{ minWidth: "250px" }}
          />
          <Column
            field="parent"
            header="Categoría Padre"
            body={parentBodyTemplate}
            style={{ minWidth: "200px" }}
          />
          <Column
            field="childrenCount"
            header="Subcategorías"
            body={childrenCountBodyTemplate}
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
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "140px" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={formDialog}
        style={{ width: "450px" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-bookmark mr-3 text-primary text-3xl"></i>
                {selectedCategory?.id
                  ? "Modificar Categoría"
                  : "Crear Categoría"}
              </h2>
            </div>
          </div>
        }
        modal
        className="p-fluid"
        onHide={() => setFormDialog(false)}
      >
        <CategoryForm
          category={selectedCategory}
          hideFormDialog={() => setFormDialog(false)}
          onSuccess={handleSave}
          toast={toast}
        />
      </Dialog>

      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar eliminación"
        modal
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialog(false)}
      >
        <div className="confirmation-content flex align-items-center gap-3">
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "2rem", color: "var(--red-500)" }}
          />
          {selectedCategory && (
            <span>
              ¿Está seguro de eliminar la categoría{" "}
              <b>{selectedCategory.name}</b>?
            </span>
          )}
        </div>
      </Dialog>

      <Dialog
        visible={hierarchyDialog}
        style={{ width: "650px" }}
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-sitemap text-primary text-xl"></i>
            <span>Jerarquía - {categoryToShowHierarchy?.name}</span>
          </div>
        }
        modal
        onHide={() => {
          setHierarchyDialog(false);
          setCategoryToShowHierarchy(null);
        }}
        className="p-fluid"
      >
        {categoryToShowHierarchy && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-h-30rem overflow-y-auto"
          >
            {/* Mostrar jerarquía padre-hijo */}
            {categoryToShowHierarchy.parent ? (
              <>
                {/* Si tiene padre, mostrar la jerarquía hacia arriba */}
                <div className="mb-4 p-3 bg-50 border-1 border-200 border-round">
                  <h4 className="text-sm font-semibold text-600 mb-3 flex align-items-center gap-2">
                    <i className="pi pi-arrow-up text-primary"></i>
                    Categoría Padre
                  </h4>
                  {renderCategoryHierarchy(categoryToShowHierarchy.parent, 0)}
                </div>
              </>
            ) : (
              <div className="mb-4 p-3 bg-primary-50 border-1 border-primary-200 border-round">
                <div className="flex align-items-center gap-2 text-primary font-semibold">
                  <i className="pi pi-home"></i>
                  Esta es una categoría raíz
                </div>
              </div>
            )}

            {/* Mostrar la categoría actual */}
            <div className="mb-4 p-3 bg-primary-50 border-2 border-primary border-round">
              <div className="flex align-items-center gap-2 mb-2">
                <i className="pi pi-arrow-right text-primary"></i>
                <h4 className="text-sm font-semibold text-primary mb-0">
                  Categoría Actual
                </h4>
              </div>
              <div className="flex align-items-center gap-2 ml-4">
                <i className="pi pi-folder text-primary text-lg"></i>
                <div className="flex flex-column gap-1">
                  <span className="font-bold text-primary">
                    {categoryToShowHierarchy.name}
                  </span>
                  <span className="text-xs text-600">
                    ({categoryToShowHierarchy.code})
                  </span>
                </div>
              </div>
            </div>

            {/* Mostrar subcategorías */}
            {categoryToShowHierarchy.children &&
            categoryToShowHierarchy.children.length > 0 ? (
              <div className="p-3 bg-50 border-1 border-200 border-round">
                <h4 className="text-sm font-semibold text-600 mb-3 flex align-items-center gap-2">
                  <i className="pi pi-arrow-down text-primary"></i>
                  Subcategorías ({categoryToShowHierarchy.children.length})
                </h4>
                <div className="pl-3">
                  {categoryToShowHierarchy.children.map((child) => (
                    <div
                      key={child.id}
                      className="mb-2 p-2 bg-white border-1 border-200 border-round"
                    >
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-folder-open text-500 text-sm"></i>
                        <div className="flex flex-column gap-1 flex-grow-1">
                          <span className="font-medium text-900">
                            {child.name}
                          </span>
                          <span className="text-xs text-600">
                            ({child.code})
                          </span>
                        </div>
                        {child.children && child.children.length > 0 && (
                          <Tag
                            value={`${child.children.length} sub`}
                            severity="info"
                            rounded
                            style={{ fontSize: "0.75rem" }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-50 border-1 border-200 border-round text-center text-600">
                <i className="pi pi-inbox text-2xl mb-2 block"></i>
                <span className="text-sm">No tiene subcategorías</span>
              </div>
            )}
          </motion.div>
        )}
      </Dialog>
    </motion.div>
  );
}
