import mongoose, { Schema } from "mongoose";

export type ConnectionStatus = "pending" | "accepted" | "declined" | "cancelled";

const connectionSchema = new Schema(
    {
        requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        pairKey: { type: String, required: true, unique: true, index: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined", "cancelled"],
            default: "pending",
            index: true,
        },
        requestedAt: { type: Date, default: Date.now },
        respondedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

connectionSchema.index({ requester: 1, recipient: 1 });
connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });

const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema);

export default Connection;
