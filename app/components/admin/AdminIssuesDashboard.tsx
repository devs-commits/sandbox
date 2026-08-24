"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  UserRoundCog,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// ENGINEER ROSTER
// Add or remove engineers here.
// ============================================================================

const AVAILABLE_ENGINEERS = [
  "Ademola",
  "Quadri",
] as const;

type IssueUser = {
  id?: string | null;
  auth_id?: string | null;
  email?: string | null;
  full_name?: string | null;
};

type Issue = {
  id: string | number;
  user_id?: string | null;
  category?: string | null;
  issue_detail?: string | null;
  optional_note?: string | null;
  track?: string | null;
  status?: string | null;
  assigned_engineer?: string | null;
  resolution_notes?: string | null;
  created_at?: string | null;
  users?: IssueUser | null;
};

function normaliseStatus(status?: string | null) {
  return status?.trim().toLowerCase() || "open";
}

function getStatusLabel(status?: string | null) {
  const normalisedStatus = normaliseStatus(status);

  if (normalisedStatus === "resolved") {
    return "Resolved";
  }

  if (normalisedStatus === "investigating") {
    return "Investigating";
  }

  return "Open";
}

function getStatusClasses(status?: string | null) {
  const normalisedStatus = normaliseStatus(status);

  if (normalisedStatus === "resolved") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalisedStatus === "investigating") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-rose-400/20 bg-rose-400/10 text-rose-300";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(
  payload: unknown,
  fallbackMessage: string
) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallbackMessage;
}

