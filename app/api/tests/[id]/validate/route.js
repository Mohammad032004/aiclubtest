import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Test from "../../../../../models/Test.js";
import { authenticate } from "../../../../../lib/apiAuth.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";
import { validateForActivation } from "../../../../../lib/testHelpers.js";

// GET /api/tests/:id/validate
export const GET = withRoute(async (request, { params }) => {
  await connectDB();
  await authenticate(request, "admin");
  const { id } = await params;
  const test = await Test.findById(id);
  if (!test) throw new ApiError(404, "Test not found");
  const errors = await validateForActivation(test);
  return NextResponse.json({ valid: errors.length === 0, errors });
});
