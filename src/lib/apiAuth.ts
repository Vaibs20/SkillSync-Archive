import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export class AuthError extends Error {
    constructor(message = "Unauthorized") {
        super(message);
        this.name = "AuthError";
    }
}

export function getCurrentUserId(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
        throw new AuthError();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id?: string };
        if (!decoded.id) {
            throw new AuthError();
        }

        return decoded.id.toString();
    } catch {
        throw new AuthError();
    }
}
