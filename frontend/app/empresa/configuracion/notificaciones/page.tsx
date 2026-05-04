"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useEmpresasStore } from "@/store/empresasStore";
import {
  getCompanyNotificationPolicies,
  getMyNotificationPreferences,
  getNotificationCatalog,
  NotificationCatalogItem,
  NotificationCompanyPolicyItem,
  NotificationPreferenceItem,
  updateCompanyNotificationPolicies,
  updateMyNotificationPreferences,
} from "@/shared/services/notificationService";
import { InputSwitch } from "primereact/inputswitch";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const MODULE_LABELS: Record<string, string> = {
  inventory: "Inventario",
  sales: "Ventas",
  purchases: "Compras",
  workshop: "Taller",
  crm: "CRM",
  dealer: "Concesionario",
  exchange_rates: "Tasas de Cambio",
  system: "Sistema",
};

const isHardLockedByCatalog = (item?: NotificationCatalogItem): boolean => {
  if (!item) return false;
  const severity = String(item.defaultSeverity || "").toUpperCase();
  const priority = String(item.defaultPriority || "").toUpperCase();
  return severity === "ERROR" || priority === "CRITICAL";
};

interface EmpresaSessionInfo {
  empresaId?: string;
  id_empresa?: string;
  permissions?: string[];
}

const getSessionPermissionsForEmpresa = (
  user: any,
  empresaId: string | null,
): string[] => {
  if (!empresaId) return [];
  const empresas = Array.isArray(user?.empresas)
    ? (user.empresas as EmpresaSessionInfo[])
    : [];

  const empresa = empresas.find(
    (item) => item.empresaId === empresaId || item.id_empresa === empresaId,
  );
  const permissions = empresa?.permissions;

  return Array.isArray(permissions)
    ? permissions.filter((permission) => typeof permission === "string")
    : [];
};

