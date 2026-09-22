import { NextResponse } from "next/server";

import connectDB from "../../../../lib/db.js";

import Student, {
  YEAR_OPTIONS,
  COURSE_OPTIONS,
} from "../../../../models/Student.js";

import { authenticate } from "../../../../lib/apiAuth.js";

import { withRoute } from "../../../../lib/withRoute.js";

import {
  hashPassword,
  generateTempPassword,
} from "../../../../lib/password.js";

import {
  sanitizeStudent,
  assertUniqueStudent,
} from "../../../../lib/studentHelpers.js";

import {
  getUploadedFile,
  parseTabularFile,
} from "../../../../lib/fileParse.js";

// POST /api/students/import
// multipart:
// - file
// - passwordMode
// - password? (when manual)
// - course? (fallback course if CSV does not contain Course)

export const POST = withRoute(async (request) => {
  await connectDB();

  await authenticate(request, "admin");

  const {
    buffer,
    originalname,
    formData,
  } = await getUploadedFile(request);

  const passwordMode =
    formData.get("passwordMode") || "generate";

  const manualPassword =
    formData.get("password");

  // Course selected from the frontend.
  // This is used when the CSV does not contain a Course column.
  const selectedCourse =
    String(formData.get("course") || "").trim();

  const rows = parseTabularFile(
    buffer,
    originalname
  );

  const created = [];
  const failed = [];

  for (const [idx, row] of rows.entries()) {
    const rowNum = idx + 2;

    const fullName =
      row["Full Name"] ||
      row.fullName;

    const rollNumber =
      row["Roll Number"] ||
      row.rollNumber;

    const email =
      row["Email"] ||
      row.email;

    const username =
      row["Username"] ||
      row.username;

    const year =
      row["Year"] ||
      row.year;

    // --------------------------------------------------
    // COURSE
    // --------------------------------------------------
    // First try to get Course from the CSV.
    // If not available, use the course selected
    // from the import form.
    const rowCourse =
      row["Course"] ||
      row.course;

    const course =
      String(rowCourse || selectedCourse).trim();

    try {
      // --------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------

      if (
        !fullName ||
        !rollNumber ||
        !email ||
        !username ||
        !year
      ) {
        throw new Error(
          "Missing required field(s)"
        );
      }

      // --------------------------------------------------
      // COURSE VALIDATION
      // --------------------------------------------------

      if (!course) {
        throw new Error(
          "Course is required"
        );
      }

      if (!COURSE_OPTIONS.includes(course)) {
        throw new Error(
          `Invalid course "${course}". Allowed courses: ${COURSE_OPTIONS.join(
            ", "
          )}`
        );
      }

      // --------------------------------------------------
      // YEAR VALIDATION
      // --------------------------------------------------

      if (!YEAR_OPTIONS.includes(year)) {
        throw new Error(
          `Invalid year "${year}"`
        );
      }

      // --------------------------------------------------
      // DUPLICATE CHECK
      // --------------------------------------------------

      await assertUniqueStudent({
        email,
        username,
        rollNumber,
      });

      // --------------------------------------------------
      // PASSWORD
      // --------------------------------------------------

      const plainPassword =
        passwordMode === "manual"
          ? manualPassword
          : generateTempPassword();

      if (
        !plainPassword ||
        String(plainPassword).length < 8
      ) {
        throw new Error(
          "Password must be at least 8 characters"
        );
      }

      // --------------------------------------------------
      // CREATE STUDENT
      // --------------------------------------------------

      const student =
        await Student.create({
          fullName: String(fullName).trim(),

          rollNumber: String(
            rollNumber
          ).trim(),

          email: String(email)
            .toLowerCase()
            .trim(),

          username: String(
            username
          ).trim(),

          passwordHash:
            await hashPassword(
              String(plainPassword)
            ),

          course,

          year,

          status: "Active",

          loginMethod: "both",

          mustResetPassword:
            passwordMode !== "manual",
        });

      // --------------------------------------------------
      // RESULT
      // --------------------------------------------------

      created.push({
        row: rowNum,

        fullName:
          student.fullName,

        rollNumber:
          student.rollNumber,

        username:
          student.username,

        email:
          student.email,

        course:
          student.course,

        year:
          student.year,

        temporaryPassword:
          passwordMode === "manual"
            ? undefined
            : plainPassword,
      });
    } catch (err) {
      failed.push({
        row: rowNum,

        fullName:
          fullName || "",

        rollNumber:
          rollNumber || "",

        error:
          err?.message ||
          "Unable to create student",
      });
    }
  }

  return NextResponse.json(
    {
      createdCount:
        created.length,

      failedCount:
        failed.length,

      created,

      failed,
    },
    {
      status: 201,
    }
  );
});