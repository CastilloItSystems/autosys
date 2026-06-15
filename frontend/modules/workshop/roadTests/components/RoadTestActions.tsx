"use client";
import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import roadTestService from "../services/roadTestService";
import type {
  RoadTest,
  RoadTestResult,
  AuthorizerRole,
} from "../interfaces/roadTest.interface";

const RESULT_OPTIONS = [
  { label: "Aprobada", value: "PASS" },
  { label: "Con observaciones", value: "WITH_OBSERVATIONS" },
  { label: "Fallida", value: "FAIL" },
];

export default function RoadTestActions({
  roadTest,
  onChanged,
}: {
  roadTest: RoadTest;
  onChanged: () => void;
}) {
  const toast = useRef<Toast>(null);
  const [authUserId, setAuthUserId] = useState("");
  const [authRole, setAuthRole] = useState<AuthorizerRole>("MANAGER");
  const [clientName, setClientName] = useState("");
  const [clientSig, setClientSig] = useState("");
  const [kmDeparture, setKmDeparture] = useState<number | null>(null);
  const [kmReturn, setKmReturn] = useState<number | null>(null);
  const [leaks, setLeaks] = useState(false);
  const [integrity, setIntegrity] = useState(true);
  const [result, setResult] = useState<RoadTestResult>("PASS");
  const [observations, setObservations] = useState("");

  const wrap = async (fn: () => Promise<unknown>, summary: string) => {
    try {
      await fn();
      toast.current?.show({ severity: "success", summary, life: 2500 });
      onChanged();
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const sig = (label: string, when: string | null) =>
    when ? (
      <small className="text-green-600">{label}: ✓ {new Date(when).toLocaleString()}</small>
    ) : (
      <small className="text-orange-500">{label}: pendiente</small>
    );

  return (
    <div className="flex flex-column gap-4">
      <Toast ref={toast} />

      <div className="surface-50 p-3 border-round">
        <h4 className="mt-0">Estado: {roadTest.status}</h4>
        <div className="flex flex-column gap-1">
          {sig("Gerente de Servicio", roadTest.authManagerAt)}
          {sig("Asesor", roadTest.authAdvisorAt)}
          {sig("Jefe de Taller", roadTest.authShopForemanAt)}
          {sig("Autorización Cliente", roadTest.clientAuthorizedAt)}
        </div>
      </div>

      {/* Autorización jerárquica */}
      {(roadTest.status === "DRAFT" || roadTest.status === "AUTHORIZED") && (
        <div className="surface-100 p-3 border-round">
          <h5 className="mt-0">Autorización jerárquica (§20.3)</h5>
          <div className="grid">
            <div className="col-5">
              <Dropdown
                value={authRole}
                onChange={(e) => setAuthRole(e.value)}
                options={[
                  { label: "Gerente de Servicio", value: "MANAGER" },
                  { label: "Asesor", value: "ADVISOR" },
                  { label: "Jefe de Taller", value: "SHOP_FOREMAN" },
                ]}
                className="w-full"
              />
            </div>
            <div className="col-5">
              <InputText
                placeholder="userId firmante"
                value={authUserId}
                onChange={(e) => setAuthUserId(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="col-2">
              <Button
                label="Firmar"
                size="small"
                onClick={() =>
                  wrap(
                    () =>
                      roadTestService.authorize(roadTest.id, {
                        role: authRole,
                        userId: authUserId,
                      }),
                    "Autorización registrada"
                  )
                }
                disabled={!authUserId}
              />
            </div>
          </div>

          <h5 className="mb-2">Autorización del Cliente</h5>
          <div className="grid">
            <div className="col-5">
              <InputText
                placeholder="Nombre cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="col-5">
              <InputText
                placeholder="URL firma (opcional)"
                value={clientSig}
                onChange={(e) => setClientSig(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="col-2">
              <Button
                label="Autorizar"
                size="small"
                onClick={() =>
                  wrap(
                    () =>
                      roadTestService.authorizeClient(roadTest.id, {
                        clientName,
                        signatureUrl: clientSig || undefined,
                      }),
                    "Autorización cliente registrada"
                  )
                }
                disabled={!clientName}
              />
            </div>
          </div>
        </div>
      )}

      {/* Salida */}
      {roadTest.status === "AUTHORIZED" && (
        <div className="surface-100 p-3 border-round">
          <h5 className="mt-0">Salida del vehículo</h5>
          <div className="grid align-items-end">
            <div className="col-8">
              <label className="block mb-1">Kilometraje salida</label>
              <InputNumber
                value={kmDeparture}
                onValueChange={(e) => setKmDeparture(e.value ?? null)}
                className="w-full"
              />
            </div>
            <div className="col-4">
              <Button
                label="Registrar salida"
                icon="pi pi-arrow-right"
                onClick={() =>
                  wrap(
                    () => roadTestService.depart(roadTest.id, { kmDeparture: kmDeparture ?? 0 }),
                    "Salida registrada"
                  )
                }
                disabled={kmDeparture == null}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reingreso */}
      {roadTest.status === "IN_PROGRESS" && (
        <div className="surface-100 p-3 border-round">
          <h5 className="mt-0">Reingreso del vehículo</h5>
          <div className="grid">
            <div className="col-6">
              <label className="block mb-1">Kilometraje retorno</label>
              <InputNumber
                value={kmReturn}
                onValueChange={(e) => setKmReturn(e.value ?? null)}
                className="w-full"
              />
            </div>
            <div className="col-6">
              <label className="block mb-1">Resultado</label>
              <Dropdown
                value={result}
                onChange={(e) => setResult(e.value)}
                options={RESULT_OPTIONS}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <div className="field-checkbox">
              <Checkbox
                inputId="leaks"
                checked={leaks}
                onChange={(e) => setLeaks(!!e.checked)}
              />
              <label htmlFor="leaks" className="ml-2">Fugas detectadas</label>
            </div>
            <div className="field-checkbox">
              <Checkbox
                inputId="integrity"
                checked={integrity}
                onChange={(e) => setIntegrity(!!e.checked)}
              />
              <label htmlFor="integrity" className="ml-2">Integridad verificada</label>
            </div>
          </div>
          <InputTextarea
            placeholder="Observaciones"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            className="w-full mt-2"
          />
          <Button
            label="Registrar reingreso"
            icon="pi pi-check"
            className="mt-2"
            onClick={() =>
              wrap(
                () =>
                  roadTestService.returnVehicle(roadTest.id, {
                    kmReturn: kmReturn ?? 0,
                    leaksDetected: leaks,
                    integrityVerified: integrity,
                    result,
                    observations: observations || undefined,
                  }),
                "Reingreso registrado"
              )
            }
            disabled={kmReturn == null}
          />
        </div>
      )}

      {roadTest.status !== "COMPLETED" &&
        roadTest.status !== "FAILED" &&
        roadTest.status !== "CANCELLED" && (
          <Button
            label="Cancelar Prueba"
            severity="danger"
            outlined
            onClick={() => wrap(() => roadTestService.cancel(roadTest.id), "Cancelada")}
          />
        )}
    </div>
  );
}
