import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUser, googleSingIn, loginUser } from "../../userService";
import { Usuario } from "@/libs/interfaces";
import GoogleProvider from "next-auth/providers/google";
declare module "next-auth" {
  interface Session {
    user: {
      usuario?: Usuario;
      token?: string;
      access_token?: string; // Agregado para manejar el token de Google
    } & DefaultSession["user"];
  }
}
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
        try {
          // console.log("credentials", credentials);
          let user = null;

          user = await loginUser(credentials);
          // console.log(user);

          if (!user) {
            // No user found, so this is their first attempt to login
            // Optionally, this is also the place you could do a user registration
            throw new Error("Datos invalidos.");
          }
          return user;
        } catch (error) {
          // console.log("errordeauth", error.response.data);
          return null;
        }
        // return user object with their profile data
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
      if (user) token.user = user;
      // Actualización desde el cliente (update())
      if (trigger === "update" && session?.updatedUsuario) {
        token.user = {
          ...(typeof token.user === "object" && token.user !== null
            ? token.user
            : {}),
          usuario: {
            ...(typeof token.user === "object" &&
            token.user !== null &&
            "usuario" in token.user &&
            typeof (token.user as any).usuario === "object"
              ? (token.user as any).usuario
              : {}),
            nombre: session.updatedUsuario.nombre,
            telefono: session.updatedUsuario.telefono,
          },
        };
        // token.user = {
        //   ...token.user,
        //   usuario: {
        //     ...(token.user && (token.user as any).usuario
        //       ? (token.user as any).usuario
        //       : {}),
        //     nombre: (token.user && (token.user as any).usuario?.nombre) || "", // Usa los nuevos valores
        //     telefono:
        //       (token.user && (token.user as any).usuario?.telefono) || "",
        //   },
        // };
      }
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
            token.user = response;
            token.access_token = account.access_token;
          }
          // console.log(token);
        } catch (error) {
          console.error("Google auth error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;

      if (token.access_token && typeof token.access_token === "string") {
        session.user.access_token = token.access_token; // Expón el access_token en la sesión
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
  secret: process.env.AUTH_SECRET,
});

export { handler as GET, handler as POST };
