import { NextResponse } from "next/server";
import connectDB from "../../../lib/db.js";
import Test from "../../../models/Test.js";
import { YEAR_OPTIONS } from "../../../models/Student.js";
import { authenticate } from "../../../lib/apiAuth.js";
import { withRoute } from "../../../lib/withRoute.js";
import { ApiError } from "../../../lib/apiError.js";

function validateBasics(body) {
  const { name, year, duration, numberOfQuestions, totalMarks } = body;
  if (!name || !name.trim()) throw new ApiError(400, "Test name is required");
  if (!YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");
  if (!duration || Number(duration) <= 0) throw new ApiError(400, "Test duration must be greater than zero");
  if (!numberOfQuestions || Number(numberOfQuestions) < 1) throw new ApiError(400, "Number of questions must be at least 1");
  if (!totalMarks || Number(totalMarks) < 1) throw new ApiError(400, "Total marks must be at least 1");
}

// GET /api/tests
export const GET = withRoute(async (request) => {
  await connectDB();
  await authenticate(request, "admin");
  const { searchParams } = new URL(request.url);
  const filter = {};
  if (searchParams.get("year")) filter.year = searchParams.get("year");
  if (searchParams.get("status")) filter.status = searchParams.get("status");
  const tests = await Test.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(tests);
});

// POST /api/tests (created as Draft)
export const POST = withRoute(async (request) => {
  await connectDB();
  const { auth } = await authenticate(request, "admin");
  const body = await request.json();
  validateBasics(body);
  const {
    name, year, duration, numberOfQuestions, totalMarks, negativeMarking,
    questionSelectionMode, manualQuestionIds, difficultyConfiguration, startDate, endDate,
  } = body;

  if (questionSelectionMode === "Manual") {
    if (!manualQuestionIds || manualQuestionIds.length !== Number(numberOfQuestions)) {
      throw new ApiError(400, `Manual selection requires exactly ${numberOfQuestions} question IDs`);
    }
  }

  if (difficultyConfiguration) {
    const sum = (difficultyConfiguration.Easy || 0) + (difficultyConfiguration.Medium || 0) + (difficultyConfiguration.Hard || 0);
    if (sum > 0 && sum !== Number(numberOfQuestions)) {
      throw new ApiError(400, `Difficulty configuration (${sum}) must add up to the number of questions (${numberOfQuestions})`);
    }
  }

  const test = await Test.create({
    name, year, duration, numberOfQuestions, totalMarks,
    negativeMarking: negativeMarking || 0,
    questionSelectionMode: questionSelectionMode || "Random",
    manualQuestionIds: manualQuestionIds || [],
    difficultyConfiguration: difficultyConfiguration || { Easy: 0, Medium: 0, Hard: 0 },
    status: "Draft",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    createdBy: auth.id,
  });
  return NextResponse.json(test, { status: 201 });
});
