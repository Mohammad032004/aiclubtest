import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Student from "../../../../../models/Student.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";
import { sanitizeStudent } from "../../../../../lib/studentHelpers.js";

// PATCH /api/students/:id/status
export const PATCH = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const { status } = await request.json();
  if (!["Active", "Disabled"].includes(status)) throw new ApiError(400, "Invalid status");
  const student = await Student.findByIdAndUpdate(id, { status }, { new: true });
  if (!student) throw new ApiError(404, "Student not found");
  return NextResponse.json(sanitizeStudent(student));
});
