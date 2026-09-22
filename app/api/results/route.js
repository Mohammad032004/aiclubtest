import { NextResponse } from "next/server";

import connectDB from "../../../lib/db.js";

import Result from "../../../models/Result.js";
import Test from "../../../models/Test.js";

import { authenticate } from "../../../lib/apiAuth.js";
import { withRoute } from "../../../lib/withRoute.js";

export const GET = withRoute(async (request) => {
  await connectDB();

  await authenticate(request, "admin");

  const { searchParams } = new URL(request.url);

  const testId = searchParams.get("testId") || "";
  const selectionStatus =
    searchParams.get("selectionStatus") || "";
  const minPercentage =
    searchParams.get("minPercentage") || "";

  /*
   * Get all results.
   *
   * If a test is selected, only that test's results
   * are returned.
   */
  const filter = {};

  if (testId) {
    filter.testId = testId;
  }

  if (selectionStatus) {
    filter.selectionStatus = selectionStatus;
  }

  if (minPercentage) {
    filter.percentage = {
      $gte: Number(minPercentage),
    };
  }

  const results = await Result.find(filter)
    .populate(
      "studentId",
      "fullName rollNumber email year username"
    )
    .populate(
      "testId",
      "name year totalMarks numberOfQuestions"
    )
    .sort({ percentage: -1 });

  /*
   * Get tests.
   *
   * This lets us calculate the total number of tests
   * available for a student's academic year.
   */
  const tests = await Test.find(
    {},
    "_id name year status"
  ).lean();

  const testsByYear = new Map();

  for (const test of tests) {
    const year = String(test.year);

    if (!testsByYear.has(year)) {
      testsByYear.set(year, []);
    }

    testsByYear.get(year).push(test);
  }

  /*
   * GROUP RESULTS BY STUDENT
   */
  const studentMap = new Map();

  for (const result of results) {
    if (!result.studentId || !result.testId) {
      continue;
    }

    const studentKey = String(result.studentId._id);

    if (!studentMap.has(studentKey)) {
      studentMap.set(studentKey, {
        student: result.studentId,

        results: [],

        correct: 0,
        wrong: 0,
        unanswered: 0,

        score: 0,
        totalMarks: 0,

        totalTime: 0,

        statuses: [],
      });
    }

    const student = studentMap.get(studentKey);

    student.results.push({
      id: result._id,
      test: result.testId,

      correct: result.correct,
      wrong: result.wrong,
      unanswered: result.unanswered,

      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,

      timeTaken: result.timeTaken,

      selectionStatus: result.selectionStatus,

      createdAt: result.createdAt,
    });

    student.correct += Number(result.correct) || 0;
    student.wrong += Number(result.wrong) || 0;
    student.unanswered += Number(result.unanswered) || 0;

    student.score += Number(result.score) || 0;
    student.totalMarks += Number(result.totalMarks) || 0;

    student.totalTime += Number(result.timeTaken) || 0;

    student.statuses.push(result.selectionStatus);
  }

  /*
   * Convert grouped data into final response.
   */
  const data = [];

  for (const student of studentMap.values()) {
    const year = String(student.student.year);

    const yearTests = testsByYear.get(year) || [];

    /*
     * If a test filter is active, the expected number
     * is simply 1.
     *
     * Otherwise use the number of tests for that year.
     */
    const totalTests = testId
      ? 1
      : yearTests.length;

    const attemptedTests = student.results.length;

    const percentage =
      student.totalMarks > 0
        ? Math.round(
            (student.score / student.totalMarks) *
              10000
          ) / 100
        : 0;

    /*
     * Determine overall selection status.
     *
     * If all individual statuses are the same,
     * use that status.
     *
     * Otherwise mark it as Mixed.
     */
    const uniqueStatuses = [
      ...new Set(student.statuses),
    ];

    const status =
      uniqueStatuses.length === 1
        ? uniqueStatuses[0]
        : "Mixed";

    data.push({
      id: String(student.student._id),

      student: {
        id: student.student._id,
        fullName: student.student.fullName,
        rollNumber: student.student.rollNumber,
        email: student.student.email,
        year: student.student.year,
        username: student.student.username,
      },

      attemptedTests,
      totalTests,

      correct: student.correct,
      wrong: student.wrong,
      unanswered: student.unanswered,

      score: student.score,
      totalMarks: student.totalMarks,

      percentage,

      timeTaken: student.totalTime,

      selectionStatus: status,

      results: student.results,
    });
  }

  /*
   * Rank students by overall percentage.
   */
  data.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }

    return b.score - a.score;
  });

  data.forEach((student, index) => {
    student.rank = index + 1;
  });

  return NextResponse.json(data);
});