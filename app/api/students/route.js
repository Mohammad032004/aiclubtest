import { NextResponse } from "next/server";

import connectDB from "../../../lib/db.js";

import Student, {
  YEAR_OPTIONS,
  COURSE_OPTIONS,
} from "../../../models/Student.js";

import TestAttempt from "../../../models/TestAttempt.js";

import { authenticate } from "../../../lib/apiAuth.js";

import { withRoute } from "../../../lib/withRoute.js";

import { ApiError } from "../../../lib/apiError.js";

import {
  hashPassword,
  generateTempPassword,
} from "../../../lib/password.js";

import { sanitizeStudent } from "../../../lib/studentHelpers.js";

// GET /api/students
export const GET = withRoute(async (request) => {
  await connectDB();

  await authenticate(request, "admin");

  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const course = searchParams.get("course") || "";
  const year = searchParams.get("year") || "";
  const status = searchParams.get("status") || "";
  const testStatus = searchParams.get("testStatus") || "";

  const page = Math.max(
    parseInt(searchParams.get("page") || "1", 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(searchParams.get("limit") || "20", 10) || 20,
      1
    ),
    200
  );

  const filter = {};

  if (course) {
    filter.course = course;
  }

  if (year) {
    filter.year = year;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    const re = new RegExp(search, "i");

    filter.$or = [
      { fullName: re },
      { email: re },
      { course: re },
      { year: re },
    ];
  }

  const students = await Student.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Student.countDocuments(filter);

  const studentIds = students.map((student) => student._id);

  const attempts = await TestAttempt.find({
    studentId: { $in: studentIds },
  });

  const attemptByStudent = new Map(
    attempts.map((attempt) => [
      String(attempt.studentId),
      attempt.status,
    ])
  );

  let data = students.map((student) => {
    const obj = sanitizeStudent(student);

    const attemptStatus = attemptByStudent.get(
      String(student._id)
    );

    obj.testStatus =
      attemptStatus === "InProgress"
        ? "In Progress"
        : attemptStatus === "Submitted" ||
            attemptStatus === "AutoSubmitted"
          ? "Completed"
          : "Not Attempted";

    return obj;
  });

  if (testStatus) {
    data = data.filter(
      (student) => student.testStatus === testStatus
    );
  }

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

// POST /api/students
export const POST = withRoute(async (request) => {
  await connectDB();

  await authenticate(request, "admin");

  const body = await request.json();

  const {
    fullName,
    email,
    course,
    password,
    year,
    phone,
    status,
    generatePassword,
  } = body;

  // Required fields
  if (!fullName || !email || !course || !year) {
    throw new ApiError(
      400,
      "Full name, email, course and year are required"
    );
  }

  // Validate course
  if (!COURSE_OPTIONS.includes(course)) {
    throw new ApiError(400, "Invalid course");
  }

  // Validate year
  if (!YEAR_OPTIONS.includes(year)) {
    throw new ApiError(400, "Invalid academic year");
  }

  // Check duplicate email
  const existingStudent = await Student.findOne({
    email: email.toLowerCase(),
  });

  if (existingStudent) {
    throw new ApiError(
      409,
      "A student with this email already exists"
    );
  }

  // Generate or use provided password
  const plainPassword = generatePassword
    ? generateTempPassword()
    : password;

  if (!plainPassword || plainPassword.length < 8) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters, or use Generate Password"
    );
  }

  // Create student
  const student = await Student.create({
    fullName: fullName.trim(),

    email: email.toLowerCase().trim(),

    passwordHash: await hashPassword(plainPassword),

    course,

    year,

    phone: phone || "",

    status: status || "Active",

    mustResetPassword: !!generatePassword,
  });

  const responseBody = sanitizeStudent(student);

  // Only returned during creation
  responseBody.temporaryPassword = plainPassword;

  return NextResponse.json(responseBody, {
    status: 201,
  });
});