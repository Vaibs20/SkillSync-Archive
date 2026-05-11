import { connect } from "@/dbConfig/dbConfig";
import { AuthError, getCurrentUserId } from "@/lib/apiAuth";
import { getConnectionPairKey, serializeConnection } from "@/lib/connections";
import { SAFE_USER_FIELDS, serializeSafeUser } from "@/lib/users";
import Connection from "@/models/Connection";
import User from "@/models/User";
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

export async function GET(req: NextRequest) {
    try {
        const currentUserId = getCurrentUserId(req);
        await connect();

        const box = req.nextUrl.searchParams.get("box") === "outgoing" ? "outgoing" : "incoming";
        const query =
            box === "outgoing"
                ? { requester: currentUserId, status: { $ne: "accepted" } }
                : { recipient: currentUserId, status: { $ne: "accepted" } };

        const requests = await Connection.find(query)
            .sort({ updatedAt: -1 })
            .populate("requester", SAFE_USER_FIELDS)
            .populate("recipient", SAFE_USER_FIELDS)
            .lean();

        return NextResponse.json({
            requests: requests.map((connection: any) => serializePopulatedConnection(connection, currentUserId)),
        });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || "Failed to load requests" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const currentUserId = getCurrentUserId(req);
        const { recipientId } = await req.json();

        if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
            return NextResponse.json({ error: "Valid recipientId is required" }, { status: 400 });
        }

        if (recipientId.toString() === currentUserId) {
            return NextResponse.json({ error: "You cannot connect with yourself" }, { status: 400 });
        }

        await connect();

        const recipient = await User.findById(recipientId).select("_id").lean();
        if (!recipient) {
            return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
        }

        const pairKey = getConnectionPairKey(currentUserId, recipientId);
        const existingConnection = await Connection.findOne({ pairKey });

        if (existingConnection?.status === "accepted") {
            return NextResponse.json({ error: "You are already connected with this user" }, { status: 409 });
        }

        if (existingConnection?.status === "pending") {
            const isRequester = existingConnection.requester.toString() === currentUserId;
            return NextResponse.json(
                {
                    error: isRequester
                        ? "Connection request already pending"
                        : "This user already sent you a connection request",
                },
                { status: 409 }
            );
        }

        const connection = existingConnection
            ? await Connection.findByIdAndUpdate(
                  existingConnection._id,
                  {
                      requester: currentUserId,
                      recipient: recipientId,
                      status: "pending",
                      requestedAt: new Date(),
                      respondedAt: null,
                  },
                  { new: true }
              )
            : await Connection.create({
                  requester: currentUserId,
                  recipient: recipientId,
                  pairKey,
                  status: "pending",
                  requestedAt: new Date(),
                  respondedAt: null,
              });

        const populatedConnection = await Connection.findById(connection._id)
            .populate("requester", SAFE_USER_FIELDS)
            .populate("recipient", SAFE_USER_FIELDS)
            .lean();

        return NextResponse.json(
            { request: serializePopulatedConnection(populatedConnection, currentUserId) },
            { status: existingConnection ? 200 : 201 }
        );
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error?.code === 11000) {
            return NextResponse.json({ error: "Connection request already exists" }, { status: 409 });
        }

        return NextResponse.json({ error: error.message || "Failed to send request" }, { status: 500 });
    }
}
