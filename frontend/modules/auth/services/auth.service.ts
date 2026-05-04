import axios from "axios";
import {
  AccessType,
  UserStatus,
} from "@/modules/users/interfaces/user.interface";
// import { AccessType, UserStatus } from "@/modules/users/services/user.service";

export interface LoginRequest {
  email?: string;
  correo?: string;
  password: string;
}

export interface LoginEmpresa {
  membershipId: string;
  empresaId: string;
  name: string;
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
  permissions: string[];
}

export interface LoginUser {
  id: string;
  img?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  departments: string[];
  access: AccessType;
  status: UserStatus;
  deleted: boolean;
  online: boolean;
  fcmTokens: string[];
  google: boolean;
  createdAt: string;
  updatedAt: string;
  empresas: LoginEmpresa[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    token: string;
    user: LoginUser;
  };
  timestamp: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    token: string;
  };
  timestamp: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  departments: string[] | string;
  access?: AccessType;
}

const authApiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api-autosys.castilloitsystems.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await authApiClient.post("/auth/login", data);
  return response.data;
};

export const googleSingIn = async <T = unknown>(data: T) => {
  const response = await authApiClient.post("/auth/google", data);
  return response.data;
};

export const registerUser = async (
  data: RegisterRequest,
): Promise<LoginResponse> => {
  const response = await authApiClient.post("/auth/register", data);
  return response.data;
};

export const refreshBackendToken = async (
  refreshToken: string,
): Promise<RefreshResponse> => {
  const response = await authApiClient.post("/auth/refresh", { refreshToken });
  return response.data;
};

export const logoutBackendSession = async (
  refreshToken?: string,
  accessToken?: string,
) => {
  await authApiClient.post(
    "/auth/logout",
    refreshToken ? { refreshToken } : {},
    accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  );
};
