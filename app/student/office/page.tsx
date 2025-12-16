"use client";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { useState } from "react";

type TaskKey = keyof typeof tasks;
export const tasks = {
  roas_crash: {
    id: "roas_crash",
    category: "Performance Marketing",
    title: "ROAS Crash Analysis",
    duration: "1 hr 30 mins",
    brief:
      "Our Facebook Ad ROAS dropped from 4.0 to 1.2 yesterday. Identify the bleeding ad set and write a 1-paragraph kill/scale recommendation.",
    director: "Miss Emem",
    instruction:
      "Submit a concise performance diagnosis and a clear kill/scale decision backed by metrics.",
    xp: 50,
  },

  cart_abandonment: {
    id: "cart_abandonment",
    category: "CRO & UX",
    title: "Fix the Funnel: Cart Abandonment",
    duration: "3 hrs",
    brief:
      "60% of traffic drops off at the Shipping page. Propose 3 CRO changes to recover revenue.",
    director: "Miss Emem",
    instruction:
      "Provide actionable UX recommendations with rationale.",
    xp: 75,
  },

  crisis_comms: {
    id: "crisis_comms",
    category: "PR & Comms",
    title: "Crisis Comms: Server Outage",
    duration: "1 hr 30 mins",
    brief:
      "App is down. Twitter is toxic. Draft a push notification and a CEO thread.",
    director: "Miss Emem",
    instruction:
      "Submit a full crisis communication strategy document.",
    xp: 50,
  },
};


export default function TasksPage() {
  const [activeTask, setActiveTask] = useState<TaskKey | null>(null);
  if (!activeTask) {
    return (
      <div className="min-h-screen bg-background ">
        <StudentHeader 
        title="My Office" 
      />
      <p className="text-s pt-4 ml-6">Available simulation tailored to your skill track</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-6">
        {Object.values(tasks).map((task) => (
          <button
            key={task.id}
            onClick={() => setActiveTask(task.id as TaskKey)}
            className="text-left rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
          >
            <div className="text-xs uppercase opacity-70">
              {task.category}
            </div>

            <h3 className="mt-2 text-lg font-semibold">
              {task.title}
            </h3>

            <p className="mt-2 text-sm opacity-80">
              {task.brief}
            </p>

            <div className="mt-4 text-xs opacity-60">
              {task.duration}
            </div>
          </button>
        ))}
      </div>
      </div>
    );
  }

  const task = tasks[activeTask];
  return (
    <div className="min-h-screen bg-background ">
      <StudentHeader 
        title="My Office" 
      />
    <div className="grid grid-cols-2 gap-6 p-6 bg-background/20">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <button
          onClick={() => setActiveTask(null)}
          className="mb-4 text-sm opacity-60 hover:opacity-100"
        >
          ← Back
        </button>

        <div className="text-xs uppercase opacity-70">
          {task.category}
        </div>

        <h1 className="mt-2 text-2xl font-semibold">
          {task.title}
        </h1>

        <p className="mt-4 text-sm opacity-80">
          {task.brief}
        </p>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
          <p className="text-sm opacity-70">
            Drag & Drop Your File Here
          </p>
          <button className="mt-4 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium">
            Browse Files
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold">
            {task.director}
          </p>

          <p className="mt-2 text-sm opacity-80">
            {task.instruction}
          </p>

          <button className="mt-4 w-full rounded-md bg-cyan-500 py-2 text-sm font-medium">
            Get Hint ({task.xp} XP)
          </button>
        </div>
      </div>
    </div>  
    </div>
  );
}
