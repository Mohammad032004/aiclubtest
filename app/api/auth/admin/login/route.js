import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/db.js";
import Admin from "../../../../../models/Admin.js";
import { comparePassword } from "../../../../../lib/password.js";
import { signToken } from "../../../../../lib/token.js";
import { withRoute } from "../../../../../lib/withRoute.js";
import { ApiError } from "../../../../../lib/apiError.js";

export const POST = withRoute(async (request) => {
  await connectDB();
  const { identifier, password } = await request.json();
  if (!identifier || !password) throw new ApiError(400, "Username/email and password are required");

  const admin = await Admin.findOne({
    $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
  });
  if (!admin) throw new ApiError(401, "Invalid credentials");

  const ok = await comparePassword(password, admin.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = signToken({ id: admin._id, role: "admin" });
  return NextResponse.json({
    token,
    user: { id: admin._id, fullName: admin.fullName, email: admin.email, username: admin.username, role: "admin" },
  });
});
