import apiClient from "@/app/api/apiClient";
import { AccessType, UserStatus } from "@/app/api/userService";
// import { AccessType, UserStatus } from "@/modules/users/services/user.service";

export interface LoginRequest {
  email: string;
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
    token: string;
    user: LoginUser;
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

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post("/auth/login", data);
  return response.data;
};

export const googleSingIn = async <T = unknown>(data: T) => {
  const response = await apiClient.post("/auth/google", data);
  return response.data;
};

export const registerUser = async (
  data: RegisterRequest,
): Promise<LoginResponse> => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};