export default function NotificationSettingsPage() {
  const toast = useRef<Toast>(null);
  const { data: session, status } = useSession();
  const activeEmpresa = useEmpresasStore((state) => state.activeEmpresa);
  const activeEmpresaId = activeEmpresa?.id_empresa || null;

  const [loading, setLoading] = useState(true);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [catalog, setCatalog] = useState<NotificationCatalogItem[]>([]);
  const [companyPolicies, setCompanyPolicies] = useState<
    NotificationCompanyPolicyItem[]
  >([]);
  const [preferences, setPreferences] = useState<NotificationPreferenceItem[]>(
    [],
  );

  const activePermissions = useMemo(
    () => getSessionPermissionsForEmpresa(session?.user, activeEmpresaId),
    [session?.user, activeEmpresaId],
  );

  const canViewNotifications = activePermissions.includes("notifications.view");
  const canManagePolicy = activePermissions.includes(
    "notifications.manage_policy",
  );

  const catalogMap = useMemo(
    () => new Map(catalog.map((item) => [item.eventCode, item])),
    [catalog],
  );

  const groupedCompanyPolicies = useMemo(() => {
    const groups = new Map<string, NotificationCompanyPolicyItem[]>();
    for (const policy of companyPolicies) {
      const item = catalogMap.get(policy.eventCode);
      const moduleCode = item?.module || policy.module || "system";
      const current = groups.get(moduleCode) || [];
      current.push(policy);
      groups.set(moduleCode, current);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [companyPolicies, catalogMap]);

  const groupedPreferences = useMemo(() => {
    const groups = new Map<string, NotificationPreferenceItem[]>();
    for (const preference of preferences) {
      const item = catalogMap.get(preference.eventCode);
      const moduleCode = item?.module || preference.module || "system";
      const current = groups.get(moduleCode) || [];
      current.push(preference);
      groups.set(moduleCode, current);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [preferences, catalogMap]);

  const loadData = useCallback(async () => {
    if (!activeEmpresaId || status !== "authenticated") {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [catalogResponse, preferencesResponse, policyResponse] =
        await Promise.all([
          getNotificationCatalog(),
          getMyNotificationPreferences(),
          canManagePolicy
            ? getCompanyNotificationPolicies()
            : Promise.resolve({ items: [] }),
        ]);

      setCatalog(catalogResponse.items || []);
      setPreferences(preferencesResponse.items || []);
      setCompanyPolicies(policyResponse.items || []);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar la configuración de notificaciones.",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [activeEmpresaId, status, canManagePolicy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updatePolicy = (
    eventCode: string,
    patch: Partial<NotificationCompanyPolicyItem>,
  ) => {
    setCompanyPolicies((previous) =>
      previous.map((item) =>
        item.eventCode === eventCode ? { ...item, ...patch } : item,
      ),
    );
  };

  const updatePreference = (eventCode: string, enabled: boolean) => {
    setPreferences((previous) =>
      previous.map((item) =>
        item.eventCode === eventCode ? { ...item, enabled } : item,
      ),
    );
  };

  const handleSavePolicies = async () => {
    if (companyPolicies.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Advertencia",
        detail: "No hay políticas cargadas. Recarga la página e intenta de nuevo.",
        life: 4000,
      });
      return;
    }
    try {
      setSavingPolicies(true);

      const payload = companyPolicies.map((item) => ({
        eventCode: item.eventCode,
        enabled: Boolean(item.enabled),
        mandatory: Boolean(item.mandatory),
        requiredPermissionsAny: Array.isArray(item.requiredPermissionsAny)
          ? item.requiredPermissionsAny
          : [],
        dedupWindowSec:
          typeof item.dedupWindowSec === "number" ? item.dedupWindowSec : 300,
      }));

      await updateCompanyNotificationPolicies(payload);
      await loadData();
      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: "Política de empresa guardada correctamente.",
        life: 3000,
      });
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron guardar las políticas de empresa.",
        life: 4000,
      });
    } finally {
      setSavingPolicies(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);

      const payload = preferences.map((item) => ({
        eventCode: item.eventCode,
        enabled: Boolean(item.enabled),
      }));

      await updateMyNotificationPreferences(payload);
      await loadData();
      toast.current?.show({
        severity: "success",
        summary: "Guardado",
        detail: "Preferencias actualizadas correctamente.",
        life: 3000,
      });
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron guardar tus preferencias.",
        life: 4000,
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-900">Configuración de notificaciones</h2>
        <p className="text-600">Cargando configuración...</p>
      </div>
    );
  }

  if (!canViewNotifications) {
    return (
      <div className="p-4">
        <h2 className="text-900">Configuración de notificaciones</h2>
        <p className="text-600">
          Tu usuario no tiene permiso para ver notificaciones en esta empresa.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Toast ref={toast} />

      <div className="mb-4">
        <h2 className="text-900 mb-2">Configuración de notificaciones</h2>
        <p className="text-600 m-0">
          Ajusta políticas por empresa y tus preferencias personales por evento.
        </p>
      </div>

      {canManagePolicy && (
        <section className="surface-card border-round p-4 mb-4">
          <div className="flex align-items-center justify-content-between mb-3">
            <div>
              <h3 className="m-0 text-900">Política de empresa</h3>
              <small className="text-600">
                Define qué eventos están habilitados, cuáles son obligatorios y
                la ventana de deduplicación.
              </small>
            </div>
            <Button
              label="Guardar política"
              icon="pi pi-check"
              loading={savingPolicies}
              onClick={handleSavePolicies}
            />
          </div>

          <div className="flex flex-column gap-3">
            {groupedCompanyPolicies.map(([moduleCode, modulePolicies]) => (
              <div
                key={moduleCode}
                className="border-1 surface-border border-round p-3"
              >
                <h4 className="m-0 mb-3 text-900">
                  {MODULE_LABELS[moduleCode] || moduleCode}
                </h4>
                <div className="flex flex-column gap-3">
                  {modulePolicies.map((policy) => {
                    const item = catalogMap.get(policy.eventCode);
                    const hardLocked = isHardLockedByCatalog(item);
                    return (
                      <div
                        key={policy.eventCode}
                        className="border-1 surface-border border-round p-3"
                      >
                        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
                          <div>
                            <div className="font-semibold text-900">
                              {item?.title || policy.eventCode}
                            </div>
                            <small className="text-600">
                              {policy.eventCode}
                            </small>
                            {hardLocked && (
                              <div className="text-xs text-orange-700 mt-1">
                                Evento crítico/error: siempre habilitado.
                              </div>
                            )}
                          </div>

                          <div className="flex align-items-center gap-4 flex-wrap">
                            <div className="flex align-items-center gap-2">
                              <label>Habilitado</label>
                              <InputSwitch
                                checked={
                                  hardLocked ? true : Boolean(policy.enabled)
                                }
                                disabled={hardLocked}
                                onChange={(e) =>
                                  updatePolicy(policy.eventCode, {
                                    enabled: Boolean(e.value),
                                  })
                                }
                              />
                            </div>

                            <div className="flex align-items-center gap-2">
                              <label>Obligatorio</label>
                              <InputSwitch
                                checked={
                                  hardLocked ? true : Boolean(policy.mandatory)
                                }
                                disabled={hardLocked}
                                onChange={(e) =>
                                  updatePolicy(policy.eventCode, {
                                    mandatory: Boolean(e.value),
                                  })
                                }
                              />
                            </div>

                            <div className="flex align-items-center gap-2">
                              <label>Dedup (seg)</label>
                              <InputNumber
                                value={policy.dedupWindowSec}
                                onValueChange={(e) =>
                                  updatePolicy(policy.eventCode, {
                                    dedupWindowSec:
                                      typeof e.value === "number"
                                        ? e.value
                                        : 300,
                                  })
                                }
                                min={0}
                                showButtons
                                useGrouping={false}
                                inputClassName="w-6rem"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="surface-card border-round p-4">
        <div className="flex align-items-center justify-content-between mb-3">
          <div>
            <h3 className="m-0 text-900">Mis preferencias</h3>
            <small className="text-600">
              Activa o desactiva notificaciones por evento para tu membresía.
            </small>
          </div>
          <Button
            label="Guardar preferencias"
            icon="pi pi-check"
            loading={savingPreferences}
            onClick={handleSavePreferences}
          />
        </div>

        <div className="flex flex-column gap-3">
          {groupedPreferences.map(([moduleCode, modulePreferences]) => (
            <div
              key={moduleCode}
              className="border-1 surface-border border-round p-3"
            >
              <h4 className="m-0 mb-3 text-900">
                {MODULE_LABELS[moduleCode] || moduleCode}
              </h4>
              <div className="flex flex-column gap-3">
                {modulePreferences.map((preference) => {
                  const item = catalogMap.get(preference.eventCode);
                  const hardLocked = isHardLockedByCatalog(item);
                  const locked = Boolean(preference.locked) || hardLocked;
                  return (
                    <div
                      key={preference.eventCode}
                      className="border-1 surface-border border-round p-3"
                    >
                      <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
                        <div>
                          <div className="font-semibold text-900">
                            {item?.title || preference.eventCode}
                          </div>
                          <small className="text-600">
                            {preference.eventCode}
                          </small>
                          {locked && (
                            <div className="text-xs text-orange-700 mt-1">
                              Evento obligatorio (política o criticidad).
                            </div>
                          )}
                        </div>

                        <div className="flex align-items-center gap-2">
                          <label>Recibir</label>
                          <InputSwitch
                            checked={
                              locked ? true : Boolean(preference.enabled)
                            }
                            disabled={locked}
                            onChange={(e) =>
                              updatePreference(
                                preference.eventCode,
                                Boolean(e.value),
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
