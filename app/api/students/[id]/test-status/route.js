import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Student from "../../../../../models/Student.js";
import Test from "../../../../../models/Test.js";
import TestAttempt from "../../../../../models/TestAttempt.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";

// GET /api/students/:id/test-status
export const GET = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, "Student not found");

  const tests = await Test.find({ year: student.year });
  const attempts = await TestAttempt.find({ studentId: student._id });
  const attemptByTest = new Map(attempts.map((a) => [String(a.testId), a]));

  const data = tests.map((t) => ({
    testId: t._id,
    testName: t.name,
    testStatus: t.status,
    attempt: attemptByTest.get(String(t._id))
      ? {
          status: attemptByTest.get(String(t._id)).status,
          startedAt: attemptByTest.get(String(t._id)).startedAt,
          submittedAt: attemptByTest.get(String(t._id)).submittedAt,
        }
      : null,
  }));

  return NextResponse.json(data);
});
