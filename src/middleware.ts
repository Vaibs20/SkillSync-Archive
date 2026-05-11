//src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const pathname = req.nextUrl.pathname;

    // Allow public routes without a token
    const publicRoutes = ["/login", "/signup"];
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Redirect to /login if no token for protected routes
    const protectedRoutes = ["/dashboard", "/onboarding", "/profile", "/search", "/contacts"];
    if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // If token exists, verify it via API
    if (token) {
        try {
            const verifyResponse = await fetch(`${req.nextUrl.origin}/api/auth/verify`, {
                method: "GET",
                headers: { Cookie: `token=${token}` },
            });
            const verifyData = await verifyResponse.json();

            // Redirect to /login if token is invalid or user not found
            if (!verifyResponse.ok || !verifyData.success) {
                return NextResponse.redirect(new URL("/login", req.url));
            }

            const { isOnboarded } = verifyData.user;

            // Redirect to /onboarding if not onboarded (except on /onboarding)
            if (!isOnboarded && pathname !== "/onboarding") {
                return NextResponse.redirect(new URL("/onboarding", req.url));
            }

            // Redirect to /dashboard if onboarded and trying to access /onboarding
            if (isOnboarded && pathname === "/onboarding") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }

            // Allow access to the requested route
            return NextResponse.next();
        } catch (error) {
            console.error("Middleware error:", error);
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    // Allow non-protected routes (e.g., /api routes, static assets)
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
