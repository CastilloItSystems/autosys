import type { MenuModel } from "@/types";
import {
  getPermissionGateForPath,
  type PermissionAction,
  type PermissionGate,
} from "@/lib/permissionGates";

type PermissionMenuModel = MenuModel & {
  items?: PermissionMenuModel[];
  scope?: PermissionGate["scope"];
};

export type PermissionGateEvaluator = (
  gate?: PermissionGate | null,
) => boolean;

export const getMenuItemPermissionGate = (
  item: PermissionMenuModel,
  action: PermissionAction = "view",
): PermissionGate | null => {
  const hasExplicitGate = Boolean(
    item.permission || item.permissionsAny || item.permissionsAll,
  );

  if (hasExplicitGate) {
    return {
      permission: item.permission,
      permissionsAny: item.permissionsAny,
      permissionsAll: item.permissionsAll,
      scope: item.scope,
    };
  }

  return getPermissionGateForPath(item.to, action);
};

export const filterMenuByPermissions = (
  model: PermissionMenuModel[],
  canAccessGate: PermissionGateEvaluator,
): PermissionMenuModel[] =>
  model.reduce<PermissionMenuModel[]>((items, item) => {
    const filteredChildren = item.items
      ? filterMenuByPermissions(item.items, canAccessGate)
      : undefined;
    const gate = getMenuItemPermissionGate(item);
    const canSeeItem = canAccessGate(gate);

    if (!canSeeItem) return items;
    if (item.items && filteredChildren?.length === 0) return items;

    items.push({
      ...item,
      ...(filteredChildren ? { items: filteredChildren } : {}),
    });

    return items;
  }, []);
