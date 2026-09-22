import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Question from "../../../../../models/Question.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";

// PATCH /api/questions/:id/status
export const PATCH = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const { status } = await request.json();
  if (!["Active", "Inactive"].includes(status)) throw new ApiError(400, "Invalid status");
  const q = await Question.findByIdAndUpdate(id, { status }, { new: true });
  if (!q) throw new ApiError(404, "Question not found");
  return NextResponse.json(q);
});
