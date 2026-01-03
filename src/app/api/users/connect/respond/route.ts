// src/app/api/users/connect/respond/route.ts
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
        const { requesterId, action } = await req.json();

        if (!requesterId || !["accept", "decline"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const [currentUser, requester] = await Promise.all([
            User.findById(decoded.id),
            User.findById(requesterId),
        ]);

        if (!currentUser || !requester) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const pendingRequest = currentUser.connectionRequests?.some(
            (req: { from: string }) => req.from?.toString() === requesterId
        );

        if (!pendingRequest) {
            return NextResponse.json({ error: "No pending request from this user" }, { status: 400 });
        }

        currentUser.connectionRequests = currentUser.connectionRequests.filter(
            (req: { from: string }) => req.from?.toString() !== requesterId
        );

        if (action === "accept") {
            const alreadyContact = currentUser.contacts?.some(
                (id: { toString(): string }) => id.toString() === requesterId
            );
            const requesterHasContact = requester.contacts?.some(
                (id: { toString(): string }) => id.toString() === decoded.id
            );

            if (!alreadyContact) {
                currentUser.contacts.push(requesterId);
            }
            if (!requesterHasContact) {
                requester.contacts.push(decoded.id);
            }

            requester.notifications?.push({
                from: decoded.id,
                message: `${currentUser.name} accepted your connection request`,
                type: "connection_accept",
                createdAt: new Date(),
                read: false,
            });

            await Promise.all([currentUser.save(), requester.save()]);
            return NextResponse.json({ success: true, message: "Connection established" });
        }

        await currentUser.save();
        return NextResponse.json({ success: true, message: "Connection request declined" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
