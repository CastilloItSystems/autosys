"use client";
import React, { useEffect, useRef, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { handleFormError } from "@/utils/errorHandlers";
import customerCrmService from "@/app/api/crm/customerCrmService";
import {
  CustomerCrm,
  CUSTOMER_SEGMENT_CONFIG,
  CUSTOMER_CHANNEL_CONFIG,
  CUSTOMER_TYPE_CONFIG,
} from "@/libs/interfaces/crm/customer.crm.interface";
import CustomerCrmForm from "./CustomerCrmForm";
import CustomerTimeline from "./CustomerTimeline";
import CustomerVehiclePanel from "./CustomerVehiclePanel";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/components/common/FormActionButtons";
import { ConfirmActionPopup } from "@/components/common/ConfirmAction";

const CustomerCrmList = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerCrm[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCrm | null>(null);
  const [actionCustomer, setActionCustomer] = useState<CustomerCrm | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  // Dialogs
  const [formDialog, setFormDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [timelineDialog, setTimelineDialog] = useState(false);
  const [vehiclesDialog, setVehiclesDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useRef<Toast | null>(null);
  const menuRef = useRef<Menu>(null);
  const dt = useRef(null);

  // ── Debounced search ──
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(globalFilterValue), 500);
    return () => clearTimeout(handler);
  }, [globalFilterValue]);

  useEffect(() => {
    loadCustomers();
  }, [page, rows, sortField, sortOrder, debouncedSearch, segmentFilter, channelFilter, typeFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerCrmService.getAll({
        page: page + 1,
        limit: rows,
        search: debouncedSearch || undefined,
        segment: segmentFilter || undefined,
        preferredChannel: channelFilter || undefined,
        type: typeFilter || undefined,
        sortBy: sortField,
        sortOrder,
      });
      setCustomers(Array.isArray(res.data) ? res.data : []);
      setTotalRecords(res.meta?.total || 0);
    } catch (error) {
      console.error("Error al obtener clientes CRM:", error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    setPage(event.page !== undefined ? event.page : Math.floor(event.first / event.rows));
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    const newField = event.sortField;
    const newOrder = event.sortOrder === 1 ? "asc" : "desc";
    if (newField !== sortField || newOrder !== sortOrder) {
      setSortField(newField);
      setSortOrder(newOrder as "asc" | "desc");
    }
  };

  /* ── Actions ── */
  const openNew = () => {
    setSelectedCustomer(null);
    setFormDialog(true);
  };

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: selectedCustomer?.id ? "Cliente actualizado" : "Cliente creado",
      life: 3000,
    });
    await loadCustomers();
    setFormDialog(false);
    setSelectedCustomer(null);
  };

  const handleDelete = async () => {
    try {
      if (selectedCustomer?.id) {
        await customerCrmService.delete(selectedCustomer.id);
        await loadCustomers();
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente eliminado",
          life: 3000,
        });
      }
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      setSelectedCustomer(null);
      setDeleteDialog(false);
    }
  };

  const handleToggleActive = async (customer: CustomerCrm) => {
    try {
      await customerCrmService.update(customer.id, { isActive: !customer.isActive } as any);
      await loadCustomers();
      toast.current?.show({
        severity: "success",
        summary: "Éxito",
        detail: `Cliente ${customer.isActive ? "desactivado" : "activado"}`,
        life: 3000,
      });
    } catch (error) {
      handleFormError(error, toast);
    }
  };

  /* ── Table header ── */
  const segmentOptions = [
    { label: "Todos los segmentos", value: null },
    ...Object.entries(CUSTOMER_SEGMENT_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  ];

  const channelOptions = [
    { label: "Todos los canales", value: null },
    ...Object.entries(CUSTOMER_CHANNEL_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  ];

  const typeOptions = [
    { label: "Todos los tipos", value: null },
    ...Object.entries(CUSTOMER_TYPE_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  ];

  const renderHeader = () => (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 font-bold text-900">Clientes CRM</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2 align-items-center w-full sm:w-auto">
        <span className="p-input-icon-left w-full sm:w-20rem">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={(e) => {
              setGlobalFilterValue(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar (nombre, RIF, código...)"
            className="w-full"
          />
        </span>
        <Dropdown
          value={segmentFilter}
          options={segmentOptions}
          onChange={(e) => { setSegmentFilter(e.value); setPage(0); }}
          placeholder="Segmento"
          className="w-full sm:w-auto"
          style={{ minWidth: "160px" }}
        />
        <Dropdown
          value={channelFilter}
          options={channelOptions}
          onChange={(e) => { setChannelFilter(e.value); setPage(0); }}
          placeholder="Canal"
          className="w-full sm:w-auto"
          style={{ minWidth: "140px" }}
        />
        <Dropdown
          value={typeFilter}
          options={typeOptions}
          onChange={(e) => { setTypeFilter(e.value); setPage(0); }}
          placeholder="Tipo"
          className="w-full sm:w-auto"
          style={{ minWidth: "140px" }}
        />
        <CreateButton
          label="Nuevo Cliente"
          onClick={openNew}
          tooltip="Crear nuevo cliente"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );

  /* ── Menu ── */
  const getMenuItems = (customer: CustomerCrm | null): MenuItem[] => {
    if (!customer) return [];
    return [
      {
        label: "Perfil 360°",
        icon: "pi pi-id-card",
        command: () => {
          router.push(`/empresa/crm/clientes/${customer.id}`);
        },
      },
      {
        label: "Ver Timeline (modal)",
        icon: "pi pi-history",
        command: () => {
          setSelectedCustomer(customer);
          setTimelineDialog(true);
        },
      },
      {
        label: "Vehículos",
        icon: "pi pi-car",
        command: () => {
          setSelectedCustomer(customer);
          setVehiclesDialog(true);
        },
      },
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => {
          setSelectedCustomer(customer);
          setFormDialog(true);
        },
      },
      {
        label: customer.isActive ? "Desactivar" : "Activar",
        icon: customer.isActive ? "pi pi-eye-slash" : "pi pi-eye",
        command: () => handleToggleActive(customer),
      },
      { separator: true },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        className: "p-menuitem-danger",
        command: () => {
          setSelectedCustomer(customer);
          setDeleteDialog(true);
        },
      },
    ];
  };

  /* ── Column templates ── */
  const nameBodyTemplate = (rowData: CustomerCrm) => (
    <div className="flex flex-column">
      <div className="flex align-items-center gap-1">
        <span className="font-semibold text-900">{rowData.name}</span>
        {rowData.isSpecialTaxpayer && (
          <Tag value="CT" severity="warning" className="text-xs" style={{ fontSize: "0.65rem", padding: "1px 4px" }} tooltip="Contribuyente Especial" />
        )}
      </div>
      <span className="text-xs text-500">{rowData.code}</span>
      {rowData.taxId && <span className="text-xs text-400">{rowData.taxId}</span>}
    </div>
  );

  const segmentBodyTemplate = (rowData: CustomerCrm) => {
    const cfg = CUSTOMER_SEGMENT_CONFIG[rowData.segment as keyof typeof CUSTOMER_SEGMENT_CONFIG];
    if (!cfg) return <span className="text-400 text-xs">{rowData.segment}</span>;
    return <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />;
  };

  const channelBodyTemplate = (rowData: CustomerCrm) => {
    const cfg = CUSTOMER_CHANNEL_CONFIG[rowData.preferredChannel as keyof typeof CUSTOMER_CHANNEL_CONFIG];
    if (!cfg) return <span className="text-400 text-xs">{rowData.preferredChannel}</span>;
    return <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />;
  };

  const typeBodyTemplate = (rowData: CustomerCrm) => {
    const cfg = CUSTOMER_TYPE_CONFIG[rowData.type as keyof typeof CUSTOMER_TYPE_CONFIG];
    if (!cfg) return null;
    return (
      <div className="flex flex-column gap-1">
        <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />
        {rowData.type === "COMPANY" && rowData.creditLimit != null && rowData.creditLimit > 0 && (
          <span className="text-xs text-500">
            <i className="pi pi-credit-card mr-1" />
            ${Number(rowData.creditLimit).toLocaleString()} · {rowData.creditDays ?? 0}d
          </span>
        )}
      </div>
    );
  };

  const contactBodyTemplate = (rowData: CustomerCrm) => (
    <div className="flex flex-column">
      {rowData.email && (
        <span className="text-xs"><i className="pi pi-envelope text-500 mr-1" />{rowData.email}</span>
      )}
      {rowData.phone && (
        <span className="text-xs"><i className="pi pi-phone text-500 mr-1" />{rowData.phone}</span>
      )}
      {rowData.mobile && (
        <span className="text-xs"><i className="pi pi-comments text-500 mr-1" />{rowData.mobile}</span>
      )}
      {!rowData.email && !rowData.phone && !rowData.mobile && (
        <span className="text-400 text-xs">Sin contacto</span>
      )}
    </div>
  );

  const statsBodyTemplate = (rowData: CustomerCrm) => (
    <div className="flex gap-2 flex-wrap">
      {rowData._count?.orders !== undefined && (
        <span className="text-xs bg-blue-50 text-blue-700 border-round px-2 py-1">
          <i className="pi pi-shopping-cart mr-1" />{rowData._count.orders}
        </span>
      )}
      {rowData._count?.leads !== undefined && (
        <span className="text-xs bg-orange-50 text-orange-700 border-round px-2 py-1">
          <i className="pi pi-chart-line mr-1" />{rowData._count.leads}
        </span>
      )}
      {rowData._count?.interactions !== undefined && (
        <span className="text-xs bg-green-50 text-green-700 border-round px-2 py-1">
          <i className="pi pi-comments mr-1" />{rowData._count.interactions}
        </span>
      )}
    </div>
  );

  const statusBodyTemplate = (rowData: CustomerCrm) => (
    <Tag
      value={rowData.isActive ? "Activo" : "Inactivo"}
      severity={rowData.isActive ? "success" : "danger"}
      className="text-xs"
    />
  );

  const crudBodyTemplate = (rowData: CustomerCrm) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionCustomer(rowData);
        menuRef.current?.toggle(e);
      }}
      aria-controls="crm-customer-menu"
      aria-haspopup
    />
  );

  /* ── Render ── */
  return (
    <>
      <Toast ref={toast} />
      <ConfirmActionPopup />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <DataTable
          ref={dt}
          value={customers}
          header={renderHeader()}
          paginator
          lazy
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          onSort={onSort}
          sortField={sortField}
          sortOrder={sortOrder === "asc" ? 1 : -1}
          rowsPerPageOptions={[5, 10, 25, 50]}
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
          loading={loading}
          emptyMessage="No hay clientes registrados"
          size="small"
          dataKey="id"
          scrollable
          tableStyle={{ minWidth: "70rem" }}
        >
          <Column header="Cliente" body={nameBodyTemplate} sortable sortField="name" style={{ minWidth: "14rem" }} />
          <Column header="Segmento" body={segmentBodyTemplate} style={{ width: "10rem" }} />
          <Column header="Canal" body={channelBodyTemplate} style={{ width: "10rem" }} />
          <Column header="Tipo" body={typeBodyTemplate} style={{ width: "9rem" }} />
          <Column header="Contacto" body={contactBodyTemplate} style={{ minWidth: "12rem" }} />
          <Column header="Actividad" body={statsBodyTemplate} style={{ minWidth: "10rem" }} />
          <Column header="Estado" body={statusBodyTemplate} style={{ width: "7rem" }} />
          <Column
            field="createdAt"
            header="Creado"
            sortable
            body={(row) =>
              new Date(row.createdAt).toLocaleDateString("es-VE", {
                year: "numeric", month: "short", day: "numeric",
              })
            }
            style={{ width: "9rem" }}
          />
          <Column
            header="Acciones"
            body={crudBodyTemplate}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: "5rem", textAlign: "center" }}
            headerStyle={{ textAlign: "center" }}
          />
        </DataTable>
      </motion.div>

      {/* Delete dialog */}
      <Dialog
        visible={deleteDialog}
        style={{ width: "450px" }}
        header="Confirmar Eliminación"
        modal
        onHide={() => { setSelectedCustomer(null); setDeleteDialog(false); }}
        footer={
          <div className="flex w-full gap-2 mb-4">
            <Button label="No" icon="pi pi-times" severity="secondary" onClick={() => { setSelectedCustomer(null); setDeleteDialog(false); }} className="flex-1" />
            <Button label="Sí, Eliminar" icon="pi pi-trash" severity="danger" onClick={handleDelete} className="flex-1" />
          </div>
        }
      >
        <div className="flex align-items-center gap-3 p-2">
          <i className="pi pi-exclamation-triangle text-orange-500" style={{ fontSize: "2rem" }} />
          {selectedCustomer && (
            <span>¿Eliminar el cliente <b>{selectedCustomer.name}</b> ({selectedCustomer.code})?</span>
          )}
        </div>
      </Dialog>

      {/* Form dialog */}
      <Dialog
        visible={formDialog}
        style={{ width: "860px" }}
        breakpoints={{ "960px": "90vw", "640px": "95vw" }}
        maximizable
        header={
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-0 flex align-items-center gap-3">
              <i className="pi pi-users text-primary text-3xl" />
              {selectedCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
          </div>
        }
        modal
        onHide={() => { setFormDialog(false); setSelectedCustomer(null); }}
        footer={
          <FormActionButtons
            formId="customer-crm-form"
            isUpdate={!!selectedCustomer?.id}
            onCancel={() => { setFormDialog(false); setSelectedCustomer(null); }}
            isSubmitting={isSubmitting}
          />
        }
      >
        <CustomerCrmForm
          customer={selectedCustomer}
          formId="customer-crm-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      {/* Timeline dialog */}
      <Dialog
        visible={timelineDialog}
        style={{ width: "95vw", maxWidth: "1100px" }}
        breakpoints={{ "960px": "95vw" }}
        maximizable
        header={
          <div className="border-bottom-2 border-primary pb-2">
            <h2 className="text-2xl font-bold text-900 mb-0 flex align-items-center gap-3">
              <i className="pi pi-history text-primary text-3xl" />
              Timeline 360° — {selectedCustomer?.name}
            </h2>
          </div>
        }
        modal
        onHide={() => { setTimelineDialog(false); setSelectedCustomer(null); }}
      >
        {selectedCustomer && (
          <CustomerTimeline customerId={selectedCustomer.id} />
        )}
      </Dialog>

      {/* Vehicles dialog */}
      <Dialog
        visible={vehiclesDialog}
        style={{ width: "900px" }}
        header={`Vehículos — ${selectedCustomer?.name}`}
        modal
        onHide={() => { setVehiclesDialog(false); setSelectedCustomer(null); }}
      >
        {selectedCustomer && (
          <CustomerVehiclePanel customerId={selectedCustomer.id} />
        )}
      </Dialog>

      <Menu model={getMenuItems(actionCustomer)} popup ref={menuRef} id="crm-customer-menu" />
    </>
  );
};

export default CustomerCrmList;
