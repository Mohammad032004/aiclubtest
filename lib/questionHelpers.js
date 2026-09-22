import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from "../models/Question.js";
import { YEAR_OPTIONS } from "../models/Student.js";
import { ApiError } from "./apiError.js";

export function validateQuestionPayload(body) {
  const { question, options, correctAnswer, year, category, difficulty, marks } = body;
  if (!question || !question.trim()) throw new ApiError(400, "Question text is required");
  if (!options || !options.A || !options.B || !options.C || !options.D) {
    throw new ApiError(400, "All four options (A, B, C, D) are required");
  }
  if (!["A", "B", "C", "D"].includes(correctAnswer)) throw new ApiError(400, "A valid correct answer (A/B/C/D) is required");
  if (!YEAR_OPTIONS.includes(year)) throw new ApiError(400, "Invalid academic year");
  if (!CATEGORY_OPTIONS.includes(category)) throw new ApiError(400, "Invalid category");
  if (!DIFFICULTY_OPTIONS.includes(difficulty)) throw new ApiError(400, "Invalid difficulty");
  if (!marks || Number(marks) < 1) throw new ApiError(400, "Marks must be at least 1");
}
