// src / models / User.ts
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    branch: { type: String, required: false },
    passing_year: { type: Number, required: false },
    known_skills: { type: [String], default: [] },
    career_path: { type: [String], default: [] },
    experience: { type: Boolean, default: false },
    learning_goal: { type: String, default: "" },
    availability: { type: String, default: "" },
    isOnboarded: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    contacts: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    connectionRequests: {
        type: [{
            from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now },
        }],
        default: [],
    },
    notifications: {
        type: [{
            message: { type: String },
            type: { type: String },
            from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now },
            read: { type: Boolean, default: false },
        }],
        default: [],
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
});

// // Create a separate method instead of overriding findOne
// userSchema.statics.findUser = async function (conditions, projection = {}, options = {}) {
//     return this.findOne(conditions, projection, options).lean();
// };

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
