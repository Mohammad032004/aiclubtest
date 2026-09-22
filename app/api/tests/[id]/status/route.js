import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Test from "../../../../../models/Test.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";
import { validateForActivation } from "../../../../../lib/testHelpers.js";

// PATCH /api/tests/:id/status
export const PATCH = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const { status } = await request.json();
  if (!["Draft", "Active", "Paused", "Closed"].includes(status)) throw new ApiError(400, "Invalid status");

  const test = await Test.findById(id);
  if (!test) throw new ApiError(404, "Test not found");

  if (status === "Active") {
    const errors = await validateForActivation(test);
    if (errors.length) throw new ApiError(400, errors[0]);
  }

  test.status = status;
  await test.save();
  return NextResponse.json(test);
});
