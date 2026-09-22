import { NextResponse } from "next/server";
import connectDB from "../../../lib/db.js";
import Result from "../../../models/Result.js";
import { authenticate } from "../../../lib/apiAuth.js";
import { withRoute } from "../../../lib/withRoute.js";

// GET /api/my-results (student, read-only) -> own results, each with rank among that test's participants
export const GET = withRoute(async (request) => {
  await connectDB();
  const { user: student } = await authenticate(request, "student");

  const own = await Result.find({ studentId: student._id })
    .populate("testId", "name year totalMarks")
    .sort({ createdAt: -1 });

  const data = [];
  for (const r of own) {
    const cohort = await Result.find({ testId: r.testId._id }).sort({ score: -1 });
    const rank = cohort.findIndex((c) => String(c._id) === String(r._id)) + 1;
    data.push({
      id: r._id, test: r.testId, correct: r.correct, wrong: r.wrong, unanswered: r.unanswered,
      score: r.score, totalMarks: r.totalMarks, percentage: r.percentage, timeTaken: r.timeTaken,
      rank, outOf: cohort.length, selectionStatus: r.selectionStatus, createdAt: r.createdAt,
    });
  }
  return NextResponse.json(data);
});
