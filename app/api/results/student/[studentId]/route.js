import { NextResponse } from "next/server";

import connectDB from "../../../../../lib/db.js";

import Result from "../../../../../models/Result.js";

import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";

export const GET = withRoute(
  async (request, { params }) => {
    console.log(
      "================================="
    );

    console.log(
      "STUDENT RESULT API CALLED"
    );

    console.log(
      "URL:",
      request.url
    );

    console.log(
      "PARAMS:",
      params
    );

    await connectDB();

    console.log(
      "DATABASE CONNECTED"
    );

    await authenticate(
      request,
      "admin"
    );

    console.log(
      "ADMIN AUTHENTICATED"
    );

    const { studentId } = await params;

    console.log(
      "STUDENT ID:",
      studentId
    );

    const results =
      await Result.find({
        studentId,
      })
        .populate(
          "studentId",
          "fullName rollNumber email year username"
        )
        .populate(
          "testId",
          "name year totalMarks numberOfQuestions duration"
        )
        .lean();

    console.log(
      "RESULT COUNT:",
      results.length
    );

    return NextResponse.json({
      success: true,

      message:
        "Student result API is working.",

      studentId,

      resultCount:
        results.length,

      results,
    });
  }
);