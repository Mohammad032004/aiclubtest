import Question from "../models/Question.js";
import Result from "../models/Result.js";

/* =========================================================
   SHUFFLE
========================================================= */

export function shuffle(arr) {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

/* =========================================================
   CLIENT QUESTION
   Removes correctAnswer + explanation before sending
   questions to the student's browser.
========================================================= */

export function toClientQuestion(q) {
  return {
    questionId: q._id,

    question: q.question,

    optionA: q.options.A,
    optionB: q.options.B,
    optionC: q.options.C,
    optionD: q.options.D,

    marks: q.marks,
  };
}

/* =========================================================
   SELECT QUESTIONS FOR TEST
========================================================= */

export async function selectQuestionsForTest(test) {
  /*
   * MANUAL QUESTION SELECTION
   */

  if (test.questionSelectionMode === "Manual") {
    const qs = await Question.find({
      _id: {
        $in: test.manualQuestionIds,
      },
      status: "Active",
    });

    return shuffle(qs);
  }

  /*
   * DIFFICULTY-BASED QUESTION SELECTION
   */

  const diffCfg = test.difficultyConfiguration || {};

  const diffSum =
    (diffCfg.Easy || 0) +
    (diffCfg.Medium || 0) +
    (diffCfg.Hard || 0);

  if (
    diffSum === test.numberOfQuestions &&
    diffSum > 0
  ) {
    let selected = [];

    for (const diff of [
      "Easy",
      "Medium",
      "Hard",
    ]) {
      const need = diffCfg[diff] || 0;

      if (need === 0) {
        continue;
      }

      const pool = await Question.aggregate([
        {
          $match: {
            year: test.year,
            status: "Active",
            difficulty: diff,
          },
        },
        {
          $sample: {
            size: need,
          },
        },
      ]);

      selected = selected.concat(pool);
    }

    return shuffle(selected);
  }

  /*
   * RANDOM QUESTION SELECTION
   */

  const pool = await Question.aggregate([
    {
      $match: {
        year: test.year,
        status: "Active",
      },
    },
    {
      $sample: {
        size: test.numberOfQuestions,
      },
    },
  ]);

  return shuffle(pool);
}

/* =========================================================
   SCORE ATTEMPT
========================================================= */

export async function scoreAttempt(attempt, test) {
  /*
   * Load the exact questions assigned to this attempt.
   */

  const questions = await Question.find({
    _id: {
      $in: attempt.questionIds,
    },
  });

  /*
   * Quick lookup:
   *
   * questionId -> Question
   */

  const byId = new Map(
    questions.map((q) => [
      String(q._id),
      q,
    ])
  );

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let score = 0;

  /*
   * Calculate the ACTUAL maximum marks
   * from the questions used in this attempt.
   *
   * This prevents problems such as:
   *
   * score = 8
   * test.totalMarks = 5
   * percentage = 160%
   *
   * Instead, if the selected questions are
   * worth 10 marks in total:
   *
   * score = 8
   * totalMarks = 10
   * percentage = 80%
   */

  let totalMarks = 0;

  for (const question of questions) {
    totalMarks += Number(question.marks) || 0;
  }

  /*
   * Evaluate every answer.
   */

  for (const ans of attempt.answers) {
    const question = byId.get(
      String(ans.questionId)
    );

    /*
     * If the question no longer exists,
     * skip it safely.
     */

    if (!question) {
      continue;
    }

    /*
     * Unanswered question
     */

    if (!ans.selectedOption) {
      unanswered++;
      continue;
    }

    /*
     * Correct answer
     */

    if (
      ans.selectedOption ===
      question.correctAnswer
    ) {
      correct++;

      score +=
        Number(question.marks) || 0;
    }

    /*
     * Wrong answer
     */

    else {
      wrong++;

      score -=
        Number(test.negativeMarking) || 0;
    }
  }

  /*
   * Score cannot go below zero.
   */

  score = Math.max(0, score);

  return {
    correct,
    wrong,
    unanswered,
    score,
    totalMarks,
  };
}

/* =========================================================
   PERSIST RESULT
========================================================= */

export async function persistResult(
  attempt,
  test,
  {
    correct,
    wrong,
    unanswered,
    score,
    totalMarks,
  }
) {
  /*
   * Calculate time taken in seconds.
   */

  const timeTaken = attempt.submittedAt
    ? Math.round(
        (attempt.submittedAt -
          attempt.startedAt) /
          1000
      )
    : 0;

  /*
   * Calculate percentage from the ACTUAL
   * total marks of this attempt.
   */

  const percentage =
    totalMarks > 0
      ? Math.round(
          (score / totalMarks) * 10000
        ) / 100
      : 0;

  /*
   * Save / update result.
   *
   * One student can have one result
   * per test.
   */

  await Result.findOneAndUpdate(
    {
      studentId: attempt.studentId,
      testId: test._id,
    },
    {
      studentId: attempt.studentId,
      testId: test._id,
      attemptId: attempt._id,

      correct,
      wrong,
      unanswered,

      score,
      totalMarks,
      percentage,

      timeTaken,
    },
    {
      upsert: true,
      new: true,
    }
  );
}

/* =========================================================
   AUTO SUBMIT
========================================================= */

export async function autoSubmit(
  attempt,
  test
) {
  /*
   * Calculate the result using the same
   * scoring logic as normal submission.
   */

  const {
    correct,
    wrong,
    unanswered,
    score,
    totalMarks,
  } = await scoreAttempt(
    attempt,
    test
  );

  /*
   * Mark attempt as automatically submitted.
   */

  attempt.status = "AutoSubmitted";

  /*
   * For auto submission, the expiry time
   * is treated as the submission time.
   */

  attempt.submittedAt =
    attempt.expiresAt;

  attempt.score = score;

  await attempt.save();

  /*
   * Persist the result.
   */

  await persistResult(
    attempt,
    test,
    {
      correct,
      wrong,
      unanswered,
      score,
      totalMarks,
    }
  );
}