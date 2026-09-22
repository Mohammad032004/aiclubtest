import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Test from "../../../../models/Test.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { ApiError } from "../../../../lib/apiError.js";
import { YEAR_OPTIONS } from "../../../../models/Student.js";

function validateBasics(body) {
  const { name, year, duration, numberOfQuestions, totalMarks } = body;
  if (!name || !name.trim()) throw new ApiError(400, "Test name is required");
  if (!YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");
  if (!duration || Number(duration) <= 0) throw new ApiError(400, "Test duration must be greater than zero");
  if (!numberOfQuestions || Number(numberOfQuestions) < 1) throw new ApiError(400, "Number of questions must be at least 1");
  if (!totalMarks || Number(totalMarks) < 1) throw new ApiError(400, "Total marks must be at least 1");
}

// GET /api/tests/:id
export const GET = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const test = await Test.findById(id);
  if (!test) throw new ApiError(404, "Test not found");
  return NextResponse.json(test);
});

// PUT /api/tests/:id (only editable while Draft or Paused)
export const PUT = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const test = await Test.findById(id);
  if (!test) throw new ApiError(404, "Test not found");
  if (test.status === "Active" || test.status === "Closed") {
    throw new ApiError(400, `Cannot edit a test that is ${test.status}. Pause or close it first.`);
  }
  const body = await request.json();
  validateBasics(body);
  Object.assign(test, body, { status: test.status });
  await test.save();
  return NextResponse.json(test);
});

// DELETE /api/tests/:id (only Draft tests can be deleted)
export const DELETE = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const test = await Test.findById(id);
  if (!test) throw new ApiError(404, "Test not found");
  if (test.status !== "Draft") throw new ApiError(400, "Only draft tests can be deleted. Close the test instead.");
  await test.deleteOne();
  return NextResponse.json({ message: "Test deleted successfully" });
});
