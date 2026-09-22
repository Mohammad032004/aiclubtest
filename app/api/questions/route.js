import { NextResponse } from "next/server";
import connectDB from "../../../lib/db.js";
import Question from "../../../models/Question.js";
import { authenticate } from "../../../lib/apiAuth.js";
import { withRoute } from "../../../lib/withRoute.js";
import { validateQuestionPayload } from "../../../lib/questionHelpers.js";

// GET /api/questions
export const GET = withRoute(async (request) => {
  await connectDB();
  await authenticate(request, "admin");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const year = searchParams.get("year") || "";
  const category = searchParams.get("category") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const status = searchParams.get("status") || "";
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 200);

  const filter = {};
  if (year) filter.year = year;
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (status) filter.status = status;
  if (search) filter.question = new RegExp(search, "i");

  const [data, total] = await Promise.all([
    Question.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Question.countDocuments(filter),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// POST /api/questions
export const POST = withRoute(async (request) => {
  await connectDB();
  const { auth } = await authenticate(request, "admin");
  const body = await request.json();
  validateQuestionPayload(body);
  const { question, options, correctAnswer, year, category, difficulty, marks, explanation, status } = body;

  const q = await Question.create({
    question, options, correctAnswer, year, category, difficulty, marks,
    explanation: explanation || "",
    status: status || "Active",
    createdBy: auth.id,
  });
  return NextResponse.json(q, { status: 201 });
});
