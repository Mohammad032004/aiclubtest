"use client";

import React, { useEffect, useState, useCallback } from "react";

import { api } from "@/lib/api-client.js";

import Badge from "@/components/Badge.jsx";
import Modal from "@/components/Modal.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import EmptyState from "@/components/EmptyState.jsx";
import { SkeletonTableRows } from "@/components/Skeleton.jsx";
import { Icon } from "@/components/Icons.jsx";
import { useToast } from "@/context/ToastContext.jsx";

import StudentForm from "@/components/admin/StudentForm.jsx";
import StudentImport from "@/components/admin/StudentImport.jsx";

const YEARS = ["BCA 1st Year", "BCA 2nd Year", "BCA 3rd Year"];

const TEST_STATUSES = [
  "Not Attempted",
  "In Progress",
  "Completed",
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getAvatarClass(name = "") {
  const colors = [
    "bg-cyan-100 text-cyan-700",
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
  ];

  const index =
    name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    colors.length;

  return colors[index];
}

function TestStatusBadge({ status }) {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }

  if (status === "In Progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Not Attempted
    </span>
  );
}

function AccountStatus({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {status}
    </span>
  );
}

export default function Students() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [testStatus, setTestStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modal, setModal] = useState(null);
  const [activeStudent, setActiveStudent] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const [openMenu, setOpenMenu] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        search,
        year,
        status,
        testStatus,
        page,
        limit: 10,
      });

      const data = await api.get(`/students?${params.toString()}`);

      setRows(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load students");
    } finally {
      setLoading(false);
    }
  }, [search, year, status, testStatus, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setActiveStudent(null);
    setModal("add");
  }

  function openEdit(student) {
    setOpenMenu(null);
    setActiveStudent(student);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setActiveStudent(null);
    load();
  }

  async function refreshStudents() {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleStatus(student) {
    try {
      setOpenMenu(null);

      const newStatus =
        student.status === "Active" ? "Disabled" : "Active";

      await api.patch(`/students/${student._id}/status`, {
        status: newStatus,
      });

      toast.success(
        `${student.fullName} ${
          newStatus === "Active" ? "enabled" : "disabled"
        }`
      );

      load();
    } catch (error) {
      console.error(error);
      toast.error("Unable to update account status");
    }
  }

  async function handleResetPassword(student) {
    try {
      setOpenMenu(null);

      const res = await api.post(
        `/students/${student._id}/reset-password`,
        {
          generatePassword: true,
        }
      );

      setResetResult({
        student,
        password: res.temporaryPassword,
      });
    } catch (error) {
      console.error(error);
      toast.error("Unable to reset password");
    }
  }

  function askDelete(student) {
    setOpenMenu(null);

    setConfirm({
      title: "Delete student account?",
      message: `This permanently deletes ${student.fullName} (${student.rollNumber}) and their test history. This cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.del(`/students/${student._id}`);

          toast.success("Student deleted");

          setConfirm(null);

          if (rows.length === 1 && page > 1) {
            setPage((current) => current - 1);
          } else {
            load();
          }
        } catch (error) {
          console.error(error);
          toast.error("Unable to delete student");
        }
      },
    });
  }

  function clearFilters() {
    setSearch("");
    setYear("");
    setStatus("");
    setTestStatus("");
    setPage(1);
  }

  const hasFilters = Boolean(search || year || status || testStatus);

  const activeOnPage = rows.filter((student) => student.status === "Active")
    .length;

  const completedOnPage = rows.filter(
    (student) => student.testStatus === "Completed"
  ).length;

  const notAttemptedOnPage = rows.filter(
    (student) => student.testStatus === "Not Attempted"
  ).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-700">
              Administration
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            Students
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-400">
            Manage student accounts, monitor test participation, and control
            access to the examination platform.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={refreshStudents}
            disabled={refreshing}
            className="btn-outline inline-flex items-center gap-2"
          >
            <span
              className={`text-base ${
                refreshing ? "animate-spin" : ""
              }`}
            >
              ↻
            </span>
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setModal("import")}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Icon.upload size={16} />
            Import
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Icon.plus size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card relative overflow-hidden p-5">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-cyan-50" />

          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Icon.students size={19} />
              </div>

              <span className="text-xs font-medium text-ink-400">
                All accounts
              </span>
            </div>

            <p className="text-2xl font-extrabold text-ink-900">{total}</p>
            <p className="mt-1 text-sm text-ink-400">Total students</p>
          </div>
        </div>

        <div className="card relative overflow-hidden p-5">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-emerald-50" />

          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <span className="text-lg">✓</span>
              </div>

              <span className="text-xs font-medium text-ink-400">
                Current page
              </span>
            </div>

            <p className="text-2xl font-extrabold text-ink-900">
              {activeOnPage}
            </p>
            <p className="mt-1 text-sm text-ink-400">Active accounts</p>
          </div>
        </div>

        <div className="card relative overflow-hidden p-5">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-violet-50" />

          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <span className="text-lg">✓</span>
              </div>

              <span className="text-xs font-medium text-ink-400">
                Current page
              </span>
            </div>

            <p className="text-2xl font-extrabold text-ink-900">
              {completedOnPage}
            </p>
            <p className="mt-1 text-sm text-ink-400">Tests completed</p>
          </div>
        </div>

        <div className="card relative overflow-hidden p-5">
          <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-amber-50" />

          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <span className="text-lg">○</span>
              </div>

              <span className="text-xs font-medium text-ink-400">
                Current page
              </span>
            </div>

            <p className="text-2xl font-extrabold text-ink-900">
              {notAttemptedOnPage}
            </p>
            <p className="mt-1 text-sm text-ink-400">Not attempted</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-sm font-bold text-ink-900">
            Student directory
          </h2>

          <p className="text-xs text-ink-400">
            Search and filter student accounts by academic year and test
            participation.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Icon.search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            />

            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search name, roll number, email or username..."
              className="input w-full pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:flex">
            <select
              value={year}
              onChange={(e) => {
                setPage(1);
                setYear(e.target.value);
              }}
              className="input bg-white xl:min-w-[150px]"
            >
              <option value="">All Years</option>

              {YEARS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="input bg-white xl:min-w-[145px]"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>

            <select
              value={testStatus}
              onChange={(e) => {
                setPage(1);
                setTestStatus(e.target.value);
              }}
              className="input bg-white xl:min-w-[165px]"
            >
              <option value="">All Test Status</option>

              {TEST_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <p className="text-xs text-ink-400">
              Filters are currently active.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Student Table */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink-900">
              Student accounts
            </h2>

            <p className="mt-0.5 text-xs text-ink-400">
              Showing {rows.length} student{rows.length === 1 ? "" : "s"}
              {total > 0 ? ` out of ${total}` : ""}
            </p>
          </div>

          {hasFilters && (
            <span className="inline-flex w-fit items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
              Filtered results
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b border-line bg-slate-50/70 text-left text-[11px] uppercase tracking-wider text-ink-400">
                <th className="px-5 py-3.5 font-bold">Student</th>
                <th className="px-4 py-3.5 font-bold">Roll No.</th>
                <th className="px-4 py-3.5 font-bold">Username</th>
                <th className="px-4 py-3.5 font-bold">Year</th>
                <th className="px-4 py-3.5 font-bold">Test</th>
                <th className="px-4 py-3.5 font-bold">Account</th>
                <th className="px-4 py-3.5 text-right font-bold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {loading && (
                <SkeletonTableRows rows={6} cols={7} />
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Icon.students size={22} />}
                      title={
                        hasFilters
                          ? "No students match your filters"
                          : "No students yet"
                      }
                      description={
                        hasFilters
                          ? "Try adjusting your search or filters."
                          : "Add your first student to get started."
                      }
                      action={
                        !hasFilters && (
                          <button
                            type="button"
                            onClick={openAdd}
                            className="btn-primary inline-flex items-center gap-2"
                          >
                            <Icon.plus size={16} />
                            Add Student
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((student) => (
                  <tr
                    key={student._id}
                    className="group transition hover:bg-slate-50/80"
                  >
                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${getAvatarClass(
                            student.fullName
                          )}`}
                        >
                          {getInitials(student.fullName)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink-900">
                            {student.fullName}
                          </p>

                          <p className="mt-0.5 max-w-[230px] truncate text-xs text-ink-400">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Roll Number */}
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-ink-600">
                        {student.rollNumber}
                      </span>
                    </td>

                    {/* Username */}
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-ink-600">
                        @{student.username}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-ink-600">
                        {student.year}
                      </span>
                    </td>

                    {/* Test */}
                    <td className="px-4 py-4">
                      <TestStatusBadge status={student.testStatus} />
                    </td>

                    {/* Account */}
                    <td className="px-4 py-4">
                      <AccountStatus status={student.status} />
                    </td>

                    {/* Actions */}
                    <td className="relative px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === student._id
                              ? null
                              : student._id
                          )
                        }
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-ink-600 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        Actions
                        <span className="text-sm">⋮</span>
                      </button>

                      {openMenu === student._id && (
                        <div className="absolute right-5 top-[calc(100%-4px)] z-30 w-48 overflow-hidden rounded-xl border border-line bg-white p-1.5 text-left shadow-xl">
                          <button
                            type="button"
                            onClick={() => openEdit(student)}
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-xs font-semibold text-ink-700 transition hover:bg-slate-50"
                          >
                            <span className="mr-2.5 text-sm">✎</span>
                            Edit Student
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleStatus(student)}
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-xs font-semibold text-ink-700 transition hover:bg-slate-50"
                          >
                            <span className="mr-2.5 text-sm">
                              {student.status === "Active" ? "⊘" : "✓"}
                            </span>

                            {student.status === "Active"
                              ? "Disable Account"
                              : "Enable Account"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetPassword(student)}
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-xs font-semibold text-ink-700 transition hover:bg-slate-50"
                          >
                            <span className="mr-2.5 text-sm">🔑</span>
                            Reset Password
                          </button>

                          <div className="my-1 border-t border-line" />

                          <button
                            type="button"
                            onClick={() => askDelete(student)}
                            className="flex w-full items-center rounded-lg px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <span className="mr-2.5 text-sm">⌫</span>
                            Delete Student
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-400">
              Page <span className="font-semibold text-ink-700">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-ink-700">
                {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setOpenMenu(null);
                  setPage((current) => current - 1);
                }}
                className="btn-outline px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <div className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 sm:block">
                {page}
              </div>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setOpenMenu(null);
                  setPage((current) => current + 1);
                }}
                className="btn-outline px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student */}
      <Modal
        open={modal === "add"}
        title="Add Student"
        subtitle="Create login credentials for a new student."
        onClose={closeModal}
      >
        <StudentForm
          onDone={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      {/* Edit Student */}
      <Modal
        open={modal === "edit"}
        title="Edit Student"
        subtitle="Update the student's account information."
        onClose={closeModal}
      >
        <StudentForm
          student={activeStudent}
          onDone={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      {/* Import Students */}
      <Modal
        open={modal === "import"}
        title="Import Students"
        subtitle="Bulk-create accounts from a CSV or Excel file."
        onClose={closeModal}
        wide
      >
        <StudentImport onDone={closeModal} />
      </Modal>

      {/* Password Reset */}
      <Modal
        open={!!resetResult}
        title="Password Reset"
        subtitle="A new temporary password has been generated."
        onClose={() => setResetResult(null)}
      >
        {resetResult && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                New temporary password for{" "}
                <strong>{resetResult.student.fullName}</strong>
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                Temporary password
              </p>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-slate-50 px-4 py-3">
                <p className="break-all font-mono text-lg font-bold text-ink-900">
                  {resetResult.password}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      resetResult.password
                    );
                    toast.success("Password copied");
                  }}
                  className="shrink-0 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-slate-50"
                >
                  Copy
                </button>
              </div>
            </div>

            <p className="text-xs leading-5 text-ink-400">
              This password is shown once. Share it with the student
              securely and ask them to change it after logging in.
            </p>

            <button
              type="button"
              onClick={() => setResetResult(null)}
              className="btn-primary w-full"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Delete"
        danger
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}