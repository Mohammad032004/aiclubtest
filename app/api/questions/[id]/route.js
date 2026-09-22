import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Question from "../../../../models/Question.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { ApiError } from "../../../../lib/apiError.js";
import { validateQuestionPayload } from "../../../../lib/questionHelpers.js";

// GET /api/questions/:id
export const GET = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const q = await Question.findById(id);
  if (!q) throw new ApiError(404, "Question not found");
  return NextResponse.json(q);
});

// PUT /api/questions/:id
export const PUT = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const body = await request.json();
  validateQuestionPayload(body);
  const { question, options, correctAnswer, year, category, difficulty, marks, explanation, status } = body;

  const q = await Question.findByIdAndUpdate(
    id,
    { question, options, correctAnswer, year, category, difficulty, marks, explanation, status },
    { new: true, runValidators: true }
  );
  if (!q) throw new ApiError(404, "Question not found");
  return NextResponse.json(q);
});

// DELETE /api/questions/:id
export const DELETE = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const q = await Question.findByIdAndDelete(id);
  if (!q) throw new ApiError(404, "Question not found");
  return NextResponse.json({ message: "Question deleted successfully" });
});
