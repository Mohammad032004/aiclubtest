import { NextResponse } from "next/server";
import { ApiError } from "./apiError.js";

// Wraps a Next.js Route Handler so thrown ApiErrors (and unexpected errors)
// become proper JSON error responses, the same way the old Express
// asyncHandler + errorHandler middleware did.
//
// Usage:
//   export const GET = withRoute(async (request, ctx) => {
//     ...
//     return NextResponse.json(data);
//   });
export function withRoute(handler) {
  return async function wrapped(request, ctx) {
    try {
      return await handler(request, ctx);
    } catch (err) {
      const statusCode = err instanceof ApiError ? err.statusCode : err.statusCode || 500;
      if (statusCode === 500) console.error(err);
      return NextResponse.json({ message: err.message || "Internal server error" }, { status: statusCode });
    }
  };
}
