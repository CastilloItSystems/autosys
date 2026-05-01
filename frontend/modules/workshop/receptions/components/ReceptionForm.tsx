"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TabView, TabPanel } from "primereact/tabview";
import { Card } from "primereact/card";
import { handleFormError } from "@/utils/errorHandlers";
import receptionService from '@/modules/workshop/receptions/services/receptionService';
import {
  createReceptionSchema,
  updateReceptionSchema,
  type CreateReceptionForm,
} from "@/modules/workshop/receptions/schemas/receptionZod";
import type { VehicleReception } from '@/modules/workshop/receptions/interfaces/reception.interface';;
import { useChecklistResponsesData } from "@/modules/workshop/checklists/hooks";
import type { ChecklistResponse } from "@/modules/workshop/checklists/interfaces/checklist.interface";

// Secciones
import ReceptionBasicInfoSection from "./sections/ReceptionBasicInfoSection";
import ReceptionVehicleStatusSection from "./sections/ReceptionVehicleStatusSection";
import ReceptionMediaPanel from "./ReceptionMediaPanel";
import ReceptionChecklistSection from "./sections/ReceptionChecklistSection";
import ReceptionSignatureSection from "./sections/ReceptionSignatureSection";
import ReceptionHeader from "./ReceptionHeader";

interface ReceptionFormProps {
  reception: VehicleReception | null;
  onSave: (newReceptionId?: string) => void | Promise<void>;
  formId?: string;
  onSubmittingChange?: (v: boolean) => void;
  toast: React.RefObject<any>;
  preloadData?: {
    appointmentId?: string;
    customerId?: string;
    customerVehicleId?: string;
    advisorId?: string;
  };
}

interface ReceptionChecklistPdfResponse {
  itemName: string;
  boolValue?: boolean | null;
  textValue?: string | null;
  numValue?: number | null;
  selectionValue?: string | null;
  observation?: string | null;
}

