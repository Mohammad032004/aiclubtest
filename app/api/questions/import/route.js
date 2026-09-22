import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Question from "../../../../models/Question.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { validateQuestionPayload } from "../../../../lib/questionHelpers.js";
import { getUploadedFile, parseTabularFile } from "../../../../lib/fileParse.js";

// POST /api/questions/import
export const POST = withRoute(async (request) => {
  await connectDB();
  const { auth } = await authenticate(request, "admin");

  const { buffer, originalname } = await getUploadedFile(request);
  const rows = parseTabularFile(buffer, originalname);

  const created = [];
  const failed = [];

  for (const [idx, row] of rows.entries()) {
    const rowNum = idx + 2;
    try {
      const payload = {
        question: row["Question"],
        options: { A: row["Option A"], B: row["Option B"], C: row["Option C"], D: row["Option D"] },
        correctAnswer: String(row["Correct Answer"] || "").trim().toUpperCase(),
        year: row["Year"],
        category: row["Category"],
        difficulty: row["Difficulty"],
        marks: Number(row["Marks"] || 1),
      };
      validateQuestionPayload(payload);
      const q = await Question.create({
        ...payload,
        explanation: row["Explanation"] || "",
        status: "Active",
        createdBy: auth.id,
      });
      created.push({ row: rowNum, id: q._id });
    } catch (err) {
      failed.push({ row: rowNum, error: err.message });
    }
  }

  return NextResponse.json({ createdCount: created.length, failedCount: failed.length, created, failed }, { status: 201 });
});
