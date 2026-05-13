"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { mutate as mutateSWR } from "swr";
import { setCachedBackendAuthSession } from "@/lib/backendAuthSession";
import {
  EMPRESAS_SWR_KEY,
  MY_EMPRESAS_SWR_KEY,
} from "@/modules/companies/hooks/useEmpresasData";

const STRING_KEYS_TO_REVALIDATE = new Set([
  EMPRESAS_SWR_KEY,
  MY_EMPRESAS_SWR_KEY,
  "empresa-memberships",
  "membership-empresas",
  "users-list",
]);

const ARRAY_KEY_PREFIXES_TO_REVALIDATE = new Set([
  "company-users-list",
  "membership-company-roles",
  "membership-permissions",
  "user-memberships",
]);

const shouldRevalidateAuthContextKey = (key: unknown) => {
  if (typeof key === "string") {
    return STRING_KEYS_TO_REVALIDATE.has(key);
  }

  if (!Array.isArray(key)) return false;
  const [prefix] = key;
  return (
    typeof prefix === "string" && ARRAY_KEY_PREFIXES_TO_REVALIDATE.has(prefix)
  );
};

export function useRefreshAuthContext() {
  const { update } = useSession();

  return useCallback(async () => {
    const session = await update({ forcePermissionsRefresh: true });
    setCachedBackendAuthSession(session);
    await mutateSWR(shouldRevalidateAuthContextKey);
    return session;
  }, [update]);
}
