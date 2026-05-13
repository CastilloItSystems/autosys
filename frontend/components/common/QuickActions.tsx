"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  getPermissionGateForPath,
  type PermissionGate,
} from "@/lib/permissionGates";

export interface QuickAction extends PermissionGate {
  label: string;
  icon: string;
  to: string;
  color: string;
  description: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  icon?: string;
  showTitle?: boolean;
}

export default function QuickActions({
  actions,
  title = "Accesos Rápidos",
  icon = "pi pi-bolt",
  showTitle = true,
}: QuickActionsProps) {
  const router = useRouter();
  const { canAccessGate } = useUserPermissions();
  const visibleActions = useMemo(
    () =>
      actions.filter((action) => {
        const hasExplicitGate = Boolean(
          action.permission || action.permissionsAny || action.permissionsAll,
        );
        const gate = hasExplicitGate
          ? {
              permission: action.permission,
              permissionsAny: action.permissionsAny,
              permissionsAll: action.permissionsAll,
              scope: action.scope,
            }
          : getPermissionGateForPath(action.to);

        return canAccessGate(gate);
      }),
    [actions, canAccessGate],
  );

  if (visibleActions.length === 0) return null;

  return (
    <div className="mb-0">
      {showTitle ? (
        <h5 className="mb-3">
          <i className={`${icon} mr-2 text-primary`} />
          {title}
        </h5>
      ) : null}
      <div className="grid">
        {visibleActions.map((action) => (
          <div key={action.to} className="col-6 md:col-3 lg:col-3 xl:col-2">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                className="card w-full p-3 flex flex-column align-items-center gap-2"
                severity="secondary"
                text
                onClick={() => router.push(action.to)}
                style={{
                  borderRadius: "12px",
                  border: "1px solid var(--surface-border)",
                  minHeight: "100px",
                }}
              >
                <div
                  className="flex align-items-center justify-content-center border-round-xl"
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    backgroundColor: `var(--${action.color}-100)`,
                  }}
                >
                  <i className={`${action.icon} text-${action.color}-500 text-xl`} />
                </div>
                <span className="font-semibold text-900 text-sm">{action.label}</span>
                <span className="text-500 text-xs">{action.description}</span>
              </Button>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