export function AdminIssuesDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterEngineer, setFilterEngineer] =
    useState("All");

  const [editingIssue, setEditingIssue] =
    useState<Issue | null>(null);

  const [editStatus, setEditStatus] = useState("open");
  const [editEngineer, setEditEngineer] =
    useState("Unassigned");
  const [editNotes, setEditNotes] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/admin/issues", {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            "Failed to load support issues."
          )
        );
      }

      let issueList: Issue[] = [];

      if (Array.isArray(payload)) {
        issueList = payload;
      } else if (
        payload &&
        typeof payload === "object" &&
        "issues" in payload &&
        Array.isArray(payload.issues)
      ) {
        issueList = payload.issues;
      } else if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        Array.isArray(payload.data)
      ) {
        issueList = payload.data;
      } else {
        console.error(
          "Unexpected admin issues response:",
          payload
        );

        throw new Error(
          "The support issues API returned an unexpected response."
        );
      }

      setIssues(issueList);
    } catch (error) {
      console.error(
        "Failed to load support issues:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load support issues.";

      setIssues([]);
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIssues();
  }, [fetchIssues]);

  const statistics = useMemo(() => {
    return {
      total: issues.length,

      open: issues.filter(
        (issue) =>
          normaliseStatus(issue.status) === "open"
      ).length,

      investigating: issues.filter(
        (issue) =>
          normaliseStatus(issue.status) ===
          "investigating"
      ).length,

      resolved: issues.filter(
        (issue) =>
          normaliseStatus(issue.status) === "resolved"
      ).length,
    };
  }, [issues]);

  /*
   * Include:
   * 1. Engineers from AVAILABLE_ENGINEERS
   * 2. Any engineers already saved in the database
   */
  const assignmentEngineers = useMemo(() => {
  const previouslyAssigned = issues
    .map((issue) =>
      issue.assigned_engineer?.trim()
    )
    .filter(
      (engineer): engineer is string =>
        typeof engineer === "string" &&
        engineer.length > 0 &&
        engineer.toLowerCase() !== "unassigned"
    );

  return Array.from(
    new Set<string>([
      ...AVAILABLE_ENGINEERS,
      ...previouslyAssigned,
    ])
  ).sort((first, second) =>
    first.localeCompare(second)
  );
}, [issues]);

  const filterEngineers = useMemo(
    () => [
      "All",
      "Unassigned",
      ...assignmentEngineers,
    ],
    [assignmentEngineers]
  );

  const filteredIssues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return issues.filter((issue) => {
      const status = normaliseStatus(issue.status);

      const engineer =
        issue.assigned_engineer?.trim() ||
        "Unassigned";

      const matchesStatus =
        filterStatus === "All" ||
        status === filterStatus;

      const matchesEngineer =
        filterEngineer === "All" ||
        engineer === filterEngineer;

      const searchableText = [
        issue.users?.full_name,
        issue.users?.email,
        issue.category,
        issue.issue_detail,
        issue.optional_note,
        issue.track,
        issue.assigned_engineer,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        query.length === 0 ||
        searchableText.includes(query);

      return (
        matchesStatus &&
        matchesEngineer &&
        matchesSearch
      );
    });
  }, [
    issues,
    searchTerm,
    filterStatus,
    filterEngineer,
  ]);

  const openEditor = (issue: Issue) => {
    setEditingIssue(issue);
    setEditStatus(normaliseStatus(issue.status));
    setEditEngineer(
      issue.assigned_engineer?.trim() ||
        "Unassigned"
    );
    setEditNotes(issue.resolution_notes || "");
    setNotifyUser(true);
  };

  const closeEditor = () => {
    if (isUpdating) {
      return;
    }

    setEditingIssue(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("All");
    setFilterEngineer("All");
  };

  const handleUpdate = async () => {
    if (!editingIssue) {
      toast.error("No support ticket selected.");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(
        "/api/admin/issues",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            issueId: editingIssue.id,
            status: editStatus,
            assignedEngineer: editEngineer,
            resolutionNotes: editNotes.trim(),
            notifyUser,
            userId: editingIssue.user_id,
            userEmail: editingIssue.users?.email,
            userName:
              editingIssue.users?.full_name,
            category: editingIssue.category,
          }),
        }
      );

      const payload = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            "Failed to update the support ticket."
          )
        );
      }

      setEditingIssue(null);
      await fetchIssues();

      if (
        payload &&
        typeof payload === "object" &&
        "warning" in payload &&
        typeof payload.warning === "string" &&
        payload.warning
      ) {
        toast.warning(payload.warning);
      } else {
        toast.success(
          "Ticket updated successfully."
        );
      }
    } catch (error) {
      console.error(
        "Failed to update support ticket:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update the support ticket."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    filterStatus !== "All" ||
    filterEngineer !== "All";

  return (
    <div className="min-h-screen bg-[#0D1729] px-5 py-7 text-slate-100 sm:px-7 lg:px-8">
      {/* Page header */}
      <div className="mb-7 flex flex-col gap-5 border-b border-slate-700/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <Wrench size={15} />
            Support Operations
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Support &amp; Bug Reports
          </h1>

          <p className="mt-1 text-sm text-slate-400 sm:text-base">
            Review intern feedback, assign engineers
            and track every report through resolution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchIssues()}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-600/70 bg-[#111E32] px-4 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-[#142740] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              isLoading ? "animate-spin" : ""
            }
          />
          Refresh reports
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Reports"
          value={statistics.total}
          description="All submitted reports"
          icon={<Inbox size={20} />}
          iconClasses="bg-cyan-400/10 text-cyan-300"
        />

        <SummaryCard
          title="Open"
          value={statistics.open}
          description="Awaiting review"
          icon={<AlertCircle size={20} />}
          iconClasses="bg-rose-400/10 text-rose-300"
        />

        <SummaryCard
          title="Investigating"
          value={statistics.investigating}
          description="Currently being handled"
          icon={<Clock3 size={20} />}
          iconClasses="bg-amber-400/10 text-amber-300"
        />

        <SummaryCard
          title="Resolved"
          value={statistics.resolved}
          description="Successfully closed"
          icon={<CheckCircle2 size={20} />}
          iconClasses="bg-emerald-400/10 text-emerald-300"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[#20364D] bg-[#10253B] p-4 shadow-[0_16px_45px_rgba(2,8,23,0.16)] sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal
            size={17}
            className="text-cyan-400"
          />

          <h2 className="text-sm font-semibold text-white">
            Find and filter reports
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,1fr)_210px_210px_auto]">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search intern, category or issue..."
                className="h-11 w-full rounded-xl border border-slate-600/60 bg-[#091525] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </label>

            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-600/60 bg-[#091525] px-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
            >
              <option value="All">
                All statuses
              </option>
              <option value="open">Open</option>
              <option value="investigating">
                Investigating
              </option>
              <option value="resolved">
                Resolved
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Engineer
            </label>

            <select
              value={filterEngineer}
              onChange={(event) =>
                setFilterEngineer(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-600/60 bg-[#091525] px-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
            >
              {filterEngineers.map(
                (engineer) => (
                  <option
                    key={engineer}
                    value={engineer}
                  >
                    {engineer === "All"
                      ? "All engineers"
                      : engineer}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-600/60 px-4 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
            >
              <X size={16} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Reports */}
      <div className="overflow-hidden rounded-2xl border border-[#20364D] bg-[#10253B] shadow-[0_18px_50px_rgba(2,8,23,0.2)]">
        <div className="flex items-center justify-between border-b border-[#20364D] px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">
              Submitted reports
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Showing {filteredIssues.length} of{" "}
              {issues.length} reports
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />

            <p className="text-sm text-slate-400">
              Loading support reports...
            </p>
          </div>
        ) : loadError ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
              <AlertCircle size={26} />
            </div>

            <h3 className="text-base font-semibold text-white">
              Reports could not be loaded
            </h3>

            <p className="mt-2 max-w-lg text-sm text-slate-400">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => void fetchIssues()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <Inbox size={26} />
            </div>

            <h3 className="text-base font-semibold text-white">
              {issues.length === 0
                ? "No support reports yet"
                : "No matching reports"}
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-400">
              {issues.length === 0
                ? "New bug reports and support requests will appear here."
                : "Try changing your search or filter selections."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead className="bg-[#0A1727] text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Intern
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Category / issue
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Engineer
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#20364D]">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="transition hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-sm font-bold text-cyan-300">
                          {issue.users?.full_name
                            ?.trim()
                            .charAt(0)
                            .toUpperCase() || "U"}
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {issue.users?.full_name ||
                              "Unknown intern"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {issue.track ||
                              "No track"}{" "}
                            ·{" "}
                            {formatDate(
                              issue.created_at
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-md px-5 py-5 align-top">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
                        {issue.category ||
                          "Uncategorised"}
                      </p>

                      <p className="line-clamp-2 text-sm leading-6 text-slate-300">
                        {issue.issue_detail ||
                          "No issue details provided."}
                      </p>

                      {issue.optional_note && (
                        <p className="mt-2 line-clamp-1 text-xs italic text-slate-500">
                          &ldquo;
                          {issue.optional_note}
                          &rdquo;
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-5 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(
                          issue.status
                        )}`}
                      >
                        {getStatusLabel(
                          issue.status
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <UserRoundCog
                          size={16}
                          className="text-slate-500"
                        />

                        {issue.assigned_engineer ||
                          "Unassigned"}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-right align-top">
                      <button
                        type="button"
                        onClick={() =>
                          openEditor(issue)
                        }
                        className="rounded-lg border border-cyan-400/30 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingIssue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#29445F] bg-[#10253B] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#20364D] px-6 py-5">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Support ticket
                </p>

                <h3 className="text-xl font-bold text-white">
                  Manage report
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Reported by{" "}
                  {editingIssue.users
                    ?.full_name ||
                    "Unknown intern"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={isUpdating}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-cyan-400/15 bg-[#0A192A] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
                  {editingIssue.category ||
                    "Uncategorised"}
                </p>

                <p className="text-sm leading-6 text-slate-200">
                  {editingIssue.issue_detail ||
                    "No issue details provided."}
                </p>

                {editingIssue.optional_note && (
                  <p className="mt-3 rounded-lg bg-black/20 p-3 text-xs italic leading-5 text-slate-400">
                    &ldquo;
                    {editingIssue.optional_note}
                    &rdquo;
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-600/60 bg-[#091525] px-3 text-sm text-white outline-none focus:border-cyan-400/60"
                  >
                    <option value="open">
                      Open
                    </option>

                    <option value="investigating">
                      Investigating
                    </option>

                    <option value="resolved">
                      Resolved
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assign engineer
                  </label>

                  <select
                    value={editEngineer}
                    onChange={(event) =>
                      setEditEngineer(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-600/60 bg-[#091525] px-3 text-sm text-white outline-none focus:border-cyan-400/60"
                  >
                    <option value="Unassigned">
                      Unassigned
                    </option>

                    {assignmentEngineers.map(
                      (engineer) => (
                        <option
                          key={engineer}
                          value={engineer}
                        >
                          {engineer}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Admin / resolution notes
                </label>

                <textarea
                  value={editNotes}
                  onChange={(event) =>
                    setEditNotes(
                      event.target.value
                    )
                  }
                  placeholder="Explain what was fixed or provide an update..."
                  className="h-28 w-full resize-none rounded-xl border border-slate-600/60 bg-[#091525] p-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/60"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                <input
                  type="checkbox"
                  checked={notifyUser}
                  onChange={(event) =>
                    setNotifyUser(
                      event.target.checked
                    )
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-500 bg-[#091525] text-cyan-400 focus:ring-cyan-400"
                />

                <div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Send
                      size={15}
                      className="text-cyan-400"
                    />
                    Notify intern of this update
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    Sends the intern an email
                    containing the status and
                    resolution update.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#20364D] bg-[#0A192A] px-6 py-4">
              <button
                type="button"
                onClick={closeEditor}
                disabled={isUpdating}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  iconClasses: string;
};

function SummaryCard({
  title,
  value,
  description,
  icon,
  iconClasses,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-[#20364D] bg-[#10253B] p-5 shadow-[0_14px_35px_rgba(2,8,23,0.14)]">
      <div className="mb-5 flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClasses}`}
        >
          {icon}
        </div>
      </div>

      <p className="text-3xl font-bold tracking-tight text-white">
        {value.toLocaleString()}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}