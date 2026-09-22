"use client";

import React, { useState } from "react";

import { api, downloadBlob } from "@/lib/api-client.js";
import { Icon } from "@/components/Icons.jsx";
import { useToast } from "@/context/ToastContext.jsx";

export default function StudentImport({ onDone }) {
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [passwordMode, setPasswordMode] = useState("generate");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function downloadTemplate() {
    try {
      const blob = await api.getBlob("/students/import/template");
      downloadBlob(blob, "student_import_template.csv");
    } catch (err) {
      setError(err.message || "Unable to download template.");
    }
  }

  async function handleImport(e) {
    e.preventDefault();

    if (!file) {
      return setError("Please choose a CSV or Excel file first.");
    }

    if (!course) {
      return setError("Please select a course.");
    }

    setError("");
    setBusy(true);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("passwordMode", passwordMode);
      formData.append("course", course);

      if (passwordMode === "manual") {
        if (!password || password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }

        formData.append("password", password);
      }

      const res = await api.postForm(
        "/students/import",
        formData
      );

      setResult(res);
    } catch (err) {
      setError(err.message || "Unable to import students.");
    } finally {
      setBusy(false);
    }
  }

  function downloadCredentials() {
    if (!result?.created) return;

    const rows = result.created
      .filter((student) => student.temporaryPassword)
      .map(
        (student) =>
          `"${student.fullName}","${student.email}","${student.course}","${student.year}","${student.temporaryPassword}"`
      )
      .join("\n");

    const header =
      "Full Name,Email,Course,Year,Temporary Password\n";

    const blob = new Blob(
      [header + rows],
      { type: "text/csv" }
    );

    downloadBlob(
      blob,
      "imported_student_credentials.csv"
    );
  }

  // --------------------------------------------------
  // IMPORT RESULT
  // --------------------------------------------------

  if (result) {
    return (
      <div className="space-y-4">
        {/* Success */}
        <div className="rounded-2xl border border-success-500/20 bg-success-50 p-4 text-sm text-success-700">
          <p className="font-bold">
            {result.createdCount} student(s) created successfully.
          </p>

          {result.failedCount > 0 && (
            <p className="mt-1 text-warning-700">
              {result.failedCount} row(s) failed — see details below.
            </p>
          )}
        </div>

        {/* Course */}
        {course && (
          <div className="rounded-xl border border-line bg-slate-50 px-4 py-3 text-sm">
            <span className="text-ink-400">
              Course:
            </span>{" "}
            <span className="font-semibold text-ink-700">
              {course}
            </span>
          </div>
        )}

        {/* Temporary Password Download */}
        {passwordMode === "generate" &&
          result.createdCount > 0 && (
            <button
              type="button"
              onClick={downloadCredentials}
              className="btn-accent flex w-full items-center justify-center gap-2"
            >
              <Icon.download size={16} />
              Download Temporary Passwords (shown once)
            </button>
          )}

        {/* Failed Rows */}
        {result.failed?.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-danger-500/20">
            <table className="w-full text-xs">
              <thead className="bg-danger-50 text-danger-700">
                <tr>
                  <th className="p-2 text-left">
                    Row
                  </th>

                  <th className="p-2 text-left">
                    Name
                  </th>

                  <th className="p-2 text-left">
                    Error
                  </th>
                </tr>
              </thead>

              <tbody>
                {result.failed.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-danger-500/10"
                  >
                    <td className="p-2">
                      {item.row}
                    </td>

                    <td className="p-2">
                      {item.fullName || "-"}
                    </td>

                    <td className="p-2">
                      {item.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Done */}
        <button
          type="button"
          onClick={() => {
            toast.success(
              `${result.createdCount} student(s) imported`
            );

            onDone();
          }}
          className="btn-primary w-full"
        >
          Done
        </button>
      </div>
    );
  }

  // --------------------------------------------------
  // IMPORT FORM
  // --------------------------------------------------

  return (
    <form
      onSubmit={handleImport}
      className="space-y-4"
    >
      {/* Import Information */}
      <div className="rounded-xl border border-line bg-slate-50 p-4 text-sm text-ink-600">
        <p>
          Upload a CSV or Excel file with these columns:
        </p>

        <p className="mt-2 font-mono text-xs font-semibold text-ink-700">
          Full Name, Email, Course, Year, Phone
        </p>

        <p className="mt-2 text-xs text-ink-400">
          Course must be BCA, B.Com, or BBA.
        </p>

        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-2 flex items-center gap-1.5 font-semibold text-cyan-600 hover:underline"
        >
          <Icon.download size={14} />
          Download sample template
        </button>
      </div>

      {/* Course */}
      <div>
        <label
          htmlFor="course"
          className="label"
        >
          Course
        </label>

        <select
          id="course"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="input"
          required
        >
          <option value="">
            Select course
          </option>

          <option value="BCA">
            BCA
          </option>

          <option value="B.Com">
            B.Com
          </option>

          <option value="BBA">
            BBA
          </option>
        </select>
      </div>

      {/* File */}
      <label className="block text-sm">
        <span className="label">
          File (.csv, .xlsx, .xls)
        </span>

        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          className="input"
        />

        {file && (
          <p className="mt-2 text-xs text-ink-400">
            Selected:{" "}
            <span className="font-medium text-ink-600">
              {file.name}
            </span>
          </p>
        )}
      </label>

      {/* Password Assignment */}
      <div className="space-y-2">
        <p className="label mb-1">
          Password assignment
        </p>

        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="radio"
            checked={passwordMode === "generate"}
            onChange={() =>
              setPasswordMode("generate")
            }
          />

          Auto-generate a temporary password for each
          student
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="radio"
            checked={passwordMode === "manual"}
            onChange={() =>
              setPasswordMode("manual")
            }
          />

          Use one password for all imported students
        </label>

        {passwordMode === "manual" && (
          <input
            type="text"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="input"
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-danger-500/20 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full"
      >
        {busy
          ? "Importing..."
          : "Import Students"}
      </button>
    </form>
  );
}
