"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { handleFormError } from "@/utils/errorHandlers";
import materialSignatureService from "../services/materialSignatureService";
import type {
  MaterialSignature,
  SignerRole,
  SignatureStatus,
} from "../interfaces/materialSignature.interface";

const ROLE_OPTIONS: { label: string; value: SignerRole }[] = [
  { label: "Almacenista", value: "STOREKEEPER" },
  { label: "Jefe de Taller", value: "SHOP_FOREMAN" },
  { label: "Asesor de Servicio", value: "ADVISOR" },
  { label: "Técnico", value: "TECHNICIAN" },
];

const ROLE_LABEL: Record<SignerRole, string> = {
  STOREKEEPER: "Almacenista",
  SHOP_FOREMAN: "Jefe de Taller",
  ADVISOR: "Asesor",
  TECHNICIAN: "Técnico",
};

export default function MaterialSignaturesPanel({
  materialId,
}: {
  materialId: string;
}) {
  const toast = useRef<Toast>(null);
  const [sigs, setSigs] = useState<MaterialSignature[]>([]);
  const [status, setStatus] = useState<SignatureStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<SignerRole>("STOREKEEPER");
  const [signerId, setSignerId] = useState("");
  const [signerName, setSignerName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([
        materialSignatureService.listByMaterial(materialId),
        materialSignatureService.status(materialId),
      ]);
      setSigs(list);
      setStatus(st);
    } catch (e) {
      handleFormError(e, toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (materialId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  const sign = async () => {
    if (!signerId) return;
    try {
      await materialSignatureService.create({
        materialId,
        signerRole: role,
        signerId,
        signerName: signerName || undefined,
      });
      setSignerId("");
      setSignerName("");
      toast.current?.show({
        severity: "success",
        summary: "Firma registrada",
        life: 2000,
      });
      load();
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const remove = async (id: string) => {
    try {
      await materialSignatureService.delete(id);
      load();
    } catch (e) {
      handleFormError(e, toast);
    }
  };

  const presentRoles = new Set(sigs.map((s) => s.signerRole));

  return (
    <div className="surface-100 p-3 border-round">
      <Toast ref={toast} />
      <div className="flex justify-content-between align-items-center mb-2">
        <h5 className="m-0">Protocolo de Firmas (§15.5)</h5>
        {status && (
          <Tag
            value={status.complete ? "Completo" : "Incompleto"}
            severity={status.complete ? "success" : "warning"}
          />
        )}
      </div>

      {status && !status.complete && (
        <small className="block text-orange-600 mb-2">
          Faltan firmas:{" "}
          {status.missing.map((g) => g.map((r) => ROLE_LABEL[r]).join(" o ")).join(", ")}
        </small>
      )}

      <div className="flex flex-column gap-2 mb-3">
        {sigs.map((s) => (
          <div
            key={s.id}
            className="flex justify-content-between align-items-center surface-0 p-2 border-round"
          >
            <div>
              <strong>{ROLE_LABEL[s.signerRole]}</strong>
              <span className="ml-2 text-color-secondary">
                {s.signerName ?? s.signerId} — {new Date(s.signedAt).toLocaleString()}
              </span>
            </div>
            <Button
              icon="pi pi-trash"
              rounded
              text
              size="small"
              severity="danger"
              onClick={() => remove(s.id)}
            />
          </div>
        ))}
        {sigs.length === 0 && (
          <small className="text-color-secondary">Sin firmas registradas</small>
        )}
      </div>

      <div className="grid">
        <div className="col-4">
          <Dropdown
            value={role}
            onChange={(e) => setRole(e.value)}
            options={ROLE_OPTIONS.filter((o) => !presentRoles.has(o.value))}
            placeholder="Rol firmante"
            className="w-full"
          />
        </div>
        <div className="col-3">
          <InputText
            placeholder="userId"
            value={signerId}
            onChange={(e) => setSignerId(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="col-3">
          <InputText
            placeholder="Nombre"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="col-2">
          <Button
            label="Firmar"
            icon="pi pi-pencil"
            size="small"
            onClick={sign}
            disabled={!signerId || loading}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
