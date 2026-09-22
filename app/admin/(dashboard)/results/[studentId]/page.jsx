"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { api } from "@/lib/api-client.js";
import { Icon } from "@/components/Icons.jsx";
import { useToast } from "@/context/ToastContext.jsx";

export default function StudentResultPage() {
  const params = useParams();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [openTest, setOpenTest] = useState(null);

  /* =====================================================
     LOAD STUDENT RESULT
  ===================================================== */

  useEffect(() => {
    async function loadResult() {
      const studentId = params?.studentId;

      console.log(
        "RESULT PAGE PARAMS:",
        params
      );

      console.log(
        "STUDENT ID:",
        studentId
      );

      if (!studentId) {
        console.log(
          "Student ID not available yet."
        );

        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        console.log(
          "REQUESTING:",
          `/results/student/${studentId}`
        );

        const result = await api.get(
          `/results/student/${studentId}`
        );

        console.log(
          "STUDENT RESULT RESPONSE:",
          result
        );

        setData(result);
      } catch (error) {
        console.error(
          "STUDENT RESULT ERROR:",
          error
        );

        const message =
          error?.message ||
          "Unable to load student result.";

        setErrorMessage(message);

        toast.error(message);

        setData(null);
      } finally {
        console.log(
          "STUDENT RESULT LOADING FINISHED"
        );

        setLoading(false);
      }
    }

    loadResult();

    // We intentionally only depend on studentId.
    // Including the toast object can cause unnecessary
    // effect executions if the context object changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.studentId]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />

          <p className="mt-4 text-sm text-ink-400">
            Loading student report...
          </p>

        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (errorMessage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="card w-full max-w-lg p-8 text-center">

          <div className="mx-auto h-12 w-12 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center">
            <Icon.results size={22} />
          </div>

          <h1 className="mt-4 text-xl font-bold text-ink-900">
            Unable to load student report
          </h1>

          <p className="mt-2 text-sm text-ink-500">
            {errorMessage}
          </p>

          <div className="mt-5 flex justify-center gap-3">

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>

            <Link
              href="/results"
              className="btn-outline"
            >
              Back to Results
            </Link>

          </div>

        </div>
      </div>
    );
  }

  /* =====================================================
     NO DATA
  ===================================================== */

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="card max-w-sm p-10 text-center">

          <p className="text-ink-500">
            No result found.
          </p>

          <Link
            href="/results"
            className="btn-primary inline-flex mt-5"
          >
            Back to Results
          </Link>

        </div>
      </div>
    );
  }

  /* =====================================================
     DATA
  ===================================================== */

  const student = data.student || {};
  const summary = data.summary || {};
  const results = Array.isArray(data.results)
    ? data.results
    : [];

  /* =====================================================
     TIME FORMAT
  ===================================================== */

  function formatTime(seconds) {
    const totalSeconds =
      Number(seconds) || 0;

    const minutes =
      Math.floor(totalSeconds / 60);

    const remainingSeconds =
      totalSeconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }

  /* =====================================================
     TOGGLE TEST
  ===================================================== */

  function toggleTest(resultId) {
    const id = String(resultId);

    setOpenTest((current) =>
      current === id ? null : id
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="space-y-6">

      {/* =================================================
          BACK
      ================================================= */}

      <Link
        href="/results"
        className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-cyan-600 transition"
      >
        <Icon.arrowLeft size={16} />
        Back to Results
      </Link>


      {/* =================================================
          STUDENT HEADER
      ================================================= */}

      <div className="card p-6">

        <div className="flex flex-wrap items-start justify-between gap-5">

          <div>

            <p className="text-xs uppercase tracking-widest font-bold text-cyan-600">
              Student Result Report
            </p>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mt-1">
              {student.fullName ||
                "Unknown Student"}
            </h1>

            <div className="mt-3 space-y-1 text-sm">

              <p className="text-ink-400">
                Roll No.{" "}
                <span className="text-ink-700 font-medium">
                  {student.rollNumber || "—"}
                </span>
              </p>

              <p className="text-ink-400">
                Email{" "}
                <span className="text-ink-700 font-medium">
                  {student.email || "—"}
                </span>
              </p>

              <p className="text-ink-400">
                Year{" "}
                <span className="text-ink-700 font-medium">
                  {student.year || "—"}
                </span>
              </p>

            </div>

          </div>


          <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">

            <p className="text-xs text-ink-400">
              Tests Completed
            </p>

            <p className="text-2xl font-extrabold text-ink-900">
              {summary.attemptedTests || 0}
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <SummaryCard
          label="Tests Completed"
          value={`${summary.attemptedTests || 0}`}
          icon={<Icon.check size={18} />}
        />

        <SummaryCard
          label="Overall Score"
          value={`${summary.score || 0}/${summary.totalMarks || 0}`}
          icon={<Icon.analytics size={18} />}
        />

        <SummaryCard
          label="Overall Percentage"
          value={`${summary.percentage || 0}%`}
          icon={<Icon.results size={18} />}
        />

        <SummaryCard
          label="Total Time"
          value={formatTime(summary.timeTaken)}
          icon={<Icon.clock size={18} />}
        />

      </div>


      {/* =================================================
          PERFORMANCE
      ================================================= */}

      <div className="card overflow-hidden">

        <div className="p-5 border-b border-line">

          <h2 className="font-bold text-lg text-ink-900">
            Domain / Test Performance
          </h2>

          <p className="text-sm text-ink-400 mt-1">
            Click a test to view the detailed question report.
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="text-left text-xs uppercase tracking-wide text-ink-400 border-b border-line">

                <th className="p-4 font-semibold">
                  Test
                </th>

                <th className="p-4 font-semibold">
                  Correct
                </th>

                <th className="p-4 font-semibold">
                  Wrong
                </th>

                <th className="p-4 font-semibold">
                  Score
                </th>

                <th className="p-4 font-semibold">
                  %
                </th>

                <th className="p-4 font-semibold">
                  Time
                </th>

                <th className="p-4 font-semibold">
                  Status
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-line">

              {results.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-sm text-ink-400"
                  >
                    No test results found.
                  </td>
                </tr>
              )}


              {results.map((result) => {

                const resultId =
                  String(
                    result.resultId
                  );

                const isOpen =
                  openTest === resultId;

                return (
                  <React.Fragment
                    key={resultId}
                  >

                    {/* TEST ROW */}

                    <tr
                      onClick={() =>
                        toggleTest(resultId)
                      }
                      className="cursor-pointer hover:bg-slate-50 transition"
                    >

                      <td className="p-4">

                        <div className="flex items-center gap-2">

                          <span className="w-5 text-ink-400 text-lg">
                            {isOpen
                              ? "⌄"
                              : "›"}
                          </span>

                          <span className="font-semibold text-ink-900">
                            {result.test?.name ||
                              "Unknown Test"}
                          </span>

                        </div>

                      </td>


                      <td className="p-4 font-semibold text-success-600">
                        {result.correct ?? 0}
                      </td>


                      <td className="p-4 font-semibold text-danger-600">
                        {result.wrong ?? 0}
                      </td>


                      <td className="p-4 font-mono font-semibold">
                        {result.score ?? 0}/
                        {result.totalMarks ?? 0}
                      </td>


                      <td className="p-4 font-mono font-semibold">
                        {result.percentage ?? 0}%
                      </td>


                      <td className="p-4 text-xs text-ink-400">
                        {formatTime(
                          result.timeTaken
                        )}
                      </td>


                      <td className="p-4">

                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                          {result.selectionStatus ||
                            "Pending"}
                        </span>

                      </td>

                    </tr>


                    {/* =================================================
                        DETAILS
                    ================================================= */}

                    {isOpen && (
                      <tr>

                        <td
                          colSpan={7}
                          className="bg-slate-50 p-5"
                        >

                          <div className="space-y-4">

                            {Array.isArray(
                              result.questions
                            ) &&
                              result.questions.map(
                                (
                                  question,
                                  index
                                ) => (
                                  <QuestionCard
                                    key={String(
                                      question.questionId
                                    )}
                                    question={
                                      question
                                    }
                                    index={
                                      index + 1
                                    }
                                  />
                                )
                              )}


                            {(!Array.isArray(
                              result.questions
                            ) ||
                              result.questions
                                .length === 0) && (
                              <div className="rounded-xl border border-line bg-white p-8 text-center">

                                <p className="text-sm text-ink-400">
                                  Detailed question data is not available for this attempt.
                                </p>

                              </div>
                            )}

                          </div>

                        </td>

                      </tr>
                    )}

                  </React.Fragment>
                );
              })}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
}) {
  return (
    <div className="card p-5">

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-xs uppercase tracking-wide text-ink-400 font-semibold">
            {label}
          </p>

          <p className="text-xl font-extrabold text-ink-900 mt-2">
            {value}
          </p>

        </div>

        <div className="h-10 w-10 shrink-0 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
          {icon}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   QUESTION CARD
========================================================= */

function QuestionCard({
  question,
  index,
}) {
  const selected =
    question.selectedOption;

  const correct =
    question.correctAnswer;

  const status =
    question.status;

  const options = Object.entries(
    question.options || {}
  );

  return (
    <div className="rounded-xl border border-line bg-white p-5">

      {/* QUESTION */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div className="flex-1">

          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
            Question {index}
          </p>

          <p className="mt-2 font-semibold text-ink-900 leading-relaxed">
            {question.question}
          </p>

        </div>

        <QuestionStatus
          status={status}
        />

      </div>


      {/* MARKS */}

      <p className="text-xs text-ink-400 mt-3">
        Marks:{" "}
        <span className="font-semibold text-ink-600">
          {question.marks}
        </span>
      </p>


      {/* OPTIONS */}

      <div className="mt-4 grid gap-2">

        {options.map(
          ([key, value]) => {

            const isSelected =
              selected === key;

            const isCorrect =
              correct === key;

            let containerClass =
              "border-line bg-white";

            let keyClass =
              "bg-slate-100 text-ink-600";

            if (isCorrect) {
              containerClass =
                "border-success-200 bg-success-50";

              keyClass =
                "bg-success-100 text-success-700";
            }

            if (
              isSelected &&
              !isCorrect
            ) {
              containerClass =
                "border-danger-200 bg-danger-50";

              keyClass =
                "bg-danger-100 text-danger-700";
            }

            return (
              <div
                key={key}
                className={`rounded-lg border p-3 ${containerClass}`}
              >

                <div className="flex items-start gap-3">

                  <span
                    className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-xs font-bold ${keyClass}`}
                  >
                    {key}
                  </span>

                  <span className="text-sm text-ink-700 flex-1 pt-1">
                    {value}
                  </span>

                  <div className="flex flex-col items-end gap-1 text-[10px] font-semibold uppercase">

                    {isSelected && (
                      <span className="text-ink-500">
                        Student Answer
                      </span>
                    )}

                    {isCorrect && (
                      <span className="text-success-600">
                        Correct Answer
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>


      {/* EXPLANATION */}

      {question.explanation && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">

          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
            Explanation
          </p>

          <p className="text-sm text-ink-600 mt-1 leading-relaxed">
            {question.explanation}
          </p>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   QUESTION STATUS
========================================================= */

function QuestionStatus({
  status,
}) {
  if (status === "Correct") {
    return (
      <span className="inline-flex rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-600">
        Correct
      </span>
    );
  }

  if (status === "Wrong") {
    return (
      <span className="inline-flex rounded-full bg-danger-50 px-3 py-1 text-xs font-semibold text-danger-600">
        Wrong
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-500">
      Unanswered
    </span>
  );
}