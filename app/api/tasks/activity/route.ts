import { NextResponse } from 'next/server';
import { logTaskActivityForAuthUser } from '@/lib/task-activity';

export async function POST(request: Request) {
  try {
    const { user_id, task_id, generation_type } = await request.json();
    if (!user_id || !task_id || !['automatic', 'manual'].includes(generation_type)) {
      return NextResponse.json({ error: 'Missing or invalid activity fields' }, { status: 400 });
    }

    await logTaskActivityForAuthUser({
      authUserId: user_id,
      taskId: task_id,
      eventType: generation_type === 'manual' ? 'task_generated_manually' : 'task_generated',
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task activity endpoint error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
