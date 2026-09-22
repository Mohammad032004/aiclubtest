import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Result from "../../../../../models/Result.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";

// PATCH /api/results/:id/selection
export const PATCH = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const { selectionStatus } = await request.json();
  if (!["Pending", "Shortlisted", "Selected", "Rejected"].includes(selectionStatus)) {
    throw new ApiError(400, "Invalid selection status");
  }
  const result = await Result.findByIdAndUpdate(id, { selectionStatus }, { new: true });
  if (!result) throw new ApiError(404, "Result not found");
  return NextResponse.json(result);
});
