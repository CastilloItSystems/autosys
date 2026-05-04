"use client";

import { useCallback } from "react";
import useSWR from "swr";

import {
  getAuditLogsForUser,
  getMembershipCompanyRoles,
  getMembershipEmpresas,
  getMembershipPermissions,
  getMembershipsByEmpresa,
  getMembershipsByUser,
  getUser,
  getUsers,
} from "../services/user.service";
import type {
  AuditLogsResponse,
  MembershipCompanyRole,
  MembershipEmpresasResponse,
  MembershipPermissionsResponse,
  MembershipsResponse,
  User,
  UsersResponse,
} from "../interfaces/user.interface";

export const useUsersData = () => {
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    "users-list",
    getUsers,
    { revalidateOnFocus: false },
  );

  const users = data?.users ?? [];

  return {
    users,
    usuarios: users,
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useUserData = (userId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<User>(
    userId ? ["user-detail", userId] : null,
    () => getUser(userId as string),
    { revalidateOnFocus: false },
  );

  return {
    user: data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useUserAuditLogsData = (userId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<AuditLogsResponse>(
    userId ? ["user-audit-logs", userId] : null,
    () => getAuditLogsForUser(userId as string),
    { revalidateOnFocus: false },
  );

  return {
    auditLogs: data?.auditLogs ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useEmpresaMembershipsData = () => {
  const { data, error, isLoading, mutate } = useSWR<MembershipsResponse>(
    "empresa-memberships",
    getMembershipsByEmpresa,
    { revalidateOnFocus: false },
  );

  return {
    memberships: data?.memberships ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useUserMembershipsData = (userId?: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<MembershipsResponse>(
    userId ? ["user-memberships", userId] : null,
    () => getMembershipsByUser(userId as string),
    { revalidateOnFocus: false },
  );

  return {
    memberships: data?.memberships ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useMembershipPermissionsData = (
  membershipId?: string | null,
) => {
  const { data, error, isLoading, mutate } =
    useSWR<MembershipPermissionsResponse>(
      membershipId ? ["membership-permissions", membershipId] : null,
      () => getMembershipPermissions(membershipId as string),
      { revalidateOnFocus: false },
    );

  return {
    permissionsData: data ?? null,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useMembershipEmpresasData = () => {
  const { data, error, isLoading, mutate } =
    useSWR<MembershipEmpresasResponse>(
      "membership-empresas",
      getMembershipEmpresas,
      { revalidateOnFocus: false },
    );

  return {
    empresas: data?.empresas ?? [],
    empresaOptions:
      data?.empresas.map((empresa) => ({
        label: empresa.nombre,
        value: empresa.id_empresa,
      })) ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};

export const useMembershipCompanyRolesData = (
  empresaId?: string | null,
) => {
  const { data, error, isLoading, mutate } = useSWR<MembershipCompanyRole[]>(
    empresaId ? ["membership-company-roles", empresaId] : null,
    () => getMembershipCompanyRoles(empresaId as string),
    { revalidateOnFocus: false },
  );

  return {
    roles: data ?? [],
    roleOptions:
      data?.map((role) => ({
        label: role.name,
        value: role.id,
      })) ?? [],
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
