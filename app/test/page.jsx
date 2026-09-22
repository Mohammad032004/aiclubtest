"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { api } from "@/lib/api-client.js";

import { useToast } from "@/context/ToastContext.jsx";

import { Icon } from "@/components/Icons.jsx";

import ConfirmDialog from "@/components/ConfirmDialog.jsx";

import ProtectedRoute from "@/components/ProtectedRoute.jsx";


/* =========================================================
   TEST PAGE
========================================================= */

export default function TestPage() {
  return (
    <ProtectedRoute role="student">
      <TestRunner />
    </ProtectedRoute>
  );
}


/* =========================================================
   COUNTDOWN
========================================================= */

function useCountdown(
  expiresAt,
  onExpire,
  onLowTime
) {
  const [remaining, setRemaining] =
    useState(0);

  const firedRef = useRef(false);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;

    function tick() {
      const ms =
        new Date(expiresAt).getTime() -
        Date.now();

      const secs = Math.max(
        0,
        Math.floor(ms / 1000)
      );

      setRemaining(secs);

      if (
        secs <= 60 &&
        secs > 0 &&
        !warnedRef.current
      ) {
        warnedRef.current = true;

        onLowTime?.();
      }

      if (
        secs <= 0 &&
        !firedRef.current
      ) {
        firedRef.current = true;

        onExpire();
      }
    }

    tick();

    const id = setInterval(
      tick,
      1000
    );

    return () =>
      clearInterval(id);
  }, [expiresAt]);

  return remaining;
}


/* =========================================================
   STATUS
========================================================= */

const STATUS = {
  ANSWERED: "answered",
  REVIEW: "review",
  UNANSWERED: "unanswered",
};


/* =========================================================
   TEST RUNNER
========================================================= */

