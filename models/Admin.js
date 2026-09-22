import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "admin"], default: "admin" },
  },
  { timestamps: true }
);

// Guard against "Cannot overwrite model once compiled" during Next.js hot
// reload (dev) and warm serverless invocations (prod).
export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);
