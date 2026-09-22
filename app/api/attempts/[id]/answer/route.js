import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import TestAttempt from "../../../../../models/TestAttempt.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";

// PATCH /api/attempts/:id/answer  { questionId, selectedOption }
export const PATCH = withRoute(async (request, { params }) => {
  await connectDB();
  const { user: student } = await authenticate(request, "student");
  const { id } = await params;
  const { questionId, selectedOption } = await request.json();
  if (!["A", "B", "C", "D", null].includes(selectedOption)) throw new ApiError(400, "Invalid option");

  const attempt = await TestAttempt.findOne({ _id: id, studentId: student._id });
  if (!attempt) throw new ApiError(404, "Attempt not found");
  if (attempt.status !== "InProgress") throw new ApiError(400, "This test has already been submitted.");
  if (new Date() > attempt.expiresAt) throw new ApiError(400, "Time is up for this test.");

  const answer = attempt.answers.find((a) => String(a.questionId) === String(questionId));
  if (!answer) throw new ApiError(400, "This question is not part of your test.");
  answer.selectedOption = selectedOption;
  answer.answeredAt = new Date();
  await attempt.save();

  return NextResponse.json({ message: "Answer saved" });
});
