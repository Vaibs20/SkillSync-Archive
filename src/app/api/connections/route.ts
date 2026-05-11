import { connect } from "@/dbConfig/dbConfig";
import { AuthError, getCurrentUserId } from "@/lib/apiAuth";
import { SAFE_USER_FIELDS, serializeSafeUser } from "@/lib/users";
import Connection from "@/models/Connection";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const currentUserId = getCurrentUserId(req);
        await connect();

        const connections = await Connection.find({
            status: "accepted",
            $or: [{ requester: currentUserId }, { recipient: currentUserId }],
        })
            .sort({ respondedAt: -1, updatedAt: -1 })
            .populate("requester", SAFE_USER_FIELDS)
            .populate("recipient", SAFE_USER_FIELDS)
            .lean();

        const network = connections.map((connection: any) => {
            const requester = serializeSafeUser(connection.requester);
            const recipient = serializeSafeUser(connection.recipient);
            const peer = requester?._id === currentUserId ? recipient : requester;

            return {
                connectionId: connection._id?.toString(),
                peer,
                connectedAt: connection.respondedAt || connection.updatedAt,
                chatAvailable: false,
            };
        });

        return NextResponse.json({ connections: network });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || "Failed to load connections" }, { status: 500 });
    }
}
