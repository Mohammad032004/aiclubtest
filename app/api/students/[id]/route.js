import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Student, { YEAR_OPTIONS } from "../../../../models/Student.js";
import TestAttempt from "../../../../models/TestAttempt.js";
import Result from "../../../../models/Result.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { ApiError } from "../../../../lib/apiError.js";
import { sanitizeStudent, assertUniqueStudent } from "../../../../lib/studentHelpers.js";

// GET /api/students/:id
export const GET = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, "Student not found");
  return NextResponse.json(sanitizeStudent(student));
});

// PUT /api/students/:id
export const PUT = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const body = await request.json();
  const { fullName, rollNumber, email, username, year, phone, status, loginMethod } = body;

  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, "Student not found");

  if (year && !YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");
  await assertUniqueStudent({ email, username, rollNumber }, student._id);

  if (fullName !== undefined) student.fullName = fullName;
  if (rollNumber !== undefined) student.rollNumber = rollNumber;
  if (email !== undefined) student.email = email.toLowerCase();
  if (username !== undefined) student.username = username;
  if (year !== undefined) student.year = year;
  if (phone !== undefined) student.phone = phone;
  if (status !== undefined) student.status = status;
  if (loginMethod !== undefined) student.loginMethod = loginMethod;

  await student.save();
  return NextResponse.json(sanitizeStudent(student));
});

// DELETE /api/students/:id
export const DELETE = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const student = await Student.findByIdAndDelete(id);
  if (!student) throw new ApiError(404, "Student not found");
  await TestAttempt.deleteMany({ studentId: student._id });
  await Result.deleteMany({ studentId: student._id });
  return NextResponse.json({ message: "Student deleted successfully" });
});
