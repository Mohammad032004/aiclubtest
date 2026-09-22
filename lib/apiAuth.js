import { verifyToken } from "./token.js";
import { ApiError } from "./apiError.js";
import connectDB from "./db.js";
import Admin from "../models/Admin.js";
import Student from "../models/Student.js";

// Reads and verifies the Bearer token from an incoming Next.js Request.
// Returns { id, role } (the JWT payload) or throws ApiError(401).
export function getAuth(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Authentication required");
  try {
    return verifyToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired session. Please log in again.");
  }
}

export function requireRole(auth, role) {
  if (!auth || auth.role !== role) {
    throw new ApiError(403, `${role === "admin" ? "Admin" : "Student"} access required`);
  }
}

// Loads the full Mongoose document for the authenticated user. For students,
// also enforces that the account is Active (mirrors the old Express
// loadUser + requireStudent chain).
export async function loadUser(auth) {
  await connectDB();
  if (auth.role === "admin") {
    const admin = await Admin.findById(auth.id);
    if (!admin) throw new ApiError(401, "Admin account not found");
    return admin;
  }
  if (auth.role === "student") {
    const student = await Student.findById(auth.id);
    if (!student) throw new ApiError(401, "Student account not found");
    if (student.status !== "Active") {
      throw new ApiError(403, "Your account has been disabled. Contact the administrator.");
    }
    return student;
  }
  throw new ApiError(401, "Unknown role");
}

// Convenience: authenticate + authorize + load doc in one call.
// role: "admin" | "student" | undefined (undefined = any authenticated user)
export async function authenticate(request, role) {
  const auth = getAuth(request);
  if (role) requireRole(auth, role);
  const user = await loadUser(auth);
  return { auth, user };
}
