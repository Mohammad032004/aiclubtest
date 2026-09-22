"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";

import { api } from "@/lib/api-client.js";

import { Icon } from "@/components/Icons.jsx";

import DonutChart from "@/components/charts/DonutChart.jsx";

import ProtectedRoute from "@/components/ProtectedRoute.jsx";

import { useToast } from "@/context/ToastContext.jsx";


export default function ResultPage() {
  return (
    <ProtectedRoute role="student">
      <ResultInner />
    </ProtectedRoute>
  );
}


function ResultInner() {
  const toast = useToast();

  const [state, setState] =
    useState(undefined);

  /*
    undefined = still loading
    object    = result found
    null      = no result found
  */


  /* =====================================================
     LOAD RESULT
  ===================================================== */

  useEffect(() => {
    async function loadResult() {
      let sessionResult = null;

      /* ---------------------------------------------
         FIRST: CHECK SESSION STORAGE
      --------------------------------------------- */

      try {
        const raw =
          sessionStorage.getItem(
            "testResultSummary"
          );

        if (raw) {
          sessionResult =
            JSON.parse(raw);

          sessionStorage.removeItem(
            "testResultSummary"
          );
        }
      } catch (err) {
        console.error(
          "SESSION RESULT ERROR:",
          err
        );
      }


      /* ---------------------------------------------
         IF SESSION RESULT EXISTS
         USE IT IMMEDIATELY
      --------------------------------------------- */

      if (
        sessionResult &&
        sessionResult.summary
      ) {
        setState(
          sessionResult
        );

        return;
      }


      /* ---------------------------------------------
         FALLBACK: LOAD FROM DATABASE
      --------------------------------------------- */

      try {
        const data =
          await api.get(
            "/my-results"
          );

        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          const latest = data[0];

          setState({
            summary: {
              correct:
                latest.correct ?? 0,

              wrong:
                latest.wrong ?? 0,

              unanswered:
                latest.unanswered ?? 0,

              score:
                latest.score ?? 0,

              totalMarks:
                latest.totalMarks ?? 0,

              timeTaken:
                latest.timeTaken ?? 0,
            },

            test: latest.test,

            auto: false,
          });

          return;
        }

        setState(null);
      } catch (err) {
        console.error(
          "RESULT LOAD ERROR:",
          err
        );

        toast.error(
          err?.message ||
            "Unable to load result."
        );

        setState(null);
      }
    }

    loadResult();
  }, []);


  /* =====================================================
     LOADING
  ===================================================== */

  if (state === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">

        <div className="card w-full max-w-sm p-10 text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />

          <p className="mt-4 text-sm text-ink-400">
            Loading your result...
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     NO RESULT
  ===================================================== */

  if (!state?.summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">

        <div className="card max-w-sm p-10 text-center">

          <p className="text-ink-600">
            No recent submission found.
          </p>

          <Link
            href="/dashboard"
            className="btn-accent inline-flex mt-5"
          >
            Back to dashboard
          </Link>

        </div>

      </div>
    );
  }


  /* =====================================================
     SUMMARY
  ===================================================== */

  const summary =
    state.summary;

  const totalMarks =
    Number(
      summary.totalMarks
    ) || 0;

  const score =
    Number(
      summary.score
    ) || 0;

  const percentage =
    totalMarks > 0
      ? Math.round(
          (score /
            totalMarks) *
            100
        )
      : 0;


  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">

      <div className="w-full max-w-lg animate-fade-in">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="text-center mb-6">

          <div className="h-16 w-16 rounded-2xl bg-success-50 text-success-600 flex items-center justify-center mx-auto mb-4">

            <Icon.check
              size={28}
            />

          </div>

          <p className="text-xs font-bold tracking-widest text-cyan-600 uppercase">
            Test Complete
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mt-1">

            {state.auto
              ? "Time expired — submitted automatically"
              : "Your test has been submitted"}

          </h1>


          {/* TEST NAME */}

          {state.test?.name && (
            <p className="text-sm text-ink-400 mt-2">
              {state.test.name}
            </p>
          )}

        </div>


        {/* =================================================
            RESULT CARD
        ================================================= */}

        <div className="card p-8 text-center">

          <DonutChart
            size={180}
            thickness={16}
            centerValue={`${percentage}%`}
            centerLabel={`${score}/${totalMarks}`}
            segments={[
              {
                label: "Score",
                value: percentage,
                color:
                  percentage >= 70
                    ? "#10B981"
                    : percentage >= 40
                    ? "#F59E0B"
                    : "#EF4444",
              },

              {
                label: "Remaining",
                value:
                  Math.max(
                    0,
                    100 - percentage
                  ),
                color: "#F1F5F9",
              },
            ]}
          />


          {/* =================================================
              METRICS
          ================================================= */}

          <div className="mt-6 grid grid-cols-3 gap-3">

            <Metric
              label="Correct"
              value={
                summary.correct ??
                0
              }
              tone="text-success-600"
              bg="bg-success-50"
            />

            <Metric
              label="Wrong"
              value={
                summary.wrong ??
                0
              }
              tone="text-danger-600"
              bg="bg-danger-50"
            />

            <Metric
              label="Unanswered"
              value={
                summary.unanswered ??
                0
              }
              tone="text-ink-600"
              bg="bg-slate-100"
            />

          </div>

        </div>


        {/* =================================================
            TIME TAKEN
        ================================================= */}

        <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-ink-400">

          <Icon.clock
            size={14}
          />

          Time taken:{" "}

          {Math.floor(
            (summary.timeTaken ||
              0) / 60
          )}
          m{" "}

          {(summary.timeTaken ||
            0) % 60}
          s

        </div>


        {/* =================================================
            MESSAGE
        ================================================= */}

        <p className="text-center text-sm text-ink-400 mt-6">

          Results are reviewed by the AI Club administrator.
          You'll be notified separately about next steps.

        </p>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="grid gap-3 sm:grid-cols-2 mt-4">

          <Link
            href="/my-results"
            className="btn-primary w-full text-center"
          >
            View Detailed Results
          </Link>

          <Link
            href="/dashboard"
            className="btn-outline w-full text-center"
          >
            Back to Dashboard
          </Link>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   METRIC
========================================================= */

function Metric({
  label,
  value,
  tone,
  bg,
}) {
  return (
    <div
      className={`rounded-xl py-3.5 ${bg}`}
    >

      <p
        className={`text-xl font-extrabold ${tone}`}
      >
        {value}
      </p>

      <p className="text-[11px] text-ink-400 font-medium mt-0.5">
        {label}
      </p>

    </div>
  );
}