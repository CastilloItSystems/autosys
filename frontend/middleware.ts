// import { withAuth } from "next-auth/middleware";
// import { getToken } from "next-auth/jwt";
// import { NextResponse } from "next/server";

// export default withAuth(
//   async function middleware(req) {
//     const { pathname } = req.nextUrl;
//     const token = await getToken({ req });

//     if (!token) {
//       // Redirige a la página de inicio de sesión si no hay sesión
//       return NextResponse.redirect(new URL("/auth/login", req.url));
//     }

//     // Ejemplo de protección de rutas por rol
//     if (pathname.startsWith("/admin") && token.role !== "admin") {
//       // Redirige a una página de acceso denegado si el usuario no es admin
//       return NextResponse.redirect(new URL("/access-denied", req.url));
//     }

//     // Permite el acceso a la ruta si se cumplen las condiciones
//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => !!token,
//     },
//   }
// );

// export const config = { matcher: ["/", "/dashboard/:path*", "/admin/:path*"] };
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

const publicRoutes = ["/landing", "/prices"];
const authRoutes = ["/auth/login", "/auth/register"];
const apiAuthPrefix = "/api/auth";

// Centraliza todas las rutas protegidas de la app
// Bloque generado automáticamente: todas las rutas protegidas encontradas en el proyecto
const protectedRoutes = [
  {
    path: "/todas-refinerias",
    roles: ["superAdmin"],
    departamento: ["Gerencia"],
  },
  {
    path: "/partidas",
    roles: ["superAdmin"],
    departamento: ["Gerencia"],
  },
  {
    path: "/users",
    roles: ["superAdmin"],
    departamento: ["Gerencia"],
  },
  {
    path: "/dashboard-sales",
    roles: ["superAdmin"],
    departamento: ["Gerencia"],
  },
  {
    path: "/refineria/configuracion",
    roles: ["superAdmin", "admin"],
    departamento: ["Operaciones", "Gerencia"],
  },
  {
    path: "/refineria/finanzas",
    roles: ["superAdmin", "admin", "operador", "user", "lectura"],
    departamento: ["Finanzas", "Gerencia"],
  },
  {
    path: "/refineria/logistica",
    roles: ["superAdmin", "admin", "operador", "user", "lectura"],
    departamento: ["Logistica", "Gerencia"],
  },
  {
    path: "/refineria/operaciones",
    roles: ["superAdmin", "admin", "operador", "user", "lectura"],
    departamento: ["Operaciones", "Gerencia"],
  },
  {
    path: "/refineria/laboratorio",
    roles: ["superAdmin", "admin", "operador", "user", "lectura"],
    departamento: ["Laboratorio", "Gerencia"],
  },
  {
    path: "/refineria/reportes-graficas",
    roles: ["superAdmin", "admin", "operador", "user", "lectura"],
    departamento: ["Operaciones", "Gerencia"],
  },
  {
    path: "/refineria/dashboard-sales",
    roles: ["superAdmin", "admin", "operador", "user", "lectura"],
    departamento: ["Administracion", "Finanzas", "Gerencia"],
  },
];

export async function middleware(req: NextRequest) {
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET environment variable is not defined");
  }

  // // Agregar registros de depuración
  // console.log("AUTH_SECRET:", process.env.AUTH_SECRET);
  // //   console.log("Request Headers:", req.headers);

  // Verificar la cookie de sesión
  const cookies = req.headers.get("cookie");
  // console.log("Cookies:", cookies);

  interface CustomToken {
    user?: {
      usuario?: {
        rol?: string;
        departamento?: string;
        acceso?: string[];
      };
    };
    [key: string]: any;
  }

  const token = (await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })) as CustomToken;
  // // Más registros de depuración
  // console.log("Token:", token);
  // console.log("Request:", req);

  const { nextUrl } = req;
  const isLoggedIn = !!token;

  // console.log({ isLoggedIn, path: nextUrl.pathname });

  // Permitir todas las rutas de API de autenticación
  if (nextUrl.pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // Permitir acceso a rutas públicas sin importar el estado de autenticación
  if (publicRoutes.includes(nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Redirigir a /dashboard si el usuario está logueado y trata de acceder a rutas de autenticación
  if (isLoggedIn && authRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Redirigir a /login si el usuario no está logueado y trata de acceder a una ruta protegida
  if (
    !isLoggedIn &&
    !authRoutes.includes(nextUrl.pathname) &&
    !publicRoutes.includes(nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  // Verificar roles, departamento y acceso para rutas protegidas
  const route = protectedRoutes.find((route) =>
    nextUrl.pathname.startsWith(route.path)
  );
  const user = token?.user?.usuario;
  if (route) {
    // Validación de rol
    const userRole = user?.rol as string;
    const isSuperAdmin = userRole === "superAdmin";
    const hasRole = route.roles.includes(userRole);

    // Si es superAdmin, acceso total
    if (isSuperAdmin) {
      return NextResponse.next();
    }

    // Validación de acceso (si existe en el token y la ruta)
    let hasAccess = true;
    if (user?.acceso && Array.isArray(user.acceso)) {
      hasAccess = user.acceso.length > 0;
    }

    // Validación de departamento para todas las rutas protegidas (excepto superAdmin)
    let hasDepartment = true;
    if (user?.departamento && route.departamento) {
      const userDept = Array.isArray(user.departamento)
        ? user.departamento
        : [user.departamento];
      const routeDept = Array.isArray(route.departamento)
        ? route.departamento
        : [route.departamento];
      hasDepartment = userDept.some((ud) => routeDept.includes(ud));
    }

    if (!hasRole || !hasAccess || !hasDepartment) {
      return NextResponse.redirect(new URL("/auth/access", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
