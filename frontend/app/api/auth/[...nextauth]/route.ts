import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  googleSingIn,
  loginUser,
  logoutBackendSession,
  refreshBackendToken,
} from "@/modules/auth/services/auth.service";

import GoogleProvider from "next-auth/providers/google";

const REFRESH_SKEW_MS = 2 * 60 * 1000;
const backendRefreshRequests = new Map<
  string,
  ReturnType<typeof refreshBackendToken>
>();

const refreshBackendTokenOnce = (refreshToken: string) => {
  const existing = backendRefreshRequests.get(refreshToken);
  if (existing) {
    return existing;
  }

  const pending = refreshBackendToken(refreshToken).finally(() => {
    backendRefreshRequests.delete(refreshToken);
  });
  backendRefreshRequests.set(refreshToken, pending);
  return pending;
};

const stripBackendTokens = (user: any) => {
  const {
    token,
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
    ...safeUser
  } = user ?? {};

  return {
    safeUser,
    accessToken: accessToken || token,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
};

const shouldRefreshBackendAccessToken = (expiresAt: unknown) => {
  if (typeof expiresAt !== "string") return false;
  const expiresTime = Date.parse(expiresAt);
  if (!Number.isFinite(expiresTime)) return false;
  return Date.now() + REFRESH_SKEW_MS >= expiresTime;
};

const refreshTokenState = async (token: any) => {
  const refreshToken =
    typeof token.backendRefreshToken === "string"
      ? token.backendRefreshToken
      : "";

  if (!refreshToken) {
    return {
      ...token,
      backendAuthError: "MissingRefreshToken",
    };
  }

  try {
    const response = await refreshBackendTokenOnce(refreshToken);
    const data = response.data;
    const accessToken = data.accessToken || data.token;

    const nextToken = {
      ...token,
      backendToken: accessToken,
      backendAccessToken: accessToken,
      backendAccessTokenExpiresAt: data.accessTokenExpiresAt,
      backendRefreshToken: data.refreshToken,
      backendRefreshTokenExpiresAt: data.refreshTokenExpiresAt,
    };
    delete nextToken.backendAuthError;

    return nextToken;
  } catch (error) {
    console.error("Backend token refresh failed:", error);
    return {
      ...token,
      backendAuthError: "RefreshAccessTokenError",
    };
  }
};

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;
        try {
          const correo =
            (credentials as any).email ?? (credentials as any).correo;
          const password = (credentials as any).password;
          if (!correo || !password) {
            console.warn("Credentials missing email/correo or password");
            return null;
          }
          const response = await loginUser({
            correo,
            password,
          });

          // Verificamos si la respuesta fue exitosa y si contiene la propiedad data.user
          if (
            !response ||
            !response.success ||
            !response.data ||
            !response.data.user
          ) {
            throw new Error("Datos inválidos.");
          }

          // Extraemos el usuario y el token de la propiedad "data"
          const userData = {
            ...response.data.user,
            token: response.data.accessToken || response.data.token,
            accessToken: response.data.accessToken || response.data.token,
            accessTokenExpiresAt: response.data.accessTokenExpiresAt,
            refreshToken: response.data.refreshToken,
            refreshTokenExpiresAt: response.data.refreshTokenExpiresAt,
          };

          return userData as any;
        } catch (error) {
          console.error("Error de auth:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días
    updateAge: 3600,
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        const backendAuth = stripBackendTokens(user);
        token.user = backendAuth.safeUser;
        token.backendToken = backendAuth.accessToken;
        token.backendAccessToken = backendAuth.accessToken;
        token.backendAccessTokenExpiresAt = backendAuth.accessTokenExpiresAt;
        token.backendRefreshToken = backendAuth.refreshToken;
        token.backendRefreshTokenExpiresAt = backendAuth.refreshTokenExpiresAt;
        token.backendAuthError = undefined;
      }
      // Actualización desde el cliente (update())
      if (trigger === "update" && session?.updatedUsuario) {
        token.user = {
          ...(typeof token.user === "object" && token.user !== null
            ? token.user
            : {}),
          nombre: session.updatedUsuario.nombre,
          telefono: session.updatedUsuario.telefono,
          img: session.updatedUsuario.img,
        };
      }

      const forceBackendTokenRefresh =
        trigger === "update" && session?.forceBackendTokenRefresh === true;

      if (account?.provider === "google") {
        token.access_token = account.access_token; // Guarda el access_token
        try {
          // const response = await fetch(
          //   `${process.env.BACKEND_API_URL}/auth/google`,
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify({
          //       access_token: account.access_token,
          //       id_token: account.id_token,
          //     }),
          //   }
          // );
          const response = await googleSingIn({
            access_token: account.access_token,
            id_token: account.id_token,
          });
          // console.log("response", response);
          // const googleUser = await response.json();

          if (response) {
            //   token.id = googleUser._id;
            //   token.role = googleUser.role;
            //   token.email = googleUser.email;
            //   token.name = googleUser.name;
            const backendAuth = stripBackendTokens(response);
            token.user = backendAuth.safeUser;
            token.backendToken = backendAuth.accessToken;
            token.backendAccessToken = backendAuth.accessToken;
            token.backendAccessTokenExpiresAt = backendAuth.accessTokenExpiresAt;
            token.backendRefreshToken = backendAuth.refreshToken;
            token.backendRefreshTokenExpiresAt =
              backendAuth.refreshTokenExpiresAt;
            token.access_token = account.access_token;
          }
        } catch (error) {
          console.error("Google auth error:", error);
        }
      }

      if (
        !user &&
        (forceBackendTokenRefresh ||
          shouldRefreshBackendAccessToken(token.backendAccessTokenExpiresAt))
      ) {
        return refreshTokenState(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.user = (token.user || session.user) as any;

      if (token.access_token && typeof token.access_token === "string") {
        session.user.access_token = token.access_token; // Expón el access_token en la sesión
      }

      // Add backend token to session
      const backendToken =
        typeof token.backendAccessToken === "string"
          ? token.backendAccessToken
          : token.backendToken;
      if (backendToken) {
        (session.user as any).token = backendToken;
      }
      if (typeof token.backendAccessTokenExpiresAt === "string") {
        (session.user as any).backendAccessTokenExpiresAt =
          token.backendAccessTokenExpiresAt;
      }
      if (typeof token.backendRefreshTokenExpiresAt === "string") {
        (session.user as any).backendRefreshTokenExpiresAt =
          token.backendRefreshTokenExpiresAt;
      }
      if (typeof token.backendAuthError === "string") {
        (session.user as any).backendAuthError = token.backendAuthError;
      }

      return session;
    },
    // async session({ session, token }) {
    //   session.user = token.user as any;
    //   // 1) Si fue login via credentials y cambió datos en loginUser, `token.user` ya tiene el objeto actualizado.
    //   //    Si necesitas refrescarlo desde tu API, puedes hacerlo aquí:
    //   if (session.user) {
    //     // Ejemplo: fetch a tu backend para traer el usuario más reciente
    //     try {
    //       const userObj = token.user as { usuario: { id: string } };
    //       const freshUser = await getUser(userObj.usuario.id || "");
    //       if (freshUser) {
    //         session.user.usuario = freshUser;
    //         console.log("token.user", token.user);
    //       } else {
    //         // Si la ruta no existe o da error, caemos al token.user original
    //         // session.user.usuario = token.user as Usuario;
    //         session.user = token.user as any;
    //       }
    //     } catch (error) {
    //       // session.user.usuario = token.user as Usuario;
    //       session.user = token.user as any;
    //     }

    //     // 2) Exponer el access_token a la sesión
    //     if (token.access_token && typeof token.access_token === "string") {
    //       session.user.access_token = token.access_token; // Expón el access_token en la sesión
    //     }
    //   }
    //   return session;
    // },
    // async signIn({ user, account, profile }) {
    //   // Verificar si el usuario ya existe
    //   const existingUser = await prisma.user.findUnique({
    //     where: { email: user.email! },
    //   });

    //   if (account?.provider === "google") {
    //     // Crear nuevo usuario si no existe
    //     if (!existingUser) {
    //       await prisma.user.create({
    //         data: {
    //           email: user.email!,
    //           name: user.name!,
    //           role: "USER", // Rol por defecto
    //           accounts: {
    //             create: {
    //               provider: account.provider,
    //               providerAccountId: account.providerAccountId,
    //               type: account.type,
    //             },
    //           },
    //         },
    //       });
    //     } else {
    //       // Vincular cuenta Google a usuario existente
    //       await prisma.account.create({
    //         data: {
    //           userId: existingUser.id,
    //           provider: account.provider,
    //           providerAccountId: account.providerAccountId,
    //           type: account.type,
    //         },
    //       });
    //     }
    //   }
    //   return true;
    // },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? (message.token as any) : null;
      const refreshToken =
        typeof token?.backendRefreshToken === "string"
          ? token.backendRefreshToken
          : undefined;
      const accessToken =
        typeof token?.backendAccessToken === "string"
          ? token.backendAccessToken
          : typeof token?.backendToken === "string"
            ? token.backendToken
            : undefined;

      if (refreshToken || accessToken) {
        await logoutBackendSession(refreshToken, accessToken).catch((error) => {
          console.error("Backend logout failed:", error);
        });
      }
    },
  },
  secret: process.env.AUTH_SECRET,
});

export { handler as GET, handler as POST };
