import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/api/")) {
    if (!session?.user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
    return NextResponse.next();
  }

  const roleForPath = pathname.startsWith("/student")
    ? "STUDENT"
    : pathname.startsWith("/lecturer")
    ? "LECTURER"
    : pathname.startsWith("/management")
    ? "MANAGEMENT"
    : null;

  if (roleForPath) {
    if (!session?.user) {
      const url = new URL("/sign-in", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (session.user.role !== roleForPath) {
      const home =
        session.user.role === "STUDENT"
          ? "/student"
          : session.user.role === "LECTURER"
          ? "/lecturer"
          : "/management";
      return NextResponse.redirect(new URL(home, req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/student/:path*",
    "/lecturer/:path*",
    "/management/:path*",
    "/api/notifications/:path*",
    "/api/uploads/:path*",
  ],
};
