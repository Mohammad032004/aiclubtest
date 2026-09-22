import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Result from "../../../../../models/Result.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";

// GET /api/students/:id/result
export const GET = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const results = await Result.find({ studentId: id }).populate("testId", "name year totalMarks");
  return NextResponse.json(results);
});
