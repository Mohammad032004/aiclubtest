import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Test from "../../../../models/Test.js";
import Question from "../../../../models/Question.js";
import TestAttempt from "../../../../models/TestAttempt.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";
import { ApiError } from "../../../../lib/apiError.js";
import { selectQuestionsForTest, toClientQuestion, autoSubmit } from "../../../../lib/attemptHelpers.js";

// POST /api/attempts/start  { testId }
export const POST = withRoute(async (request) => {
  await connectDB();
  const { user: student } = await authenticate(request, "student");
  const { testId } = await request.json();

  const test = await Test.findById(testId);
  if (!test) throw new ApiError(404, "Test not found");
  if (test.status !== "Active") throw new ApiError(400, "This test is not currently active.");
  if (test.year !== student.year) throw new ApiError(403, "This test is not available for your academic year.");

  // Idempotent: if an attempt already exists, return the SAME question set (no re-randomization on refresh)
  let attempt = await TestAttempt.findOne({ studentId: student._id, testId: test._id });

  if (attempt) {
    if (attempt.status !== "InProgress") {
      throw new ApiError(400, "You have already submitted this test.");
    }
    if (new Date() > attempt.expiresAt) {
      await autoSubmit(attempt, test);
      throw new ApiError(400, "Your test time has expired and has been auto-submitted.");
    }
    const questions = await Question.find({ _id: { $in: attempt.questionIds } });
    const byId = new Map(questions.map((q) => [String(q._id), q]));
    const orderedQuestions = attempt.questionIds.map((id) => byId.get(String(id))).filter(Boolean);
    return NextResponse.json({
      attemptId: attempt._id, startedAt: attempt.startedAt, expiresAt: attempt.expiresAt,
      questions: orderedQuestions.map(toClientQuestion),
      answers: attempt.answers.map((a) => ({ questionId: a.questionId, selectedOption: a.selectedOption })),
    });
  }

  const questions = await selectQuestionsForTest(test);
  if (questions.length < test.numberOfQuestions) {
    throw new ApiError(400, "Not enough active questions are currently available. Please contact the administrator.");
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + test.duration * 60 * 1000);

  try {
    attempt = await TestAttempt.create({
      studentId: student._id,
      testId: test._id,
      questionIds: questions.map((q) => q._id),
      answers: questions.map((q) => ({ questionId: q._id, selectedOption: null })),
      startedAt, expiresAt, status: "InProgress",
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(400, "You have already started this test.");
    throw err;
  }

  return NextResponse.json({
    attemptId: attempt._id, startedAt: attempt.startedAt, expiresAt: attempt.expiresAt,
    questions: questions.map(toClientQuestion),
    answers: attempt.answers.map((a) => ({ questionId: a.questionId, selectedOption: a.selectedOption })),
  }, { status: 201 });
});
