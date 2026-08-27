import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendIssueUpdateEmail } from "@/lib/zeptomail";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

type UserRecord = {
  id: string;
  auth_id: string | null;
  full_name: string | null;
  email: string | null;
};

async function findUserByReference(
  userId: string
): Promise<UserRecord | null> {
  const isNumeric = /^\d+$/.test(userId);

  if (isNumeric) {
    const { data: userById, error: idError } = await supabaseAdmin
      .from("users")
      .select("id, auth_id, full_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (!idError && userById) {
      return userById;
    }
  }

  const { data: userByAuthId, error: authIdError } = await supabaseAdmin
    .from("users")
    .select("id, auth_id, full_name, email")
    .eq("auth_id", userId)
    .maybeSingle();

  if (authIdError) {
    console.error("Failed to find user for task issue:", authIdError);
  }

  return userByAuthId || null;
}

// ============================================================================
// GET ALL SUPPORT ISSUES
// ============================================================================

export async function GET() {
  try {
    const { data: issues, error: issuesError } = await supabaseAdmin
      .from("task_issues")
      .select(`
        id,
        user_id,
        task_id,
        track,
        category,
        issue_detail,
        optional_note,
        status,
        created_at,
        assigned_engineer,
        resolution_notes
      `)
      .order("created_at", { ascending: false });

    if (issuesError) {
      console.error("Failed to fetch task issues:", issuesError);
      return NextResponse.json({ error: issuesError.message }, { status: 500 });
    }

    if (!issues || issues.length === 0) {
      return NextResponse.json({ issues: [] });
    }

    const userIds = Array.from(
      new Set(
        issues
          .map((issue) => issue.user_id)
          .filter(
            (userId): userId is string =>
              typeof userId === "string" && userId.length > 0
          )
      )
    );

    if (userIds.length === 0) {
      return NextResponse.json({
        issues: issues.map((issue) => ({
          ...issue,
          users: null,
        })),
      });
    }

    const numericIds = userIds.filter((id) => /^\d+$/.test(id));
    const uuidIds = userIds.filter((id) => !/^\d+$/.test(id));

    const matchedUsers: UserRecord[] = [];

    if (numericIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, auth_id, full_name, email")
        .in("id", numericIds);

      if (error) {
        console.warn("Could not match task issues through users.id:", error);
      } else if (data) {
        matchedUsers.push(...data);
      }
    }

    if (uuidIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, auth_id, full_name, email")
        .in("auth_id", uuidIds);

      if (error) {
        console.warn("Could not match task issues through users.auth_id:", error);
      } else if (data) {
        matchedUsers.push(...data);
      }
    }

    const userMap = new Map<string, UserRecord>();

    matchedUsers.forEach((user) => {
      if (user.id) {
        userMap.set(String(user.id), user);
      }

      if (user.auth_id) {
        userMap.set(String(user.auth_id), user);
      }
    });

    const hydratedIssues = issues.map((issue) => ({
      ...issue,
      users: issue.user_id
        ? userMap.get(String(issue.user_id)) || null
        : null,
    }));

    return NextResponse.json({
      issues: hydratedIssues,
    });
  } catch (error) {
    console.error("Unexpected admin issues GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading issues.",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// UPDATE A SUPPORT ISSUE
// ============================================================================

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const {
      issueId,
      status,
      assignedEngineer,
      resolutionNotes,
      notifyUser,
      userId,
      userEmail,
      userName,
      category,
    } = body;

    if (!issueId) {
      return NextResponse.json({ error: "Issue ID is required." }, { status: 400 });
    }

    if (typeof status !== "string" || !status.trim()) {
      return NextResponse.json({ error: "Issue status is required." }, { status: 400 });
    }

    const normalizedStatus = status.trim().toLowerCase();
    const allowedStatuses = ["open", "investigating", "resolved"];

    if (!allowedStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: "Status must be open, investigating or resolved." },
        { status: 400 }
      );
    }

    const normalizedEngineer =
      typeof assignedEngineer === "string" && assignedEngineer.trim()
        ? assignedEngineer.trim()
        : "Unassigned";

    const normalizedNotes =
      typeof resolutionNotes === "string" && resolutionNotes.trim()
        ? resolutionNotes.trim()
        : null;

    const { data: updatedIssue, error: updateError } = await supabaseAdmin
      .from("task_issues")
      .update({
        status: normalizedStatus,
        assigned_engineer: normalizedEngineer,
        resolution_notes: normalizedNotes,
      })
      .eq("id", issueId)
      .select(`
        id,
        user_id,
        task_id,
        track,
        category,
        issue_detail,
        optional_note,
        status,
        created_at,
        assigned_engineer,
        resolution_notes
      `)
      .single();

    if (updateError) {
      console.error("Failed to update task issue:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    let resolvedEmail = typeof userEmail === "string" ? userEmail.trim() : "";
    let resolvedName = typeof userName === "string" ? userName.trim() : "";

    const resolvedUserId =
      typeof userId === "string" && userId ? userId : updatedIssue.user_id;

    if (resolvedUserId && (!resolvedEmail || !resolvedName)) {
      const matchedUser = await findUserByReference(resolvedUserId);

      if (matchedUser) {
        resolvedEmail = resolvedEmail || matchedUser.email || "";
        resolvedName = resolvedName || matchedUser.full_name || "WDC Labs User";
      }
    }

    let emailAttempted = false;
    let warning: string | null = null;

    if (notifyUser) {
      if (!resolvedEmail) {
        warning =
          "The ticket was updated, but the user's email address could not be found.";
      } else {
        try {
          await sendIssueUpdateEmail(
            resolvedEmail,
            resolvedName || "WDC Labs User",
            category || updatedIssue.category || "Support Request",
            normalizedStatus,
            normalizedNotes || "Your support request has been updated."
          );

          emailAttempted = true;
        } catch (emailError) {
          console.error("Ticket updated, but email notification failed:", emailError);
          warning =
            "The ticket was updated, but the notification email could not be sent.";
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Support ticket updated successfully.",
      issue: updatedIssue,
      emailAttempted,
      warning,
    });
  } catch (error) {
    console.error("Unexpected admin issues PATCH error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while updating the issue.",
      },
      { status: 500 }
    );
  }
}