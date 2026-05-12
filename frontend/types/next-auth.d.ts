import type { DefaultSession } from "next-auth";
import type { User as AppUser } from "@/modules/users/interfaces/user.interface";

export type BackendAuthError =
  | "MissingRefreshToken"
  | "RefreshAccessTokenError";

declare module "next-auth" {
  interface Session {
    user: AppUser &
      DefaultSession["user"] & {
        token?: string;
        access_token?: string;
        backendAccessTokenExpiresAt?: string;
        backendRefreshTokenExpiresAt?: string;
        backendAuthError?: BackendAuthError;
      };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: unknown;
    backendToken?: string;
    backendAccessToken?: string;
    backendAccessTokenExpiresAt?: string;
    backendRefreshToken?: string;
    backendRefreshTokenExpiresAt?: string;
    backendAuthError?: BackendAuthError;
    access_token?: string;
  }
}
