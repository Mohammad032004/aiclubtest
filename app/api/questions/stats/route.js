import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import Question from "../../../../models/Question.js";
import { YEAR_OPTIONS } from "../../../../models/Student.js";
import { authenticate } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";

// GET /api/questions/stats
export const GET = withRoute(async (request) => {
  await connectDB();
  await authenticate(request, "admin");

  const agg = await Question.aggregate([
    { $match: { status: "Active" } },
    { $group: { _id: { year: "$year", difficulty: "$difficulty" }, count: { $sum: 1 } } },
  ]);

  const stats = {};
  for (const year of YEAR_OPTIONS) stats[year] = { Easy: 0, Medium: 0, Hard: 0, Total: 0 };
  for (const row of agg) {
    const { year, difficulty } = row._id;
    if (!stats[year]) continue;
    stats[year][difficulty] = row.count;
    stats[year].Total += row.count;
  }
  return NextResponse.json(stats);
});
