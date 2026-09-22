"use client";

import React, { useState } from "react";

import { api } from "@/lib/api-client.js";
import { TextInput, SelectInput } from "@/components/FormField.jsx";
import { Icon } from "@/components/Icons.jsx";
import { useToast } from "@/context/ToastContext.jsx";

const COURSES = ["BCA", "B.Com", "BBA"];

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
];

export default function StudentForm({ student, onDone, onCancel }) {
  const isEdit = !!student;

  const toast = useToast();

  const [form, setForm] = useState({
    fullName: student?.fullName || "",
    email: student?.email || "",
    course: student?.course || "",
    year: student?.year || "",
    phone: student?.phone || "",
    password: "",
    status: student?.status || "Active",
    generatePassword: false,
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  function set(field, value) {
    setForm((f) => ({
      ...f,
      [field]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      if (!form.fullName.trim()) {
        throw new Error("Full name is required.");
      }

      if (!form.email.trim()) {
        throw new Error("Email is required.");
      }

      if (!form.course) {
        throw new Error("Please select a course.");
      }

      if (!form.year) {
        throw new Error("Please select a year.");
      }

      if (!isEdit && !form.generatePassword && !form.password) {
        throw new Error(
          "Enter a password or enable automatic password generation."
        );
      }

      if (
        !isEdit &&
        !form.generatePassword &&
        form.password.length < 8
      ) {
        throw new Error("Password must be at least 8 characters.");
      }

      if (isEdit) {
        await api.put(`/students/${student._id}`, form);

        toast.success("Student updated successfully");
        onDone();
      } else {
        const result = await api.post("/students", form);

        setCreated(result);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function copyPassword() {
    if (!created?.temporaryPassword) return;

    navigator.clipboard?.writeText(created.temporaryPassword);

    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
  }

  if (created) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-success-500/20 bg-success-50 p-5">
          <p className="flex items-center gap-2 font-bold text-success-700">
            <Icon.check size={16} />
            Student Created Successfully
          </p>

          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Name" value={created.fullName} />
            <Row label="Email" value={created.email} />
            <Row label="Course" value={created.course} />
            <Row label="Year" value={created.year} />
            <Row label="Phone" value={created.phone || "—"} />
            <Row label="Status" value={created.status} />

            {/* Show generated credentials if the backend still creates them */}
            {created.username && (
              <Row label="Username" value={created.username} />
            )}

            {created.rollNumber && (
              <Row label="Roll Number" value={created.rollNumber} />
            )}
          </dl>
        </div>

        {created.temporaryPassword && (
          <div className="rounded-2xl border border-warning-500/20 bg-warning-50 p-5">
            <p className="text-sm font-bold text-warning-700">
              Temporary password (shown once only)
            </p>

            <div className="mt-2 flex items-center gap-2">
              <p className="flex-1 break-all rounded-lg border border-warning-500/20 bg-white px-3 py-2 font-mono text-lg text-warning-800">
                {created.temporaryPassword}
              </p>

              <button
                type="button"
                onClick={copyPassword}
                className="btn-outline px-3 py-2.5"
              >
                <Icon.copy size={15} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="mt-2 text-xs text-warning-700">
              Share this with the student securely. It will not be shown
              again.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            toast.success("Student created successfully");
            onDone();
          }}
          className="btn-primary w-full py-3"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Full Name */}
        <TextInput
          label="Full Name"
          required
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Enter student's full name"
        />

        {/* Email */}
        <TextInput
          label="Email"
          required
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="student@example.com"
        />

        {/* Course */}
        <SelectInput
          label="Course"
          required
          options={COURSES}
          value={form.course}
          onChange={(e) => set("course", e.target.value)}
        />

        {/* Year */}
        <SelectInput
          label="Year"
          required
          options={YEARS}
          value={form.year}
          onChange={(e) => set("year", e.target.value)}
        />

        {/* Phone */}
        <TextInput
          label="Phone Number"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Optional"
        />

        {/* Account Status */}
        <SelectInput
          label="Account Status"
          required
          options={["Active", "Disabled"]}
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        />
      </div>

      {/* Password */}
      {!isEdit && (
        <div className="space-y-3 border-t border-line pt-4">
          <TextInput
            label="Password"
            type="text"
            disabled={form.generatePassword}
            value={form.generatePassword ? "" : form.password}
            placeholder={
              form.generatePassword
                ? "Will be generated automatically"
                : "Minimum 8 characters"
            }
            onChange={(e) => set("password", e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm font-medium text-ink-600">
            <input
              type="checkbox"
              checked={form.generatePassword}
              onChange={(e) =>
                set("generatePassword", e.target.checked)
              }
              className="rounded"
            />

            Generate Password automatically
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-danger-500/20 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary"
        >
          {busy
            ? "Saving..."
            : isEdit
            ? "Save Changes"
            : "Create Student"}
        </button>
      </div>
    </form>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-success-700/80">
        {label}
      </span>

      <span className="text-right font-semibold text-success-800">
        {value}
      </span>
    </div>
  );
}