function TestRunner() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const toast = useToast();

  const [state, setState] =
    useState(null);

  const [answers, setAnswers] =
    useState({});

  const [marked, setMarked] =
    useState({});

  const [current, setCurrent] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [confirmSubmit, setConfirmSubmit] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);


  /* =====================================================
     SELECTED TEST ID
  ===================================================== */

  const testId =
    searchParams.get("testId");


  /* =====================================================
     START SELECTED TEST
  ===================================================== */

  useEffect(() => {
    async function boot() {
      try {
        /*
         * The Available Tests page will send:
         *
         * /test?testId=XXXXXXXX
         *
         * Therefore we start EXACTLY that test.
         */

        if (!testId) {
          toast.error(
            "No test was selected."
          );

          router.push(
            "/available-tests"
          );

          return;
        }


        /* ===============================================
           START / RESUME SELECTED TEST
        =============================================== */

        const started =
          await api.post(
            "/attempts/start",
            {
              testId,
            }
          );


        /* ===============================================
           SAVE TEST STATE
        =============================================== */

        setState({
          ...started,
          testId,
        });


        /* ===============================================
           RESTORE ANSWERS
        =============================================== */

        const map = {};

        if (
          Array.isArray(
            started.answers
          )
        ) {
          started.answers.forEach(
            (answer) => {
              map[
                answer.questionId
              ] =
                answer.selectedOption;
            }
          );
        }

        setAnswers(map);

      } catch (err) {
        toast.error(
          err?.message ||
            "Unable to start the test."
        );

        router.push(
          "/available-tests"
        );
      } finally {
        setLoading(false);
      }
    }

    /*
     * Don't run until Next.js has
     * provided the search parameters.
     */

    if (testId) {
      boot();
    } else {
      setLoading(false);
    }

  }, [testId]);


  /* =====================================================
     WARN BEFORE LEAVING TEST
  ===================================================== */

  useEffect(() => {
    function beforeUnload(e) {
      if (!state) return;

      e.preventDefault();

      e.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      beforeUnload
    );

    return () =>
      window.removeEventListener(
        "beforeunload",
        beforeUnload
      );
  }, [state]);


  /* =====================================================
     SUBMIT TEST
  ===================================================== */

  async function doSubmit(auto = false) {
    if (!state) return;

    setSubmitting(true);

    try {
      const res =
        await api.post(
          `/attempts/${state.attemptId}/submit`,
          {}
        );

      sessionStorage.setItem(
        "testResultSummary",
        JSON.stringify({
          summary: res.summary,
          auto,
        })
      );

      router.push("/result");

    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to submit the test."
      );

      setSubmitting(false);
    }
  }


  /* =====================================================
     COUNTDOWN
  ===================================================== */

  const remaining =
    useCountdown(
      state?.expiresAt,

      () => doSubmit(true),

      () =>
        toast.info(
          "Less than a minute remaining — your test will auto-submit at zero."
        )
    );


  /* =====================================================
     SELECT OPTION
  ===================================================== */

  async function selectOption(
    questionId,
    option
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));

    try {
      await api.patch(
        `/attempts/${state.attemptId}/answer`,
        {
          questionId,
          selectedOption: option,
        }
      );

    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to save answer."
      );
    }
  }


  /* =====================================================
     CLEAR ANSWER
  ===================================================== */

  async function clearAnswer(
    questionId
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: null,
    }));

    try {
      await api.patch(
        `/attempts/${state.attemptId}/answer`,
        {
          questionId,
          selectedOption: null,
        }
      );

    } catch (err) {
      toast.error(
        err?.message ||
          "Unable to clear answer."
      );
    }
  }


  /* =====================================================
     MARK FOR REVIEW
  ===================================================== */

  function toggleMark(
    questionId
  ) {
    setMarked((previous) => ({
      ...previous,
      [questionId]:
        !previous[questionId],
    }));
  }


  /* =====================================================
     QUESTION COUNTS
  ===================================================== */

  const totalQuestions =
    state?.questions?.length || 0;

  const answeredCount =
    useMemo(
      () =>
        Object.values(
          answers
        ).filter(Boolean).length,
      [answers]
    );


  /* =====================================================
     LOADING SCREEN
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">

        <div className="text-center text-white">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />

          <p className="text-sm text-slate-400">
            Preparing your test...
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     NO STATE
  ===================================================== */

  if (!state) {
    return null;
  }


  /* =====================================================
     TIMER
  ===================================================== */

  const mins =
    Math.floor(
      remaining / 60
    )
      .toString()
      .padStart(2, "0");

  const secs =
    (remaining % 60)
      .toString()
      .padStart(2, "0");

  const isLow =
    remaining <= 60;


  /* =====================================================
     CURRENT QUESTION
  ===================================================== */

  const q =
    state.questions[current];


  const progressPct =
    totalQuestions > 0
      ? Math.round(
          ((current + 1) /
            totalQuestions) *
            100
        )
      : 0;


  /* =====================================================
     OPTIONS
  ===================================================== */

  const OPTIONS = [
    ["A", q.optionA],
    ["B", q.optionB],
    ["C", q.optionC],
    ["D", q.optionD],
  ];


  /* =====================================================
     QUESTION STATUS
  ===================================================== */

  function statusFor(qq) {
    if (
      marked[qq.questionId]
    ) {
      return STATUS.REVIEW;
    }

    if (
      answers[qq.questionId]
    ) {
      return STATUS.ANSWERED;
    }

    return STATUS.UNANSWERED;
  }


  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="flex min-h-screen flex-col bg-surface">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <header className="sticky top-0 z-20 bg-navy-950 text-white">

        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          {/* BRAND */}

          <div className="flex min-w-0 items-center gap-2">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cyan-500 p-1">

              <img
                src="/ai-club-logo.png"
                alt="AI Club"
                className="h-full w-full object-contain"
              />

            </div>

            <p className="truncate text-sm font-bold">

              AI CLUB{" "}

              <span className="font-medium text-slate-400">
                | Recruitment Test
              </span>

            </p>

          </div>


          {/* TIMER */}

          <div
            className={`flex shrink-0 items-center gap-2 font-mono text-lg font-bold ${
              isLow
                ? "animate-pulse text-danger-400"
                : "text-white"
            }`}
          >

            <Icon.clock size={17} />

            {mins}:{secs}

          </div>

        </div>


        {/* PROGRESS */}

        <div className="mx-auto max-w-4xl px-4 pb-3 sm:px-6">

          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">

            <span>
              Question{" "}
              {current + 1}{" "}
              of{" "}
              {totalQuestions}
            </span>

            <span>
              {answeredCount} answered
            </span>

          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-1.5 rounded-full bg-cyan-500 transition-all duration-300"
              style={{
                width: `${progressPct}%`,
              }}
            />

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-4 py-6 sm:px-6">

        {/* =================================================
            QUESTION NAVIGATOR
        ================================================= */}

        <div className="flex flex-wrap gap-2">

          {state.questions.map(
            (qq, i) => {

              const s =
                statusFor(qq);

              const cls =
                i === current
                  ? "bg-navy-950 text-white ring-2 ring-cyan-400"
                  : s ===
                    STATUS.REVIEW
                  ? "bg-warning-50 text-warning-600 border border-warning-500/30"
                  : s ===
                    STATUS.ANSWERED
                  ? "bg-success-50 text-success-600 border border-success-500/30"
                  : "bg-white text-ink-400 border border-line";

              return (
                <button
                  key={
                    qq.questionId
                  }
                  onClick={() =>
                    setCurrent(i)
                  }
                  className={`focus-ring h-9 w-9 rounded-lg text-xs font-mono font-bold transition ${cls}`}
                >
                  {i + 1}
                </button>
              );
            }
          )}

        </div>


        {/* =================================================
            LEGEND
        ================================================= */}

        <div className="flex flex-wrap gap-4 text-xs text-ink-400">

          <Legend
            swatch="bg-success-50 border border-success-500/30"
            label="Answered"
          />

          <Legend
            swatch="bg-warning-50 border border-warning-500/30"
            label="Marked for review"
          />

          <Legend
            swatch="bg-white border border-line"
            label="Unanswered"
          />

        </div>


        {/* =================================================
            QUESTION CARD
        ================================================= */}

        <div className="card p-6 sm:p-8">

          <div className="mb-4 flex items-center justify-between">

            <span className="text-xs font-mono font-semibold text-ink-400">

              Question{" "}
              {current + 1}

              {" · "}

              {q.marks} mark
              {q.marks > 1
                ? "s"
                : ""}

            </span>

            {marked[
              q.questionId
            ] && (
              <span className="flex items-center gap-1 text-xs font-semibold text-warning-600">

                <Icon.flag size={13} />

                Marked

              </span>
            )}

          </div>


          {/* QUESTION */}

          <p className="text-lg font-semibold leading-relaxed text-ink-900 sm:text-xl">
            {q.question}
          </p>


          {/* OPTIONS */}

          <div className="mt-6 space-y-3">

            {OPTIONS.map(
              ([letter, text]) => {

                const selected =
                  answers[
                    q.questionId
                  ] === letter;

                return (
                  <button
                    key={letter}
                    onClick={() =>
                      selectOption(
                        q.questionId,
                        letter
                      )
                    }
                    className={`focus-ring flex w-full items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-line hover:border-cyan-500/40 hover:bg-slate-50"
                    }`}
                  >

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        selected
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-100 text-ink-600"
                      }`}
                    >
                      {letter}
                    </span>

                    <span className="pt-0.5 text-[15px] text-ink-900">
                      {text}
                    </span>

                  </button>
                );
              }
            )}

          </div>

        </div>


        {/* =================================================
            CONTROLS
        ================================================= */}

        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* PREVIOUS */}

          <button
            disabled={current === 0}
            onClick={() =>
              setCurrent(
                (c) => c - 1
              )
            }
            className="btn-outline disabled:opacity-40"
          >
            <Icon.chevronLeft
              size={16}
            />

            Previous
          </button>


          {/* MIDDLE */}

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() =>
                toggleMark(
                  q.questionId
                )
              }
              className="btn-outline"
            >
              <Icon.flag
                size={15}
              />

              {marked[
                q.questionId
              ]
                ? "Unmark"
                : "Mark for Review"}
            </button>


            <button
              onClick={() =>
                clearAnswer(
                  q.questionId
                )
              }
              disabled={
                !answers[
                  q.questionId
                ]
              }
              className="btn-outline disabled:opacity-40"
            >
              <Icon.x size={15} />

              Clear Answer
            </button>

          </div>


          {/* NEXT / SUBMIT */}

          {current <
          totalQuestions - 1 ? (
            <button
              onClick={() =>
                setCurrent(
                  (c) => c + 1
                )
              }
              className="btn-primary"
            >
              Next

              <Icon.chevronRight
                size={16}
              />
            </button>
          ) : (
            <button
              onClick={() =>
                setConfirmSubmit(
                  true
                )
              }
              className="btn-accent"
            >
              Submit Test
            </button>
          )}

        </div>


        {/* =================================================
            SUBMIT NOW
        ================================================= */}

        <div className="pt-2 text-center">

          <button
            onClick={() =>
              setConfirmSubmit(
                true
              )
            }
            className="focus-ring text-xs font-semibold text-danger-600 hover:underline"
          >
            Submit test now
          </button>

        </div>

      </main>


      {/* =================================================
          CONFIRM SUBMIT
      ================================================= */}

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit your test?"
        message={`You have answered ${answeredCount} of ${totalQuestions} questions${
          Object.values(marked).some(
            Boolean
          )
            ? `, with ${
                Object.values(
                  marked
                ).filter(Boolean).length
              } marked for review`
            : ""
        }. Once submitted, you cannot make further changes.`}
        confirmLabel={
          submitting
            ? "Submitting..."
            : "Submit"
        }
        onConfirm={() =>
          doSubmit(false)
        }
        onCancel={() =>
          setConfirmSubmit(false)
        }
      />

    </div>
  );
}


/* =========================================================
   LEGEND
========================================================= */

function Legend({
  swatch,
  label,
}) {
  return (
    <span className="flex items-center gap-1.5">

      <span
        className={`h-3 w-3 rounded ${swatch}`}
      />

      {label}

    </span>
  );
}