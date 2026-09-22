"use client";

import React, {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api-client.js";

import { Icon } from "@/components/Icons.jsx";

import Badge from "@/components/Badge.jsx";

import EmptyState from "@/components/EmptyState.jsx";

import { SkeletonLine } from "@/components/Skeleton.jsx";


/* =========================================================
   DATE FORMAT
========================================================= */

function fmtDate(d) {
  if (!d) return "—";

  return new Date(d).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


/* =========================================================
   MY TESTS
========================================================= */

export default function MyTests() {
  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const router = useRouter();


  /* =====================================================
     LOAD TEST HISTORY
  ===================================================== */

  useEffect(() => {
    api
      .get("/attempts/history")
      .then(setHistory)
      .finally(() =>
        setLoading(false)
      );
  }, []);


  /* =====================================================
     RESUME TEST
  ===================================================== */

  function handleResume(testId) {
    if (!testId) {
      return;
    }

    router.push(
      `/test?testId=${encodeURIComponent(
        testId
      )}`
    );
  }


  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
          My Tests
        </h1>

        <p className="mt-1 text-ink-400">
          Every test you've started or completed.
        </p>
      </div>


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="card divide-y divide-line">

          {Array.from({
            length: 4,
          }).map((_, i) => (
            <div
              key={i}
              className="p-4"
            >
              <SkeletonLine
                className="mb-2 w-1/3"
              />

              <SkeletonLine
                className="w-1/4"
              />
            </div>
          ))}

        </div>
      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {!loading &&
        history.length === 0 && (
          <div className="card">

            <EmptyState
              icon={
                <Icon.bank
                  size={22}
                />
              }
              title="No tests yet"
              description="Once you start a test, it will appear here."
            />

          </div>
        )}


      {/* =================================================
          HISTORY
      ================================================= */}

      {!loading &&
        history.length > 0 && (
          <div className="card divide-y divide-line overflow-hidden">

            {history.map((h) => {

              const pct =
                h.test.totalMarks >
                0
                  ? Math.round(
                      (h.score /
                        h.test
                          .totalMarks) *
                        100
                    )
                  : null;

              const isInProgress =
                h.status ===
                "InProgress";

              return (
                <div
                  key={h.attemptId}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"
                >

                  {/* =================================================
                      TEST INFORMATION
                  ================================================= */}

                  <div className="min-w-0">

                    <p className="font-bold text-ink-900">
                      {h.test.name}
                    </p>

                    <p className="mt-0.5 text-xs text-ink-400">
                      {h.test.year}
                      {" · "}
                      Started{" "}
                      {fmtDate(
                        h.startedAt
                      )}
                    </p>

                  </div>


                  {/* =================================================
                      RIGHT SIDE
                  ================================================= */}

                  <div className="flex items-center gap-4">

                    {/* SCORE */}

                    {!isInProgress &&
                      pct !== null && (
                        <span className="text-sm font-mono font-bold text-ink-900">

                          {h.score}/
                          {
                            h.test
                              .totalMarks
                          }

                          <span className="font-normal text-ink-400">
                            {" "}
                            ({pct}%)
                          </span>

                        </span>
                      )}


                    {/* STATUS */}

                    <Badge>
                      {isInProgress
                        ? "In Progress"
                        : "Completed"}
                    </Badge>


                    {/* =================================================
                        RESUME
                    ================================================= */}

                    {isInProgress ? (

                      <button
                        onClick={() =>
                          handleResume(
                            h.test.id
                          )
                        }
                        className="btn-accent px-3.5 py-2 text-xs"
                      >
                        Resume
                      </button>

                    ) : (

                      /* =================================================
                         VIEW RESULT
                      ================================================= */

                      <button
                        onClick={() =>
                          router.push(
                            "/my-results"
                          )
                        }
                        className="btn-outline px-3.5 py-2 text-xs"
                      >
                        View Result
                      </button>

                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

    </div>
  );
}