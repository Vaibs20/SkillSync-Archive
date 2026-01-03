// src/app/api/users/connect/request/route.ts
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

connect();

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
        const { targetUserId } = await req.json();

        if (!targetUserId) {
            return NextResponse.json({ error: "Target user is required" }, { status: 400 });
        }

        if (decoded.id === targetUserId) {
            return NextResponse.json({ error: "You cannot connect with yourself" }, { status: 400 });
        }

        const [currentUser, targetUser] = await Promise.all([
            User.findById(decoded.id),
            User.findById(targetUserId),
        ]);

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const alreadyConnected = currentUser.contacts?.some((id: string) => id.toString() === targetUserId);
        if (alreadyConnected) {
            return NextResponse.json({ message: "Already connected", success: true });
        }

        const existingRequest = targetUser.connectionRequests?.some(
            (req: { from: string }) => req.from?.toString() === decoded.id
        );
        if (existingRequest) {
            return NextResponse.json({ message: "Request already sent", success: true });
        }

        targetUser.connectionRequests.push({ from: decoded.id, createdAt: new Date() });
        targetUser.notifications?.push({
            from: decoded.id,
            message: `${currentUser.name} requested to connect with you`,
            type: "connection_request",
            createdAt: new Date(),
            read: false,
        });

        await targetUser.save();

        return NextResponse.json({ success: true, message: "Connection request sent" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
