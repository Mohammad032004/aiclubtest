import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Student from "../../../../../models/Student.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";
import { hashPassword, generateTempPassword } from "../../../../../lib/password.js";

// POST /api/students/:id/reset-password
export const POST = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const { password, generatePassword } = await request.json();

  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, "Student not found");

  const plainPassword = generatePassword ? generateTempPassword() : password;
  if (!plainPassword || plainPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters, or use Generate Password");
  }

  student.passwordHash = await hashPassword(plainPassword);
  student.mustResetPassword = !!generatePassword;
  await student.save();

  return NextResponse.json({ message: "Password reset successfully", temporaryPassword: plainPassword });
});
