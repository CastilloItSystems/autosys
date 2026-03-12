import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/landing", "/prices"];
const authRoutes = ["/auth/login", "/auth/register"];
const apiAuthPrefix = "/api/auth";

export async function middleware(req: NextRequest) {
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET environment variable is not defined");
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = req.nextUrl;
  const isLoggedIn = !!token;

  if (pathname.startsWith(apiAuthPrefix)) return NextResponse.next();
  if (publicRoutes.includes(pathname)) return NextResponse.next();

  if (isLoggedIn && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isLoggedIn && !authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
