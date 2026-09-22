import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Result from "../../../../models/Result.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { csvResponseHeaders } from "../../../../lib/fileParse.js";

// GET /api/results/export?testId=
export const GET = withRoute(async (request) => {
  await connectDB();
  await authenticate(request, "admin");

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get("testId") || "";
  const filter = {};
  if (testId) filter.testId = testId;

  const results = await Result.find(filter)
    .populate("studentId", "fullName rollNumber email year username")
    .populate("testId", "name year totalMarks")
    .sort({ score: -1 });

  const header = "Name,Roll No,Username,Email,Year,Test,Correct,Wrong,Unanswered,Score,Total Marks,Percentage,Time Taken (s),Selection Status\n";
  const esc = (v = "") => `"${String(v).replace(/"/g, '""')}"`;
  const rows = results
    .map((r) =>
      [
        r.studentId?.fullName, r.studentId?.rollNumber, r.studentId?.username, r.studentId?.email, r.studentId?.year,
        r.testId?.name, r.correct, r.wrong, r.unanswered, r.score, r.totalMarks, r.percentage, r.timeTaken, r.selectionStatus,
      ].map(esc).join(",")
    )
    .join("\n");

  return new NextResponse(header + rows, { headers: csvResponseHeaders("results_export.csv") });
});
