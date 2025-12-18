import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Default AI persona configuration
const DEFAULT_AI_PERSONA_CONFIG = {
  role: "Mentor",
  tone: "encouraging",
  expertise: "general",
  instruction: "Complete the task as described.",
  duration: "1 hour"
};

interface TaskDefinition {
  title: string;
  brief_content: string;
  difficulty: string;
  ai_persona_config?: {
    role: string;
    tone: string;
    expertise: string;
    instruction: string;
    duration: string;
  };
}

// Define tasks for each track
const TRACK_TASKS: Record<string, TaskDefinition[]> = {
  'digital-marketing': [
    {
      title: "Scenario: ROAS Crash Analysis",
      brief_content: "Our Facebook Ad ROAS dropped from 4.0 to 1.2 yesterday. I've attached the campaign export CSV. Identify the bleeding ad set and write a 1-paragraph kill/scale recommendation.",
      difficulty: "intermediate",
      ai_persona_config: {
        role: "Miss Emem",
        tone: "professional",
        expertise: "Performance Marketing",
        instruction: "Submit a concise performance diagnosis and a clear kill/scale decision backed by metrics.",
        duration: "1 hr 30 mins"
      }
    },
    {
      title: "Crisis Comms: Server Outage",
      brief_content: "App is down. Twitter is toxic. Draft a push notification that apologizes without admitting liability, and a thread for the CEO.",
      difficulty: "advanced",
      ai_persona_config: {
        role: "Miss Emem",
        tone: "urgent",
        expertise: "PR & Comms",
        instruction: "Submit a full crisis communication strategy document.",
        duration: "1 hr 30 mins"
      }
    },
    {
      title: 'Complete Digital Marketing Fundamentals',
      brief_content: 'Learn the basics of digital marketing including SEO, SEM, and social media marketing',
      difficulty: 'beginner',
    },
    {
      title: 'Create Your First Marketing Campaign',
      brief_content: 'Design and execute a complete digital marketing campaign',
      difficulty: 'intermediate',
    },
    {
      title: 'Master Social Media Analytics',
      brief_content: 'Learn to analyze and optimize social media performance',
      difficulty: 'intermediate',
    }
  ],
  'web-development': [
    {
      title: 'HTML & CSS Fundamentals',
      brief_content: 'Master the building blocks of web development',
      difficulty: 'beginner',
    },
    {
      title: 'JavaScript Essentials',
      brief_content: 'Learn core JavaScript concepts and ES6+ features',
      difficulty: 'beginner',
    },
    {
      title: 'Build a Responsive Portfolio Website',
      brief_content: 'Create a fully responsive portfolio using HTML, CSS, and JavaScript',
      difficulty: 'intermediate',
    },
    {
      title: 'React.js Fundamentals',
      brief_content: 'Learn component-based architecture with React',
      difficulty: 'intermediate',
    },
    {
      title: 'Full-Stack Application Challenge',
      brief_content: 'Build a complete web application with frontend and backend',
      difficulty: 'advanced',
    }
  ],
  'data-science': [
    {
      title: 'Python for Data Science',
      brief_content: 'Learn Python programming fundamentals for data analysis',
      difficulty: 'beginner',
    },
    {
      title: 'Data Visualization with Matplotlib & Seaborn',
      brief_content: 'Master data visualization techniques',
      difficulty: 'beginner',
    },
    {
      title: 'Exploratory Data Analysis Project',
      brief_content: 'Analyze a real-world dataset and present insights',
      difficulty: 'intermediate',
    },
    {
      title: 'Machine Learning Fundamentals',
      brief_content: 'Learn supervised and unsupervised learning algorithms',
      difficulty: 'intermediate',
    },
    {
      title: 'Build a Predictive Model',
      brief_content: 'Create and deploy a machine learning model',
      difficulty: 'advanced',
    }
  ],
  'ui-ux': [
    {
      title: "Fix the Funnel: Cart Abandonment",
      brief_content: "60% of traffic drops off at the 'Shipping' page. Audit the UX screenshot provided. Propose 3 specific CRO changes to recover revenue.",
      difficulty: "intermediate",
      ai_persona_config: {
        role: "Miss Emem",
        tone: "analytical",
        expertise: "CRO & UX",
        instruction: "Provide actionable UX recommendations with rationale.",
        duration: "3 hrs"
      }
    },
    {
      title: 'UI/UX Design Principles',
      brief_content: 'Learn fundamental design principles and best practices',
      difficulty: 'beginner',
    },
    {
      title: 'Figma Essentials',
      brief_content: 'Master the tools and features of Figma',
      difficulty: 'beginner',
    },
    {
      title: 'Design a Mobile App Interface',
      brief_content: 'Create a complete mobile app design with wireframes and prototypes',
      difficulty: 'intermediate',
    },
    {
      title: 'User Research & Testing',
      brief_content: 'Conduct user research and usability testing',
      difficulty: 'intermediate',
    }
  ]
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, track } = body;

    if (!userId || !track) {
      return NextResponse.json(
        { success: false, error: 'User ID and track are required' },
        { status: 400 }
      );
    }

    // Get tasks for the specified track
    const tasksForTrack = TRACK_TASKS[track as keyof typeof TRACK_TASKS];

    if (!tasksForTrack) {
      return NextResponse.json(
        { success: false, error: 'Invalid track specified' },
        { status: 400 }
      );
    }

    // Prepare tasks with user_id and new schema fields
    const tasksToInsert = tasksForTrack.map((task) => ({
      user: userId,
      title: task.title,
      brief_content: task.brief_content,
      difficulty: task.difficulty,
      task_track: track,
      ai_persona_config: task.ai_persona_config || DEFAULT_AI_PERSONA_CONFIG,
      completed: false
    }));

    // Use admin client to bypass RLS, or fall back to regular client
    const dbClient = supabaseAdmin || supabase;

    // Insert tasks into the database
    const { data, error } = await dbClient
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error('Error inserting tasks:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${data.length} tasks generated successfully`,
      tasks: data
    });
  } catch (error) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
