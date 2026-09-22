import { NextResponse } from "next/server";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { csvResponseHeaders } from "../../../../../lib/fileParse.js";
import connectDB from "../../../../../lib/db.js";

// GET /api/students/import/template
export const GET = withRoute(async (request) => {
  await connectDB();
  await authenticate(request, "admin");
  const header = "Full Name,Roll Number,Email,Username,Year\n";
  const example = "Rahul Kumar,BCA001,rahul@example.com,rahul001,BCA 1st Year\n";
  return new NextResponse(header + example, { headers: csvResponseHeaders("student_import_template.csv") });
});
