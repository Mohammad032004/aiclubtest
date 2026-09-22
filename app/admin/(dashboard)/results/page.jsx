"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api-client.js";
import { useToast } from "@/context/ToastContext.jsx";

export default function ResultsPage() {
  const toast = useToast();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [testId, setTestId] = useState("");
  const [selectionStatus, setSelectionStatus] = useState("");
  const [minPercentage, setMinPercentage] = useState("");

  async function loadResults() {
    try {
      setLoading(true);

      const data = await api.get("/results");

      console.log("RESULTS DATA:", data);

      setResults(data?.results || data || []);
    } catch (error) {
      console.error("RESULTS ERROR:", error);

      toast.error(
        error?.message || "Unable to load results."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  /*
   * GROUP ALL RESULTS BY STUDENT
   */
  const students = useMemo(() => {
    const map = new Map();

    for (const result of results) {
      const student =
        result.studentId ||
        result.student ||
        null;

      if (!student) continue;

      const studentId =
        student._id ||
        student.id;

      if (!studentId) continue;

      const id = String(studentId);

      if (!map.has(id)) {
        map.set(id, {
          id,

          fullName:
            student.fullName ||
            student.name ||
            "Unknown Student",

          rollNumber:
            student.rollNumber ||
            student.rollNo ||
            "—",

          email:
            student.email ||
            "—",

          year:
            student.year ||
            "—",

          results: [],
        });
      }

      map.get(id).results.push(result);
    }

    return Array.from(map.values());
  }, [results]);

  /*
   * TEST LIST
   */
  const tests = useMemo(() => {
    const map = new Map();

    for (const result of results) {
      const test =
        result.testId ||
        result.test ||
        null;

      if (!test) continue;

      const id =
        test._id ||
        test.id;

      if (!id) continue;

      map.set(String(id), {
        id: String(id),
        name:
          test.name ||
          test.title ||
          "Unknown Test",
      });
    }

    return Array.from(map.values());
  }, [results]);

  /*
   * FILTER STUDENTS
   */
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const query =
        search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(student.fullName)
          .toLowerCase()
          .includes(query) ||
        String(student.rollNumber)
          .toLowerCase()
          .includes(query) ||
        String(student.email)
          .toLowerCase()
          .includes(query);

      const matchesTest =
        !testId ||
        student.results.some((result) => {
          const id =
            result.testId?._id ||
            result.testId?.id ||
            result.testId;

          return String(id) === String(testId);
        });

      const matchesStatus =
        !selectionStatus ||
        student.results.some(
          (result) =>
            result.selectionStatus ===
            selectionStatus
        );

      const matchesPercentage =
        !minPercentage ||
        student.results.some(
          (result) =>
            Number(result.percentage || 0) >=
            Number(minPercentage)
        );

      return (
        matchesSearch &&
        matchesTest &&
        matchesStatus &&
        matchesPercentage
      );
    });
  }, [
    students,
    search,
    testId,
    selectionStatus,
    minPercentage,
  ]);

  function getTotalScore(student) {
    return student.results.reduce(
      (sum, result) =>
        sum + Number(result.score || 0),
      0
    );
  }

  function getTotalMarks(student) {
    return student.results.reduce(
      (sum, result) =>
        sum + Number(result.totalMarks || 0),
      0
    );
  }

  function getAveragePercentage(student) {
    if (!student.results.length) {
      return 0;
    }

    const total =
      student.results.reduce(
        (sum, result) =>
          sum +
          Number(result.percentage || 0),
        0
      );

    return Math.round(
      (total / student.results.length) * 100
    ) / 100;
  }

  function getSelectedCount(student) {
    return student.results.filter(
      (result) =>
        result.selectionStatus ===
        "Selected"
    ).length;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-cyan-600">
            Results Management
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mt-1">
            Student Results
          </h1>

          <p className="text-sm text-ink-400 mt-1">
            View student performance and detailed test reports.
          </p>
        </div>

        <button
          type="button"
          onClick={loadResults}
          className="btn-secondary"
        >
          Refresh
        </button>

      </div>

      {/* FILTERS */}

      <div className="card p-5">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-2">
              Search Student
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Name, roll number or email"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-2">
              Test
            </label>

            <select
              value={testId}
              onChange={(e) =>
                setTestId(e.target.value)
              }
              className="input w-full"
            >
              <option value="">
                All Tests
              </option>

              {tests.map((test) => (
                <option
                  key={test.id}
                  value={test.id}
                >
                  {test.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-2">
              Selection Status
            </label>

            <select
              value={selectionStatus}
              onChange={(e) =>
                setSelectionStatus(
                  e.target.value
                )
              }
              className="input w-full"
            >
              <option value="">
                All Status
              </option>

              <option value="Selected">
                Selected
              </option>

              <option value="Not Selected">
                Not Selected
              </option>

              <option value="Pending">
                Pending
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-2">
              Minimum Percentage
            </label>

            <input
              type="number"
              min="0"
              max="100"
              value={minPercentage}
              onChange={(e) =>
                setMinPercentage(
                  e.target.value
                )
              }
              placeholder="e.g. 60"
              className="input w-full"
            />
          </div>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          label="Students"
          value={filteredStudents.length}
        />

        <StatCard
          label="Total Results"
          value={results.length}
        />

        <StatCard
          label="Tests"
          value={tests.length}
        />

        <StatCard
          label="Selected"
          value={filteredStudents.reduce(
            (sum, student) =>
              sum +
              getSelectedCount(student),
            0
          )}
        />

      </div>

      {/* TABLE */}

      <div className="card overflow-hidden">

        <div className="p-5 border-b border-line">

          <h2 className="font-bold text-lg text-ink-900">
            Student Performance
          </h2>

          <p className="text-sm text-ink-400 mt-1">
            Each student appears once. Open the report to view all tests and questions.
          </p>

        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />

              <p className="mt-4 text-sm text-ink-400">
                Loading results...
              </p>

            </div>

          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">

            <p className="text-ink-500">
              No student results found.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="text-left text-xs uppercase tracking-wide text-ink-400 border-b border-line">

                  <th className="p-4 font-semibold">
                    #
                  </th>

                  <th className="p-4 font-semibold">
                    Student
                  </th>

                  <th className="p-4 font-semibold">
                    Roll No.
                  </th>

                  <th className="p-4 font-semibold">
                    Year
                  </th>

                  <th className="p-4 font-semibold">
                    Attempts
                  </th>

                  <th className="p-4 font-semibold">
                    Score
                  </th>

                  <th className="p-4 font-semibold">
                    Average %
                  </th>

                  <th className="p-4 font-semibold">
                    Status
                  </th>

                  <th className="p-4 font-semibold">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-line">

                {filteredStudents.map(
                  (student, index) => {

                    const totalAttempts =
                      student.results.length;

                    const totalScore =
                      getTotalScore(student);

                    const totalMarks =
                      getTotalMarks(student);

                    const averagePercentage =
                      getAveragePercentage(
                        student
                      );

                    const selectedCount =
                      getSelectedCount(
                        student
                      );

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50 transition"
                      >

                        <td className="p-4 text-ink-400 font-medium">
                          {index + 1}
                        </td>

                        <td className="p-4">

                          <Link
                            href={`/results/${student.id}`}
                            className="group inline-flex flex-col"
                          >

                            <span className="font-semibold text-ink-900 group-hover:text-cyan-600 transition">
                              {student.fullName}
                            </span>

                            <span className="text-xs text-ink-400 mt-0.5">
                              {student.email}
                            </span>

                          </Link>

                        </td>

                        <td className="p-4 font-medium text-ink-700">
                          {student.rollNumber}
                        </td>

                        <td className="p-4 text-ink-600">
                          {student.year}
                        </td>

                        <td className="p-4">

                          <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                            {totalAttempts}/{totalAttempts}
                          </span>

                        </td>

                        <td className="p-4 font-mono font-semibold">
                          {totalScore}/{totalMarks}
                        </td>

                        <td className="p-4 font-mono font-semibold">
                          {averagePercentage}%
                        </td>

                        <td className="p-4">

                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                            {selectedCount > 0
                              ? `${selectedCount} Selected`
                              : "Pending"}
                          </span>

                        </td>

                        <td className="p-4">

                          <Link
                            href={`/results/${student.id}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 transition"
                          >
                            View Report →
                          </Link>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
}) {
  return (
    <div className="card p-5">

      <p className="text-xs uppercase tracking-wide text-ink-400 font-semibold">
        {label}
      </p>

      <p className="text-xl font-extrabold text-ink-900 mt-2">
        {value}
      </p>

    </div>
  );
}