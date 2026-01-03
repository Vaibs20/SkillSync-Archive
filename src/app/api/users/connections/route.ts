// src/app/api/users/connections/route.ts
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

connect();

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
        const user = await User.findById(decoded.id)
            .populate("contacts", "name email branch known_skills")
            .populate("connectionRequests.from", "name email");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const contacts = (user.contacts || []).map((contact: {
            _id?: string;
            name?: string;
            email?: string;
            branch?: string;
            known_skills?: string[];
        }) => ({
            id: contact._id?.toString(),
            name: contact.name,
            email: contact.email,
            branch: contact.branch,
            known_skills: contact.known_skills,
        }));

        const requests = (user.connectionRequests || []).map((req: {
            from?: { _id?: string; name?: string; email?: string };
            createdAt?: Date;
        }) => ({
            id: req.from?._id?.toString(),
            name: req.from?.name,
            email: req.from?.email,
            requestedAt: req.createdAt,
        }));

        const notifications = (user.notifications || []).map((note: {
            _id?: string;
            message?: string;
            type?: string;
            from?: { toString(): string } | string;
            createdAt?: Date;
            read?: boolean;
        }) => ({
            id: note._id?.toString(),
            message: note.message,
            type: note.type,
            from: note.from?.toString(),
            createdAt: note.createdAt,
            read: note.read,
        }));

        return NextResponse.json({ contacts, requests, notifications });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
