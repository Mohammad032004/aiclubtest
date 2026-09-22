"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api-client.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { useToast } from "@/context/ToastContext.jsx";

import { Icon } from "@/components/Icons.jsx";
import Badge from "@/components/Badge.jsx";
import EmptyState from "@/components/EmptyState.jsx";
import { SkeletonCard } from "@/components/Skeleton.jsx";


export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [available, setAvailable] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startingTestId, setStartingTestId] = useState(null);


  /* =====================================================
     LOAD DASHBOARD DATA
  ===================================================== */

  useEffect(() => {
    Promise.all([
      api.get("/attempts/available"),
      api.get("/attempts/history"),
    ])
      .then(([availableData, historyData]) => {
        setAvailable(availableData);
        setHistory(historyData);
      })
      .catch((err) => {
        toast.error(
          err?.message ||
            "Failed to load dashboard."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  /* =====================================================
     AVAILABLE TESTS
  ===================================================== */

  const tests = Array.isArray(available?.tests)
    ? available.tests
    : [];


  /* =====================================================
     START / RESUME TEST
  ===================================================== */

  function handleStart(testId) {
    if (!testId) {
      toast.error("Invalid test selected.");
      return;
    }

    setStarting(true);
    setStartingTestId(testId);

    router.push(
      `/test?testId=${encodeURIComponent(testId)}`
    );
  }


  /* =====================================================
     COMPLETED TESTS / SCORES
  ===================================================== */

  const completed = history.filter(
    (h) => h.status !== "InProgress"
  );

  const scores = completed.map((h) =>
    h.test.totalMarks > 0
      ? (h.score / h.test.totalMarks) * 100
      : 0
  );

  const bestScore = scores.length
    ? Math.round(Math.max(...scores))
    : null;

  const avgScore = scores.length
    ? Math.round(
        scores.reduce(
          (a, b) => a + b,
          0
        ) / scores.length
      )
    : null;


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="space-y-6">

        <SkeletonCard />

        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

      </div>
    );
  }


  return (
    <div className="space-y-8">

      {/* =================================================
          WELCOME
      ================================================= */}

      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
          Welcome back,{" "}
          {user?.fullName?.split(" ")[0]}
        </h1>

        <p className="mt-1 text-ink-400">
          Ready to test your skills and become part of the AI Club?
        </p>
      </div>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <Stat
          label="Tests Available"
          value={tests.length}
          icon={Icon.tests}
          tone="cyan"
        />

        <Stat
          label="Tests Completed"
          value={completed.length}
          icon={Icon.check}
          tone="success"
        />

        <Stat
          label="Best Score"
          value={
            bestScore !== null
              ? `${bestScore}%`
              : "—"
          }
          icon={Icon.trophy}
          tone="warning"
        />

        <Stat
          label="Average Score"
          value={
            avgScore !== null
              ? `${avgScore}%`
              : "—"
          }
          icon={Icon.analytics}
          tone="navy"
        />

      </div>


      {/* =================================================
          AVAILABLE TESTS
      ================================================= */}

      <div>

        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900">
              Available Tests
            </h2>

            <p className="mt-1 text-sm text-ink-400">
              Choose a test to begin your assessment.
            </p>
          </div>

          {tests.length > 0 && (
            <Link
              href="/available-tests"
              className="text-sm font-semibold text-cyan-600 hover:underline"
            >
              View all →
            </Link>
          )}
        </div>


        {/* =================================================
            NO TESTS
        ================================================= */}

        {tests.length === 0 && (
          <div className="card">

            <EmptyState
              icon={
                <Icon.tests size={22} />
              }
              title="No tests available yet"
              description={
                available?.message ||
                "No tests have been configured for your academic year yet."
              }
            />

          </div>
        )}


        {/* =================================================
            TEST CARDS
        ================================================= */}

        {tests.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">

            {tests.map((test, index) => {

              const isInProgress =
                test.attemptStatus ===
                "InProgress";

              const isCompleted =
                Boolean(test.attemptStatus) &&
                !isInProgress;

              const isStarting =
                starting &&
                startingTestId ===
                  String(test.id);

              return (
                <div
                  key={test.id}
                  className="relative overflow-hidden rounded-2xl bg-navy-950 p-6 text-white"
                >

                  {/* Background pattern */}

                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage:
                        "radial-gradient(#06B6D4 1px, transparent 1px)",
                      backgroundSize:
                        "20px 20px",
                    }}
                  />


                  <div className="relative">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="mb-3 flex items-center justify-between gap-3">

                      <div className="flex items-center gap-2">

                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                          {index + 1}
                        </span>

                        <Badge>
                          {isInProgress
                            ? "In Progress"
                            : isCompleted
                            ? "Completed"
                            : "Available"}
                        </Badge>

                      </div>

                      <span className="text-xs text-slate-400">
                        {test.year}
                      </span>

                    </div>


                    {/* =================================================
                        TEST NAME
                    ================================================= */}

                    <h3 className="text-xl font-extrabold sm:text-2xl">
                      {test.name}
                    </h3>


                    {/* =================================================
                        TEST DETAILS
                    ================================================= */}

                    <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">

                      <Detail
                        icon={Icon.bank}
                        label={`${test.numberOfQuestions} Questions`}
                      />

                      <Detail
                        icon={Icon.clock}
                        label={`${test.duration} Minutes`}
                      />

                      <Detail
                        icon={Icon.trophy}
                        label={`${test.totalMarks} Marks`}
                      />

                    </div>


                    {/* =================================================
                        ACTION
                    ================================================= */}

                    <div className="mt-7">

                      {isInProgress ? (

                        <button
                          onClick={() =>
                            handleStart(
                              test.id
                            )
                          }
                          disabled={
                            starting
                          }
                          className="btn-accent flex items-center gap-2 px-6 py-3"
                        >
                          {isStarting
                            ? "Opening..."
                            : "Resume Test"}

                          <Icon.chevronRight
                            size={16}
                          />
                        </button>

                      ) : isCompleted ? (

                        <div className="flex flex-wrap items-center gap-3">

                          <p className="text-sm font-medium text-success-400">
                            Test completed
                          </p>

                          <Link
                            href="/my-results"
                            className="text-sm font-semibold text-cyan-400 hover:underline"
                          >
                            View Result →
                          </Link>

                        </div>

                      ) : (

                        <button
                          onClick={() =>
                            handleStart(
                              test.id
                            )
                          }
                          disabled={
                            starting
                          }
                          className="btn-accent flex items-center gap-2 px-6 py-3"
                        >
                          {isStarting
                            ? "Starting..."
                            : "Start Test"}

                          <Icon.chevronRight
                            size={16}
                          />
                        </button>

                      )}

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>


      {/* =================================================
          RECENT ACTIVITY
      ================================================= */}

      {history.length > 0 && (
        <div>

          <div className="mb-3 flex items-center justify-between">

            <h2 className="text-lg font-bold text-ink-900">
              Recent activity
            </h2>

            <Link
              href="/my-tests"
              className="text-sm font-semibold text-cyan-600 hover:underline"
            >
              View all →
            </Link>

          </div>


          <div className="card divide-y divide-line overflow-hidden">

            {history
              .slice(0, 4)
              .map((h) => (
                <div
                  key={h.attemptId}
                  className="flex items-center justify-between gap-3 p-4"
                >

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-ink-900">
                      {h.test.name}
                    </p>

                    <p className="text-xs text-ink-400">
                      {h.test.year}
                    </p>

                  </div>

                  <Badge>
                    {h.status ===
                    "InProgress"
                      ? "In Progress"
                      : "Completed"}
                  </Badge>

                </div>
              ))}

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   STAT COMPONENT
========================================================= */

function Stat({
  label,
  value,
  icon: IconCmp,
  tone,
}) {
  const tones = {
    cyan:
      "bg-cyan-50 text-cyan-600",

    success:
      "bg-success-50 text-success-600",

    warning:
      "bg-warning-50 text-warning-600",

    navy:
      "bg-navy-900/5 text-navy-900",
  };

  return (
    <div className="card p-4 sm:p-5">

      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <IconCmp size={17} />
      </span>

      <p className="mt-3 text-2xl font-extrabold text-ink-900">
        {value}
      </p>

      <p className="mt-0.5 text-xs font-medium text-ink-400">
        {label}
      </p>

    </div>
  );
}


/* =========================================================
   TEST DETAIL COMPONENT
========================================================= */

function Detail({
  icon: IconCmp,
  label,
}) {
  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <IconCmp size={15} />
      {label}
    </span>
  );
}