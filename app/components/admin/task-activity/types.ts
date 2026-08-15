export type TaskActivityEventType =
  | 'task_generated'
  | 'task_generated_manually'
  | 'task_submitted'
  | 'task_submission_failed'
  | 'task_graded';

export interface TaskActivityItem {
  id: string;
  user_id: number;
  task_id: number | null;
  event_type: TaskActivityEventType;
  week: number | null;
  attempt_number: number | null;
  status: 'success' | 'failed' | 'pending' | string | null;
  score: number | string | null;
  message: string;
  created_at: string;
  student: {
    id: number;
    full_name: string | null;
    email: string | null;
    track: string | null;
    avatar_url: string | null;
  } | null;
  task: {
    id: number;
    title: string | null;
    task_number: number | null;
    task_track: string | null;
    status: string | null;
    created_at: string | null;
  } | null;
}

export interface ManualGenerationWatchStudent {
  userId: number;
  fullName: string;
  track: string | null;
  avatarUrl: string | null;
  count: number;
}

export interface TaskActivityResponse {
  activities: TaskActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  tracks: string[];
  summary: {
    totalActivities: number;
    manualGenerations: number;
    successfulSubmissions: number;
    submissionFailures: number;
  };
  manualGenerationWatch: ManualGenerationWatchStudent[];
}
