import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Question from "../../../../models/Question.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { csvResponseHeaders } from "../../../../lib/fileParse.js";

// GET /api/questions/export
export const GET = withRoute(async (request) => {
  await connectDB();
  await authenticate(request, "admin");

  const { searchParams } = new URL(request.url);
  const filter = {};
  for (const key of ["year", "category", "difficulty", "status"]) {
    const val = searchParams.get(key);
    if (val) filter[key] = val;
  }

  const questions = await Question.find(filter).sort({ createdAt: -1 });
  const header = "Question,Option A,Option B,Option C,Option D,Correct Answer,Year,Category,Difficulty,Marks,Explanation,Status\n";
  const esc = (v = "") => `"${String(v).replace(/"/g, '""')}"`;
  const rows = questions
    .map((q) => [q.question, q.options.A, q.options.B, q.options.C, q.options.D, q.correctAnswer, q.year, q.category, q.difficulty, q.marks, q.explanation, q.status].map(esc).join(","))
    .join("\n");

  return new NextResponse(header + rows, { headers: csvResponseHeaders("question_bank_export.csv") });
});
