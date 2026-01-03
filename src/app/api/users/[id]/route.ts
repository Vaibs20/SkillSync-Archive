//src/app/api/users/[id]/route.ts
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

connect();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await User.findById(params.id)
            .select("-password -verifyToken -verifyTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry")
            .lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
        if (decoded.id !== params.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const updatedUser = await User.findByIdAndUpdate(params.id, data, { new: true });

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Profile updated", success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
