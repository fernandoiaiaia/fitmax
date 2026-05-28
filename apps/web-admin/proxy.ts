import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy — protects all routes under /painel.
 * Exportado como "proxy" conforme Next.js 16+.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasRefreshCookie = req.cookies.has("fitmax_admin_refresh");

  // Protege todas as rotas /painel
  if (pathname.startsWith("/painel") && !hasRefreshCookie) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Já logado → redireciona para fora do login
  if (pathname === "/" && hasRefreshCookie) {
    return NextResponse.redirect(new URL("/painel", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|ttf|otf|map)).*)",
  ],
};
