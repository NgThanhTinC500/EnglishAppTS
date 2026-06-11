import { CookieOptions } from "express";

export function getAllowedOrigins() {
    return (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

export function getCorsOrigin() {
    const origins = getAllowedOrigins();
    return origins.length === 1 ? origins[0] : origins;
}

export function getJwtCookieOptions(expires?: Date): CookieOptions {
    const crossSiteCookie = process.env.COOKIE_SAME_SITE === "none";

    return {
        ...(expires ? { expires } : {}),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || crossSiteCookie,
        sameSite: crossSiteCookie ? "none" : "lax",
    };
}
