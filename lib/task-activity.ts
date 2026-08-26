import { supabaseAdmin } from '@/lib/supabase-admin';

export type TaskActivityEventType =
  | 'task_generated'
  | 'task_generated_manually'
  | 'task_submitted'
  | 'task_submission_failed'
  | 'task_graded';

export type TaskActivityStatus = 'success' | 'failed' | 'pending';

interface LogTaskActivityInput {
  userId: number;
  taskId: number;
  eventType: TaskActivityEventType;
  week: number | null;
  attemptNumber?: number | null;
  status: TaskActivityStatus;
  score?: number | null;
  message: string;
}

interface LogTaskActivityForAuthUserInput {
  authUserId: string;
  taskId: string | number;
  eventType: TaskActivityEventType;
  attemptNumber?: number | null;
  status: TaskActivityStatus;
  score?: number | null;
}

/**
 * Uses wildcard regex to strip and format any AI date/deadline bracket tags, 
 * regardless of extra prompt examples inside the brackets (e.g., [Current Date - e.g., Nov 27]).
 */
export function formatTaskBriefDates(content: string, createdAt?: string | Date): string {
  if (!content) return content;

  const baseDate = createdAt ? new Date(createdAt) : new Date();
  const currentDateStr = baseDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const deadline = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const deadlineStr = `${deadline.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })} at 11:59 PM`;

  return content
    .replace(/\[Current Date\]/gi, currentDateStr)
    .replace(/\[Date of Assignment\]/gi, currentDateStr)
    .replace(/\[Assignment Date\]/gi, currentDateStr)
    .replace(/\[Today's Date\]/gi, currentDateStr)
    .replace(/\[Insert Date\]/gi, currentDateStr)
    .replace(/\[Date\]/gi, currentDateStr)
    .replace(/\[Deadline Date & Time\]/gi, deadlineStr)
    .replace(/\[Deadline Date\]/gi, deadlineStr)
    .replace(/\[Submission Deadline\]/gi, deadlineStr)
    .replace(/\[[^\]]*deadline[^\]]*\]/gi, deadlineStr)
    .replace(/\[[^\]]*date[^\]]*\]/gi, currentDateStr);
}

/**
 * Fetches a task by ID, cleans up any raw date placeholders in its brief content, and updates the DB.
 */
export async function sanitizeAndFixTaskBrief(taskId: string | number): Promise<void> {
  try {
    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select('id, brief_content, description, created_at')
      .eq('id', taskId)
      .maybeSingle();

    if (error || !task) return;

    const updatedBrief = formatTaskBriefDates(task.brief_content || '', task.created_at);
    const updatedDesc = formatTaskBriefDates(task.description || '', task.created_at);

    if (updatedBrief !== task.brief_content || updatedDesc !== task.description) {
      await supabaseAdmin
        .from('tasks')
        .update({
          brief_content: updatedBrief,
          description: updatedDesc,
        })
        .eq('id', task.id);
    }
  } catch (err) {
    console.error('Failed to sanitize task brief placeholders:', err);
  }
}

const activityAlreadyExists = async ({
  userId,
  taskId,
  eventType,
  attemptNumber,
}: Pick<LogTaskActivityInput, 'userId' | 'taskId' | 'eventType' | 'attemptNumber'>) => {
  let query = supabaseAdmin
    .from('task_activity')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('event_type', eventType);

  query = attemptNumber == null ? query.is('attempt_number', null) : query.eq('attempt_number', attemptNumber);

  const { data, error } = await query.limit(1);
  if (error) throw error;
  return Boolean(data?.length);
};

/** Best-effort logger: audit failures must never interrupt the task flow. */
export async function logTaskActivity(input: LogTaskActivityInput): Promise<void> {
  try {
    if (await activityAlreadyExists(input)) return;

    const { error } = await supabaseAdmin.from('task_activity').insert({
      user_id: input.userId,
      task_id: input.taskId,
      event_type: input.eventType,
      week: input.week,
      attempt_number: input.attemptNumber ?? null,
      status: input.status,
      score: input.score ?? null,
      message: input.message,
    });

    if (error) {
      if (error.code === '23505') return;
      console.error('Unable to log task activity:', error);
    }
  } catch (error: any) {
    if (error?.code === '23505') return;
    console.error('Unable to log task activity:', error);
  }
}

/** Resolves auth UUIDs to task_activity's integer user/task foreign keys. */
export async function logTaskActivityForAuthUser({
  authUserId,
  taskId,
  eventType,
  attemptNumber = null,
  status,
  score = null,
}: LogTaskActivityForAuthUserInput): Promise<void> {
  try {
    const [{ data: user, error: userError }, { data: task, error: taskError }] = await Promise.all([
      supabaseAdmin.from('users').select('id, full_name').eq('auth_id', authUserId).maybeSingle(),
      supabaseAdmin.from('tasks').select('id, task_number, user').eq('id', taskId).maybeSingle(),
    ]);

    if (userError || taskError || !user || !task || task.user !== authUserId) {
      if (userError || taskError) console.error('Unable to resolve task activity context:', userError || taskError);
      return;
    }

    // Automatically clean up date placeholders whenever a task event is logged
    await sanitizeAndFixTaskBrief(task.id);

    const studentName = user.full_name || 'Student';
    const week = task.task_number ?? null;
    const weekLabel = week ?? 'current';
    const messageByEvent: Record<TaskActivityEventType, string> = {
      task_generated: `${studentName} received Week ${weekLabel} task automatically`,
      task_generated_manually: `${studentName} manually generated Week ${weekLabel} task`,
      task_submitted: `${studentName} submitted Week ${weekLabel} task successfully`,
      task_submission_failed: `${studentName} was unable to submit Week ${weekLabel} task`,
      task_graded: `${studentName} scored ${score ?? 0}% on Week ${weekLabel} task`,
    };

    await logTaskActivity({
      userId: user.id,
      taskId: task.id,
      eventType,
      week,
      attemptNumber,
      status,
      score,
      message: messageByEvent[eventType],
    });
  } catch (error) {
    console.error('Unable to resolve task activity context:', error);
  }
}