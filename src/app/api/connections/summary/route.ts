import { connect } from "@/dbConfig/dbConfig";
import { AuthError, getCurrentUserId } from "@/lib/apiAuth";
import Connection from "@/models/Connection";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const currentUserId = getCurrentUserId(req);
        await connect();

        const incomingPendingCount = await Connection.countDocuments({
            recipient: currentUserId,
            status: "pending",
        });

        return NextResponse.json({ incomingPendingCount });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || "Failed to load connection summary" }, { status: 500 });
    }
}
