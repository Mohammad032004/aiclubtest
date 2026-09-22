import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import TestAttempt from "../../../../models/TestAttempt.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";

// GET /api/attempts/history -> this student's own attempts, across all tests (additive, read-only)
export const GET = withRoute(async (request) => {
  await connectDB();
  const { user: student } = await authenticate(request, "student");

  const attempts = await TestAttempt.find({ studentId: student._id })
    .populate("testId", "name year duration numberOfQuestions totalMarks status")
    .sort({ createdAt: -1 });

  const data = attempts
    .filter((a) => a.testId)
    .map((a) => ({
      attemptId: a._id,
      test: {
        id: a.testId._id, name: a.testId.name, year: a.testId.year,
        duration: a.testId.duration, numberOfQuestions: a.testId.numberOfQuestions, totalMarks: a.testId.totalMarks,
      },
      status: a.status, startedAt: a.startedAt, submittedAt: a.submittedAt, score: a.score,
    }));

  return NextResponse.json(data);
});
