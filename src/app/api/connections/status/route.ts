import { connect } from "@/dbConfig/dbConfig";
import { AuthError, getCurrentUserId } from "@/lib/apiAuth";
import { getConnectionPairKey, RelationshipStatus } from "@/lib/connections";
import Connection from "@/models/Connection";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const currentUserId = getCurrentUserId(req);
        const peerIdsParam = req.nextUrl.searchParams.get("peerIds") || "";
        const peerIds = Array.from(
            new Set(
                peerIdsParam
                    .split(",")
                    .map((id) => id.trim())
                    .filter((id) => id && id !== currentUserId && mongoose.Types.ObjectId.isValid(id))
            )
        ).slice(0, 50);

        const statuses: Record<string, RelationshipStatus> = {};
        const requestIds: Record<string, string> = {};
        peerIds.forEach((peerId) => {
            statuses[peerId] = "none";
        });

        if (peerIds.length === 0) {
            return NextResponse.json({ statuses, requestIds });
        }

        await connect();

        const pairKeys = peerIds.map((peerId) => getConnectionPairKey(currentUserId, peerId));
        const connections = await Connection.find({ pairKey: { $in: pairKeys } }).lean();

        connections.forEach((connection: any) => {
            const requesterId = connection.requester.toString();
            const recipientId = connection.recipient.toString();
            const peerId = requesterId === currentUserId ? recipientId : requesterId;

            if (!statuses[peerId]) {
                return;
            }

            requestIds[peerId] = connection._id.toString();

            if (connection.status === "accepted") {
                statuses[peerId] = "connected";
            } else if (connection.status === "pending") {
                statuses[peerId] = requesterId === currentUserId ? "pending_sent" : "pending_received";
            } else {
                statuses[peerId] = connection.status;
            }
        });

        return NextResponse.json({ statuses, requestIds });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || "Failed to load connection status" }, { status: 500 });
    }
}
