import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Admin from "../../../../models/Admin.js";
import Student from "../../../../models/Student.js";
import { getAuth } from "../../../../lib/apiAuth.js";
import { hashPassword, comparePassword } from "../../../../lib/password.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { ApiError } from "../../../../lib/apiError.js";

export const POST = withRoute(async (request) => {
  await connectDB();
  const auth = getAuth(request);
  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) throw new ApiError(400, "Both current and new password are required");
  if (newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters");

  const Model = auth.role === "admin" ? Admin : Student;
  const doc = await Model.findById(auth.id);
  if (!doc) throw new ApiError(401, "Account not found");

  const ok = await comparePassword(currentPassword, doc.passwordHash);
  if (!ok) throw new ApiError(401, "Current password is incorrect");

  doc.passwordHash = await hashPassword(newPassword);
  if (doc.mustResetPassword !== undefined) doc.mustResetPassword = false;
  await doc.save();
  return NextResponse.json({ message: "Password updated successfully" });
});
