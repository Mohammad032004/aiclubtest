import Student from "../models/Student.js";
import { ApiError } from "./apiError.js";

export function sanitizeStudent(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.passwordHash;
  return obj;
}

export async function assertUniqueStudent({ email, username, rollNumber }, excludeId = null) {
  const orConditions = [];
  if (email) orConditions.push({ email: email.toLowerCase() });
  if (username) orConditions.push({ username });
  if (rollNumber) orConditions.push({ rollNumber });
  if (!orConditions.length) return;
  const query = { $or: orConditions };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Student.findOne(query);
  if (existing) {
    if (email && existing.email === email.toLowerCase()) throw new ApiError(409, "A student with this email already exists");
    if (username && existing.username === username) throw new ApiError(409, "A student with this username already exists");
    if (rollNumber && existing.rollNumber === rollNumber) throw new ApiError(409, "A student with this roll number already exists");
  }
}
