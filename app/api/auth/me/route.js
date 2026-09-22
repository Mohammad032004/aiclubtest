import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db.js";
import { getAuth, loadUser } from "../../../../lib/apiAuth.js";
import { withRoute } from "../../../../lib/withRoute.js";

export const GET = withRoute(async (request) => {
  await connectDB();
  const auth = getAuth(request);
  const user = await loadUser(auth);
  return NextResponse.json({ role: auth.role, user });
});
