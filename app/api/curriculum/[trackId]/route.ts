import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper: Calculate the upcoming Monday at 00:00:00 based on a given completion date
function getNextMonday(completionDate: string | Date) {
  const date = new Date(completionDate);
  const day = date.getDay();
  // Calculate days until next Monday (if today is Monday, it adds 7 days)
  const daysUntilMonday = day === 0 ? 1 : 8 - day; 
  date.setDate(date.getDate() + daysUntilMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> } // <-- Promise type for Next.js 15
) {
  try {
    const { trackId } = await params; // <-- Await params before reading trackId
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch weeks and nested modules
    const { data: weeks, error: weeksError } = await supabase
      .from('Week')
      .select(`id, weekNumber, focusArea, Module (id, dayNumber, type, topic, goal)`)
      .eq('trackId', trackId)
      .order('weekNumber', { ascending: true });

    if (weeksError) throw weeksError;

    // 2. Fetch user's progress records
    const { data: progressRecords, error: progressError } = await supabase
      .from('UserModuleProgress')
      .select('moduleId, status, startedAt, completedAt')
      .eq('userId', userId);

    if (progressError) throw progressError;

    const progressMap = new Map(progressRecords?.map((p) => [p.moduleId, p]) || []);
    const now = new Date();

    // 3. Process Locks and Map Data
    let previousWeekCompletedAt: string | null = null;

    const formattedCurriculum = (weeks || []).map((week, weekIndex) => {
      const sortedModules = (week.Module || []).sort((a: any, b: any) => a.dayNumber - b.dayNumber);
      
      let isWeekLocked = false;
      let unlockDate = null;

      if (weekIndex > 0) {
        if (!previousWeekCompletedAt) {
          isWeekLocked = true;
        } else {
          const nextMonday = getNextMonday(previousWeekCompletedAt);
          if (now < nextMonday) {
            isWeekLocked = true;
            unlockDate = nextMonday;
          }
        }
      }

      let allModulesCompletedInWeek = true;
      let lastCompletedDateInWeek = null;

      const processedModules = sortedModules.map((module: any, moduleIndex: number) => {
        const userProgress = progressMap.get(module.id) || { status: 'NOT_STARTED', completedAt: null };
        
        let isModuleLocked = isWeekLocked; 
        
        if (!isWeekLocked && moduleIndex > 0) {
          const previousModuleId = sortedModules[moduleIndex - 1].id;
          const previousModuleProgress = progressMap.get(previousModuleId);
          if (!previousModuleProgress || previousModuleProgress.status !== 'COMPLETED') {
            isModuleLocked = true;
          }
        }

        if (userProgress.status !== 'COMPLETED') {
          allModulesCompletedInWeek = false;
        } else {
          lastCompletedDateInWeek = userProgress.completedAt;
        }

        return {
          ...module,
          isLocked: isModuleLocked,
          userProgress,
        };
      });

      if (allModulesCompletedInWeek && lastCompletedDateInWeek) {
        previousWeekCompletedAt = lastCompletedDateInWeek;
      } else {
        previousWeekCompletedAt = null;
      }

      return {
        ...week,
        isLocked: isWeekLocked,
        unlockDate: unlockDate,
        modules: processedModules,
      };
    });

    return NextResponse.json({ success: true, curriculum: formattedCurriculum });
  } catch (error: any) {
    console.error('Curriculum Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch curriculum' }, { status: 500 });
  }
}