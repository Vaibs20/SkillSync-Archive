//src/app/api/users/[id]/route.ts
import { connect } from "@/dbConfig/dbConfig";
import { AuthError, getCurrentUserId } from "@/lib/apiAuth";
import { SAFE_USER_FIELDS, serializeSafeUser } from "@/lib/users";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

connect();

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        getCurrentUserId(req);
        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
        }

        const user = await User.findById(id).select(SAFE_USER_FIELDS).lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json(serializeSafeUser(user));
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const currentUserId = getCurrentUserId(req);
        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
        }

        if (currentUserId !== id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const allowedUpdates: Record<string, any> = {};

        if (typeof data.name === "string") allowedUpdates.name = data.name.trim();
        if (typeof data.learning_goal === "string") allowedUpdates.learning_goal = data.learning_goal.trim();
        if (typeof data.branch === "string") allowedUpdates.branch = data.branch.trim();
        if (typeof data.availability === "string") allowedUpdates.availability = data.availability.trim();
        if (typeof data.experience === "boolean") allowedUpdates.experience = data.experience;
        if (typeof data.passing_year === "number") allowedUpdates.passing_year = data.passing_year;
        if (Array.isArray(data.known_skills)) {
            allowedUpdates.known_skills = data.known_skills
                .filter((skill: unknown) => typeof skill === "string")
                .map((skill: string) => skill.trim())
                .filter(Boolean);
        }
        if (Array.isArray(data.career_path)) {
            allowedUpdates.career_path = data.career_path
                .filter((path: unknown) => typeof path === "string")
                .map((path: string) => path.trim())
                .filter(Boolean);
        }

        const updatedUser = await User.findByIdAndUpdate(id, { $set: allowedUpdates }, { new: true, runValidators: true })
            .select(SAFE_USER_FIELDS)
            .lean();

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Profile updated", success: true, user: serializeSafeUser(updatedUser) });
    } catch (error: any) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
