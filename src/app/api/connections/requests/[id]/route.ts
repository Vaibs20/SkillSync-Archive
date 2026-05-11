import { connect } from "@/dbConfig/dbConfig";
import { AuthError, getCurrentUserId } from "@/lib/apiAuth";
import { serializeConnection } from "@/lib/connections";
import { SAFE_USER_FIELDS, serializeSafeUser } from "@/lib/users";
import Connection from "@/models/Connection";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

function serializePopulatedConnection(connection: any, currentUserId: string) {
    return serializeConnection(
        {
            ...connection,
            requester: serializeSafeUser(connection.requester),
            recipient: serializeSafeUser(connection.recipient),
        },
        currentUserId
    );
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const currentUserId = getCurrentUserId(req);
        const { id } = await context.params;
        const { action } = await req.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
        }

        if (!["accept", "decline", "cancel"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await connect();

        const now = new Date();
        const filter =
            action === "cancel"
                ? { _id: id, requester: currentUserId, status: "pending" }
                : { _id: id, recipient: currentUserId, status: "pending" };
        const update =
            action === "accept"
                ? { status: "accepted", respondedAt: now }
                : action === "decline"
                  ? { status: "declined", respondedAt: now }
                  : { status: "cancelled", respondedAt: now };

        const connection = await Connection.findOneAndUpdate(filter, update, { new: true })
            .populate("requester", SAFE_USER_FIELDS)
            .populate("recipient", SAFE_USER_FIELDS)
            .lean();

        if (!connection) {
            return NextResponse.json({ error: "Request not found or no longer pending" }, { status: 404 });
        }

        return NextResponse.json({
            request: serializePopulatedConnection(connection, currentUserId),
        });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || "Failed to update request" }, { status: 500 });
    }
}
