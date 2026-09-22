"use client";

import React, {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client.js";

import { useToast } from "@/context/ToastContext.jsx";

import { Icon } from "@/components/Icons.jsx";

import Badge from "@/components/Badge.jsx";

import EmptyState from "@/components/EmptyState.jsx";

import { SkeletonCard } from "@/components/Skeleton.jsx";

export default function AvailableTests() {
  const [available, setAvailable] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [startingTestId, setStartingTestId] =
    useState(null);

  const router = useRouter();

  const toast = useToast();


  /* =====================================================
     LOAD AVAILABLE TESTS
  ===================================================== */

  useEffect(() => {
    async function loadTests() {
      try {
        const data =
          await api.get(
            "/attempts/available"
          );

        setAvailable(data);

      } catch (err) {
        toast.error(
          err?.message ||
            "Failed to load available tests."
        );

      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, []);


  /* =====================================================
     START / CONTINUE SELECTED TEST
  ===================================================== */

  async function handleStart(testId) {
    if (!testId) {
      toast.error(
        "Invalid test selected."
      );

      return;
    }

    setStarting(true);
    setStartingTestId(testId);

    try {
      /*
       * We do NOT start the test here.
       *
       * We pass the selected test ID to /test.
       *
       * Example:
       * /test?testId=68abc123...
       */

      router.push(
        `/test?testId=${encodeURIComponent(
          testId
        )}`
      );

    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to open the test."
      );

      setStarting(false);
      setStartingTestId(null);
    }
  }


  /* =====================================================
     ALL TESTS
  ===================================================== */

  const tests = Array.isArray(
    available?.tests
  )
    ? available.tests
    : [];


  /* =====================================================
     SEARCH
  ===================================================== */

  const filtered = tests.filter(
    (test) =>
      String(test?.name || "")
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
            Available Tests
          </h1>

          <p className="mt-1 text-ink-400">
            Tests configured by the administrator
            for your academic year.
          </p>
        </div>


        <div className="relative max-w-sm">

          <Icon.search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search tests..."
            className="input pl-10"
          />

        </div>


        <div className="grid gap-4 sm:grid-cols-2">

          {Array.from({
            length: 4,
          }).map((_, i) => (
            <SkeletonCard
              key={i}
            />
          ))}

        </div>

      </div>
    );
  }


  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
          Available Tests
        </h1>

        <p className="mt-1 text-ink-400">
          Tests configured by the administrator
          for your academic year.
        </p>

      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="relative max-w-sm">

        <Icon.search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search tests..."
          className="input pl-10"
        />

      </div>


      {/* =================================================
          NO TESTS
      ================================================= */}

      {filtered.length === 0 && (
        <div className="card">

          <EmptyState
            icon={
              <Icon.tests
                size={22}
              />
            }
            title="No tests found"
            description={
              available?.message ||
              "No questions have been added for this test yet. Please contact the administrator."
            }
          />

        </div>
      )}


      {/* =================================================
          TEST CARDS
      ================================================= */}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">

          {filtered.map(
            (test, index) => {

              const isInProgress =
                test.attemptStatus ===
                "InProgress";

              const isCompleted =
                Boolean(
                  test.attemptStatus
                ) &&
                !isInProgress;

              const isStarting =
                starting &&
                startingTestId ===
                  test.id;

              return (
                <div
                  key={test.id}
                  className="card group relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >

                  {/* =================================================
                      TOP ACCENT
                  ================================================= */}

                  <div
                    className={`absolute inset-x-0 top-0 h-1 ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isInProgress
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                    }`}
                  />


                  {/* =================================================
                      HEADER
                  ================================================= */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 items-start gap-3">

                      {/* TEST NUMBER */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-sm font-extrabold text-white">
                        {index + 1}
                      </div>


                      {/* TEST NAME */}

                      <div className="min-w-0">

                        <h3 className="truncate font-bold text-ink-900">
                          {test.name ||
                            `Test Part ${
                              index + 1
                            }`}
                        </h3>

                        <p className="mt-1 text-xs text-ink-400">
                          {test.year}
                        </p>

                      </div>

                    </div>


                    {/* STATUS */}

                    <Badge>
                      {isInProgress
                        ? "In Progress"
                        : isCompleted
                        ? "Completed"
                        : "Available"}
                    </Badge>

                  </div>


                  {/* =================================================
                      TEST DETAILS
                  ================================================= */}

                  <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">

                    <div>
                      <dt className="text-xs text-ink-400">
                        Questions
                      </dt>

                      <dd className="mt-1 font-bold text-ink-900">
                        {test.numberOfQuestions ??
                          0}
                      </dd>
                    </div>


                    <div>
                      <dt className="text-xs text-ink-400">
                        Duration
                      </dt>

                      <dd className="mt-1 font-bold text-ink-900">
                        {test.duration ??
                          0}

                        <span className="ml-1 font-normal text-ink-400">
                          min
                        </span>
                      </dd>
                    </div>


                    <div>
                      <dt className="text-xs text-ink-400">
                        Marks
                      </dt>

                      <dd className="mt-1 font-bold text-ink-900">
                        {test.totalMarks ??
                          0}
                      </dd>
                    </div>

                  </dl>


                  {/* =================================================
                      NEGATIVE MARKING
                  ================================================= */}

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">

                    <span className="text-xs text-ink-400">
                      Negative Marking
                    </span>

                    <span className="text-xs font-bold text-ink-700">
                      {test.negativeMarking
                        ? "Enabled"
                        : "Disabled"}
                    </span>

                  </div>


                  {/* =================================================
                      ACTION
                  ================================================= */}

                  <div className="mt-5">

                    {isInProgress ? (

                      <button
                        onClick={() =>
                          handleStart(
                            test.id
                          )
                        }
                        disabled={starting}
                        className="btn-accent w-full"
                      >
                        {isStarting
                          ? "Opening..."
                          : "Continue Test"}
                      </button>

                    ) : isCompleted ? (

                      <button
                        disabled
                        className="btn-outline w-full cursor-not-allowed opacity-60"
                      >
                        Already Completed
                      </button>

                    ) : (

                      <button
                        onClick={() =>
                          handleStart(
                            test.id
                          )
                        }
                        disabled={starting}
                        className="btn-accent w-full"
                      >
                        {isStarting
                          ? "Opening..."
                          : "Start Test"}
                      </button>

                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}


      {/* =================================================
          TEST COUNT
      ================================================= */}

      {filtered.length > 0 && (
        <div className="text-center text-xs text-ink-400">

          Showing{" "}

          <span className="font-bold text-ink-700">
            {filtered.length}
          </span>{" "}

          {filtered.length === 1
            ? "test"
            : "tests"}

        </div>
      )}

    </div>
  );
}