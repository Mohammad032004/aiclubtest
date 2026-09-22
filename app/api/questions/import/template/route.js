import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { csvResponseHeaders } from "../../../../../lib/fileParse.js";

// GET /api/questions/import/template
export const GET = withRoute(async (request) => {
  await connectDB();
  await authenticate(request, "admin");
  const header = "Question,Option A,Option B,Option C,Option D,Correct Answer,Year,Category,Difficulty,Marks,Explanation\n";
  const example =
    'What does CPU stand for?,Central Processing Unit,Central Program Unit,Computer Personal Unit,Central Processor Utility,A,BCA 1st Year,Computer Basics,Easy,1,"CPU is the primary component that executes instructions."\n';
  return new NextResponse(header + example, { headers: csvResponseHeaders("question_import_template.csv") });
});
