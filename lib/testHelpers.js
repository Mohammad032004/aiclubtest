import Question from "../models/Question.js";

// Core validation used before activation. Mirrors the original Express
// testController.validateForActivation exactly.
export async function validateForActivation(test) {
  const errors = [];

  if (!test.duration || test.duration <= 0) {
    errors.push("Test duration must be greater than zero.");
  }

  const questionFilter = { year: test.year, status: "Active" };
  const activeCount = await Question.countDocuments(questionFilter);

  if (activeCount < test.numberOfQuestions) {
    errors.push(
      `Cannot activate test. Only ${activeCount} active question${activeCount === 1 ? "" : "s"} available for ${test.year}, but this test requires ${test.numberOfQuestions} questions.`
    );
  }

  const invalidAnswerCount = await Question.countDocuments({
    ...questionFilter,
    correctAnswer: { $nin: ["A", "B", "C", "D"] },
  });
  if (invalidAnswerCount > 0) {
    errors.push(`${invalidAnswerCount} question(s) for ${test.year} do not have a valid correct answer.`);
  }

  if (test.questionSelectionMode === "Manual") {
    if (test.manualQuestionIds.length !== test.numberOfQuestions) {
      errors.push(`Manually selected questions (${test.manualQuestionIds.length}) do not match the configured number of questions (${test.numberOfQuestions}).`);
    } else {
      const manualQs = await Question.find({ _id: { $in: test.manualQuestionIds } });
      const wrongYear = manualQs.filter((q) => q.year !== test.year);
      const inactive = manualQs.filter((q) => q.status !== "Active");
      if (wrongYear.length) errors.push(`${wrongYear.length} manually selected question(s) do not belong to ${test.year}.`);
      if (inactive.length) errors.push(`${inactive.length} manually selected question(s) are inactive.`);
      if (manualQs.length !== test.manualQuestionIds.length) errors.push("Some manually selected questions no longer exist.");
    }
  }

  const diffSum = (test.difficultyConfiguration?.Easy || 0) + (test.difficultyConfiguration?.Medium || 0) + (test.difficultyConfiguration?.Hard || 0);
  if (diffSum > 0) {
    if (diffSum !== test.numberOfQuestions) {
      errors.push(`Difficulty configuration (${diffSum}) does not match the number of questions (${test.numberOfQuestions}).`);
    } else if (test.questionSelectionMode === "Random") {
      for (const diff of ["Easy", "Medium", "Hard"]) {
        const need = test.difficultyConfiguration[diff] || 0;
        if (need === 0) continue;
        const have = await Question.countDocuments({ ...questionFilter, difficulty: diff });
        if (have < need) {
          errors.push(`Cannot activate test. Only ${have} active ${diff} question(s) available for ${test.year}, but this test requires ${need}.`);
        }
      }
    }
  }

  return errors;
}
