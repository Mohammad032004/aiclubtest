import { NextResponse } from "next/server";

import connectDB from "../../../../../lib/db.js";
import Student from "../../../../../models/Student.js";

import { comparePassword } from "../../../../../lib/password.js";
import { signToken } from "../../../../../lib/token.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";

export const POST = withRoute(async (request) => {
  await connectDB();

  const { identifier, email, password } = await request.json();

  // Accept the existing frontend field "identifier"
  // but use it only as an email address.
  const studentEmail = (email || identifier || "").toLowerCase().trim();

  if (!studentEmail || !password) {
    throw new ApiError(
      400,
      "Email and password are required"
    );
  }

  const student = await Student.findOne({
    email: studentEmail,
  });

  if (!student) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (student.status !== "Active") {
    throw new ApiError(
      403,
      "Your account has been disabled. Please contact the administrator."
    );
  }

  const passwordCorrect = await comparePassword(
    password,
    student.passwordHash
  );

  if (!passwordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signToken({
    id: student._id,
    role: "student",
  });

  return NextResponse.json({
    token,
    user: {
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      course: student.course,
      year: student.year,
      phone: student.phone,
      mustResetPassword: student.mustResetPassword,
      role: "student",
    },
  });
});