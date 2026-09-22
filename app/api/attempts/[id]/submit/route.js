import { NextResponse } from "next/server";

import connectDB from "../../../../../lib/db.js";

import Test from "../../../../../models/Test.js";
import TestAttempt from "../../../../../models/TestAttempt.js";

import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";

import {
  scoreAttempt,
  persistResult,
} from "../../../../../lib/attemptHelpers.js";

// POST /api/attempts/:id/submit
export const POST = withRoute(async (request, { params }) => {
  await connectDB();

  const { user: student } = await authenticate(
    request,
    "student"
  );

  const { id } = await params;

  const attempt = await TestAttempt.findOne({
    _id: id,
    studentId: student._id,
  });

  if (!attempt) {
    throw new ApiError(404, "Attempt not found");
  }

  if (attempt.status !== "InProgress") {
    throw new ApiError(
      400,
      "This test has already been submitted."
    );
  }

  const test = await Test.findById(attempt.testId);

  if (!test) {
    throw new ApiError(404, "Test not found");
  }

  // Calculate result using the actual questions
  // assigned to this attempt.
  const {
    correct,
    wrong,
    unanswered,
    score,
    totalMarks,
  } = await scoreAttempt(attempt, test);

  // Mark attempt as submitted.
  attempt.status = "Submitted";
  attempt.submittedAt = new Date();
  attempt.score = score;

  await attempt.save();

  // Persist result using the actual total marks
  // calculated from the questions in this attempt.
  await persistResult(attempt, test, {
    correct,
    wrong,
    unanswered,
    score,
    totalMarks,
  });

  return NextResponse.json({
    message: "Test submitted successfully",

    summary: {
      correct,
      wrong,
      unanswered,
      score,
      totalMarks,
    },
  });
});