export default function ReceptionForm({
  reception,
  onSave,
  formId,
  onSubmittingChange,
  toast,
  preloadData,
}: ReceptionFormProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [checklistLoaded, setChecklistLoaded] = useState(false);
  const [checklistResponses, setChecklistResponses] = useState<
    ReceptionChecklistPdfResponse[]
  >([]);
  const [checklistTemplateName, setChecklistTemplateName] =
    useState<string>("");
  const [currentSignature, setCurrentSignature] = useState<
    string | null | undefined
  >(reception?.clientSignature);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReceptionForm>({
    resolver: zodResolver(
      reception ? updateReceptionSchema : createReceptionSchema,
    ),
    mode: "onBlur",
    defaultValues: {
      customerId: "",
      vehiclePlate: "",
      vehicleDesc: "",
      mileageIn: undefined,
      fuelLevel: undefined,
      accessories: [],
      hasPreExistingDamage: false,
      damageNotes: "",
      clientDescription: "",
      authorizationName: "",
      authorizationPhone: "",
      estimatedDelivery: undefined,
      advisorId: undefined,
      appointmentId: undefined,
    },
  });

  const {
    responses: savedChecklistResponses,
    loading: savedChecklistResponsesLoading,
    error: savedChecklistResponsesError,
  } = useChecklistResponsesData(reception?.id);

  useEffect(() => {
    setChecklistLoaded(false);
    setChecklistResponses([]);
    setChecklistTemplateName("");
    setSelectedTemplateId(null);
  }, [reception?.id]);

  // Cargar respuestas de checklist para recepciones existentes
  useEffect(() => {
    if (!reception?.id || checklistLoaded || savedChecklistResponsesLoading) {
      return;
    }

    if (savedChecklistResponsesError) {
      console.error(
        "[ReceptionForm] Error cargando checklist responses:",
        savedChecklistResponsesError,
      );
      setChecklistLoaded(true);
      return;
    }

    if (savedChecklistResponses.length > 0) {
      const [firstResponse] = savedChecklistResponses;
      const templateId = firstResponse.item?.checklistTemplateId;
      if (templateId) setSelectedTemplateId(templateId);
      setChecklistResponses(
        savedChecklistResponses.map((response: ChecklistResponse) => ({
          itemName: response.item?.name ?? "—",
          boolValue: response.boolValue,
          textValue: response.textValue,
          numValue:
            response.numValue != null ? Number(response.numValue) : null,
          selectionValue: response.selectionValue,
          observation: response.observation,
        })),
      );

      const templateName = firstResponse.item?.template?.name;
      if (templateName) {
        setChecklistTemplateName(templateName);
      }
    }

    setChecklistLoaded(true);
  }, [
    checklistLoaded,
    reception?.id,
    savedChecklistResponses,
    savedChecklistResponsesError,
    savedChecklistResponsesLoading,
  ]);

  // Reset form al cambiar reception o preloadData
  useEffect(() => {
    if (reception) {
      reset({
        customerId: reception.customerId ?? "",
        customerVehicleId: reception.customerVehicleId ?? undefined,
        vehiclePlate: reception.vehiclePlate ?? "",
        vehicleDesc: reception.vehicleDesc ?? "",
        mileageIn: reception.mileageIn ?? undefined,
        fuelLevel: (reception.fuelLevel as any) ?? undefined,
        accessories: (reception.accessories as string[]) ?? [],
        hasPreExistingDamage: reception.hasPreExistingDamage ?? false,
        damageNotes: reception.damageNotes ?? "",
        clientDescription: reception.clientDescription ?? "",
        authorizationName: reception.authorizationName ?? "",
        authorizationPhone: reception.authorizationPhone ?? "",
        estimatedDelivery: reception.estimatedDelivery
          ? reception.estimatedDelivery.substring(0, 16)
          : undefined,
        advisorId: reception.advisorId ?? undefined,
        appointmentId: reception.appointmentId ?? undefined,
      });
      setCurrentSignature(reception.clientSignature);
    } else if (preloadData) {
      reset({
        customerId: preloadData.customerId ?? "",
        customerVehicleId: preloadData.customerVehicleId ?? undefined,
        vehiclePlate: "",
        vehicleDesc: "",
        mileageIn: undefined,
        fuelLevel: undefined,
        accessories: [],
        hasPreExistingDamage: false,
        damageNotes: "",
        clientDescription: "",
        authorizationName: "",
        authorizationPhone: "",
        estimatedDelivery: undefined,
        advisorId: preloadData.advisorId ?? undefined,
        appointmentId: preloadData.appointmentId ?? undefined,
      });
    } else {
      reset({
        customerId: "",
        vehiclePlate: "",
        vehicleDesc: "",
        mileageIn: undefined,
        fuelLevel: undefined,
        accessories: [],
        hasPreExistingDamage: false,
        damageNotes: "",
        clientDescription: "",
        authorizationName: "",
        authorizationPhone: "",
        estimatedDelivery: undefined,
      });
    }
  }, [reception, reset, preloadData]);

  const handleVehicleSelect = (data: { id: string; plate: string; description: string } | null) => {
    setValue("vehiclePlate", data?.plate ?? "", { shouldDirty: true });
    setValue("vehicleDesc", data?.description ?? "", { shouldDirty: true });
  };

  const onSubmit = async (data: CreateReceptionForm) => {
    onSubmittingChange?.(true);
    try {
      const payload = {
        ...data,
        mileageIn: data.mileageIn ?? undefined,
        vehiclePlate: data.vehiclePlate || undefined,
        vehicleDesc: data.vehicleDesc || undefined,
        damageNotes: data.damageNotes || undefined,
        clientDescription: data.clientDescription || undefined,
        authorizationName: data.authorizationName || undefined,
        authorizationPhone: data.authorizationPhone || undefined,
      };

      let newId: string | undefined;
      if (reception?.id) {
        await receptionService.update(reception.id, payload);
      } else {
        const res = await receptionService.create(payload as any);
        newId = res.data?.id;
      }

      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: reception?.id
          ? "Cambios guardados exitosamente"
          : "Recepción creada exitosamente",
        life: 3000,
      });

      await onSave(newId);
    } catch (error) {
      handleFormError(error, toast);
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const progressItems = [
    {
      label: "Info base",
      completed: !!watch("customerId"),
      required: true,
    },
    {
      label: "Vehículo",
      completed: !!(watch("vehiclePlate") && watch("mileageIn") !== undefined),
      required: true,
    },
    {
      label: "Evidencia",
      completed: !!reception?.id,
      required: false,
    },
    {
      label: "Checklist",
      completed: !!(selectedTemplateId && checklistResponses.length > 0),
      required: false,
    },
    {
      label: "Autorización y Firma",
      completed: !!(currentSignature && reception?.diagnosticAuthorized),
      required: false,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* HEADER FIJO — fuera del scroll */}
      <ReceptionHeader
        reception={reception}
        currentSignature={currentSignature}
        checklistTemplateName={checklistTemplateName}
        checklistResponses={checklistResponses}
        progressItems={progressItems}
      />

      {/* CONTENIDO SCROLLABLE */}
      <div style={{ overflowY: "auto", flex: 1 }} className="p-3 md:p-4">
        <form
          id={formId ?? "reception-form"}
          onSubmit={handleSubmit(onSubmit)}
          className="p-fluid"
        >
          {!reception?.id ? (
            /* ── MODO CREACIÓN: formulario simple ── */
            <>
              <div className="mb-4 p-3 surface-100 border-round border-left-3 border-primary">
                <p className="text-600 m-0 text-sm">
                  <i className="pi pi-info-circle mr-2 text-primary" />
                  Completa la información básica y guarda para acceder a fotos,
                  checklist y firma del cliente.
                </p>
              </div>

              <Card className="mb-4">
                <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
                  <i className="pi pi-user text-primary" />
                  <span className="font-semibold text-base text-700">
                    Información de la Recepción
                  </span>
                </div>
                <ReceptionBasicInfoSection
                  control={control}
                  errors={errors}
                  isEditMode={false}
                  onVehicleSelect={handleVehicleSelect}
                />
              </Card>

              <Card className="mb-4">
                <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
                  <i className="pi pi-car text-primary" />
                  <span className="font-semibold text-base text-700">
                    Estado del Vehículo al Ingreso
                  </span>
                </div>
                <ReceptionVehicleStatusSection
                  control={control}
                  errors={errors}
                  watch={watch}
                />
              </Card>
            </>
          ) : (
            /* ── MODO EDICIÓN: TabView ── */
            <TabView
              activeIndex={activeTab}
              onTabChange={(e) => setActiveTab(e.index)}
            >
              {/* Tab 1: Recepción */}
              <TabPanel header="Recepción" leftIcon="pi pi-file-edit mr-2">
                <div className="pt-2">
                  <div className="mb-4">
                    <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
                      <i className="pi pi-user text-primary" />
                      <span className="font-semibold text-base text-700">
                        Información de la Recepción
                      </span>
                    </div>
                    <ReceptionBasicInfoSection
                      control={control}
                      errors={errors}
                      isEditMode={true}
                      onVehicleSelect={handleVehicleSelect}
                    />
                  </div>

                  <div className="mb-2">
                    <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 border-200">
                      <i className="pi pi-car text-primary" />
                      <span className="font-semibold text-base text-700">
                        Estado del Vehículo al Ingreso
                      </span>
                    </div>
                    <ReceptionVehicleStatusSection
                      control={control}
                      errors={errors}
                      watch={watch}
                    />
                  </div>
                </div>
              </TabPanel>

              {/* Tab 2: Evidencia visual */}
              <TabPanel header="Evidencia" leftIcon="pi pi-images mr-2">
                <div className="pt-2">
                  <ReceptionMediaPanel
                    receptionId={reception.id}
                    readOnly={false}
                    toast={toast}
                  />
                </div>
              </TabPanel>

              {/* Tab 3: Checklist */}
              <TabPanel header="Checklist" leftIcon="pi pi-check-square mr-2">
                <div className="pt-2">
                  <ReceptionChecklistSection
                    receptionId={reception.id}
                    selectedTemplateId={selectedTemplateId}
                    onTemplateSelect={setSelectedTemplateId}
                    toast={toast}
                  />
                </div>
              </TabPanel>

              {/* Tab 4: Autorización y Firma */}
              <TabPanel header="Autorización y Firma" leftIcon="pi pi-pencil mr-2">
                <div className="pt-2">
                  <ReceptionSignatureSection
                    receptionId={reception.id}
                    currentSignature={currentSignature}
                    currentDiagnosticAuth={reception.diagnosticAuthorized}
                    onSignatureSaved={setCurrentSignature}
                    toast={toast}
                    control={control}
                    errors={errors}
                  />
                </div>
              </TabPanel>
            </TabView>
          )}
        </form>
      </div>
    </div>
  );
}
