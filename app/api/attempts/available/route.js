import { NextResponse } from "next/server";

import connectDB from "../../../../lib/db.js";

import Test from "../../../../models/Test.js";

import TestAttempt from "../../../../models/TestAttempt.js";

import { authenticate } from "../../../../lib/apiAuth.js";

import { withRoute } from "../../../../lib/withRoute.js";


// GET /api/attempts/available
// Returns all active tests for this student's year

export const GET = withRoute(async (request) => {
  await connectDB();

  const { user: student } = await authenticate(
    request,
    "student"
  );

  // Get all active tests for the student's year
  const tests = await Test.find({
    year: student.year,
    status: "Active",
  }).sort({
    createdAt: 1,
  });

  // No tests found
  if (!tests || tests.length === 0) {
    return NextResponse.json({
      tests: [],
      message:
        "No questions have been added for this test yet. Please contact the administrator.",
    });
  }

  // Get all test IDs
  const testIds = tests.map(
    (test) => test._id
  );

  // Find student's attempts for all these tests
  const attempts = await TestAttempt.find({
    studentId: student._id,
    testId: {
      $in: testIds,
    },
  });

  // Create quick lookup for attempts
  const attemptMap = new Map();

  attempts.forEach((attempt) => {
    attemptMap.set(
      String(attempt.testId),
      attempt
    );
  });

  // Prepare all available tests
  const availableTests = tests.map(
    (test) => {
      const existingAttempt =
        attemptMap.get(
          String(test._id)
        );

      return {
        id: test._id,

        name: test.name,

        year: test.year,

        duration: test.duration,

        numberOfQuestions:
          test.numberOfQuestions,

        totalMarks:
          test.totalMarks,

        negativeMarking:
          test.negativeMarking,

        attemptStatus:
          existingAttempt
            ? existingAttempt.status
            : null,

        attemptId:
          existingAttempt
            ? existingAttempt._id
            : null,
      };
    }
  );

  return NextResponse.json({
    tests: availableTests,
  });
});