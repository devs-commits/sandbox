"use client";



import { useState, useEffect, useRef } from "react";

import { StudentHeader } from "../../components/students/StudentHeader";

import { Button } from "../../components/ui/button";

import {

  FileText,

  Clock,

  Eye,

  User,

  ArrowRight,

  Download,

  Flame,

  Loader2,

  Sparkles,

  CheckCircle

} from "lucide-react";



import { useAuth } from "../../contexts/AuthContexts";

import { supabase } from "../../../lib/supabase";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { WhatsAppSupport } from "@/app/components/students/whatAppSupport";



import {

  buildLetterFileName,

  downloadLetterFromElement,

  type LetterType,

} from "../../../lib/generateReferenceLetter";

import {

  ReferenceLetterTemplate,

  type LetterData,

} from "../../components/letters/ReferenceLetterTemplate";



interface Task {

  id: number;

  title: string;

  brief_content: string;

  difficulty: string;

  task_track: string;

  completed: boolean;

}



export default function page() {



  const { user } = useAuth();

  const router = useRouter();



  const [tasks, setTasks] = useState<Task[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [streak, setStreak] = useState(0);

  const [weeksCompleted, setWeeksCompleted] = useState(0);

  const [downloading, setDownloading] = useState(false);

  const letterRef = useRef<HTMLDivElement>(null);

  const [letterData, setLetterData] = useState<LetterData>({

    fullName: "Student Name",

    track: "digital-marketing", 

    type: "12week"

  });



  const weeksRemaining12 = Math.max(12 - weeksCompleted, 0);

  const weeksRemaining24 = Math.max(24 - weeksCompleted, 0);





  const fetchUserData = async () => {

    if (!user) return;



    try {



      const [tasksResponse, userResponse] = await Promise.all([

        supabase.from("tasks").select("*").eq("user", user.id).order("id", { ascending: true }),

        supabase.from("users").select("created_at").eq("auth_id", user.id).single()

      ]);



      if (tasksResponse.error) console.error("Error fetching tasks:", tasksResponse.error);

      else setTasks(tasksResponse.data || []);



      if (userResponse.error) console.error("Error fetching user data:", userResponse.error);

      else if (userResponse.data?.created_at) {

        const weeksSinceJoining = Math.floor((new Date().getTime() - new Date(userResponse.data.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7));

        setWeeksCompleted(weeksSinceJoining);

      }

    } catch (error) {

      console.error("Error fetching user data:", error);

    } finally {

      setIsLoading(false);

    }

  };



  const updateStreak = async () => {

    if (!user) return;



    try {

      const response = await fetch("/api/users/streak", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ userId: user.id }),

      });



      if (response.ok) {

        const data = await response.json();

        if (data.streak !== undefined) {

          setStreak(data.streak);

        }

      }

    } catch (error) {

      console.error("Error updating streak:", error);

    }

  };



  useEffect(() => {

    fetchUserData();

    updateStreak();

  }, [user]);



  const getDifficultyColor = (difficulty: string) => {

    if (!difficulty) return "bg-purple-500/20 text-purple-500";



    switch (difficulty.toLowerCase()) {

      case "beginner":

        return "bg-green-500/20 text-green-500";

      case "intermediate":

        return "bg-yellow-500/20 text-yellow-500";

      case "advanced":

        return "bg-red-500/20 text-red-500";

      default:

        return "bg-purple-500/20 text-purple-500";

    }

  };



  const handleTaskClick = (taskId: number) => {

    router.push(`/student/office?taskId=${taskId}`);

  };



  const handleDownloadLetter = async (type: "work" | "visa") => {

    const letterType: LetterType = type === "work" ? "12week" : "24week";

    const requiredWeeks = type === "work" ? 1 : 1;

    

    if (weeksCompleted < requiredWeeks) {

      toast.error("Requirements not met", { 

        description: `You need ${requiredWeeks} weeks to unlock the ${type === "work" ? "Work" : "Visa"} letter.` 

      });

      return;

    }



    if (!user || !letterRef.current) {

      toast.error("Unable to generate letter");

      return;

    }



    try {

      setDownloading(true);

      

      // Get user data for the letter

      const { data: userData } = await supabase

        .from("users")

        .select("full_name, track")

        .eq("auth_id", user.id)

        .single();



      if (!userData?.full_name) {

        toast.error("User data not found");

        return;

      }



      const newLetterData: LetterData = {

        fullName: userData.full_name,

        track: userData.track || "digital-marketing",

        type: letterType,

        candidateId: undefined, // Will be auto-generated

        jobTitle: undefined, // Will be auto-generated

        projects: undefined, // Will use defaults

      };



      // Update the letter data state

      setLetterData(newLetterData);



      // Generate filename

      const fileName = buildLetterFileName(

        newLetterData.fullName,

        newLetterData.track || "digital-marketing",

        letterType

      );



      // Wait a moment for the state to update and re-render

      await new Promise(resolve => setTimeout(resolve, 100));



      // Download the letter

      await downloadLetterFromElement(letterRef.current, fileName);

      

      toast.success("Letter downloaded successfully!");

    } catch (error) {

      console.error("Error generating letter:", error);

      toast.error("Failed to generate letter");

    } finally {

      setDownloading(false);

    }

  };



  return (

    <div className="min-h-screen bg-background">

      <StudentHeader title="Headquarters" />

      <div className="p-4 lg:p-6 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <div className="bg-muted-foreground/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">

            <FileText size={18} />

            <div>

              <span className="text-sm">Tasks Done: </span>

              <span className="text-sm font-semibold">

                {tasks.filter(t => t.completed).length}/{tasks.length}

              </span>

            </div>

          </div>



          <div className="bg-green-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">

            <Clock size={18} />

            <div>

              <span className="text-sm">Streak: </span>

              <span className="text-sm font-semibold">Day {streak}</span>

            </div>

          </div>



          <div className="bg-red-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">

            <Eye size={18} />

            <span className="text-sm font-semibold">3 Recruiters viewing</span>

          </div>



          <div className="bg-purple-500/20 border border-border rounded-xl px-4 py-3 flex items-center gap-3">

            <User size={18} />

            <div>

              <span className="text-sm">Profile Stats: </span>

              <span className="text-sm font-semibold">32 Views</span>

            </div>

          </div>

        </div>



        <div className="bg-card border border-border rounded-xl p-5">

          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-4">

            <div className="flex items-start gap-3">

              <FileText className="text-purple-400" size={20} />

              <div>

                <h2 className="text-lg font-semibold">

                  Work and Visa Reference Letters

                </h2>

                <p className="text-sm text-muted-foreground">

                  Maintain your 12-weeks active streak to unlock verified immigration references.

                </p>

              </div>

            </div>



            <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-medium">

              <Flame size={14} />

              DAY {streak} STREAK

            </div>

          </div>



          <div className="mb-4">

            <div className="relative w-full bg-muted rounded-full h-2">

              <div

                className="bg-purple-600 h-2 rounded-full"

                style={{ width: `${Math.min((weeksCompleted / 24) * 100, 100)}%` }}

              />

              {weeksCompleted >= 12 && (

                <div

                  className="absolute top-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white -translate-y-1/2"

                  style={{ left: '50%', transform: 'translate(-50%, -50%)' }}

                  title="12 Weeks Completed - Work Letter Available"

                />

              )}

            </div>



            <div className="flex justify-between mt-1 text-xs text-muted-foreground">

              <p>{weeksCompleted} / 24 Weeks Completed</p>

              <p>24 Weeks (Visa Letter)</p>

            </div>



            <div className="flex justify-center mt-2 text-xs">

              <span className="text-muted-foreground">12 Weeks (Work Letter)</span>

            </div>

          </div>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="bg-muted/50 border border-border rounded-xl p-4 flex justify-between items-center">

              <div className="flex gap-3 items-center">

                <FileText size={20} />

                <div>

                  <p className="text-sm font-semibold">

                    WORK LETTER OF REFERENCE

                  </p>

                  <p className={`text-xs flex items-center gap-1 ${

                    weeksRemaining12 > 0 ? "text-orange-400" : "text-green-400"

                  }`}>

                    {weeksRemaining12 > 0

                      ? `Available in ${weeksRemaining12} week${weeksRemaining12 > 1 ? "s" : ""}`

                      : <>

                          <CheckCircle size={14}/>

                          Ready for Download

                        </>

                    }

                  </p>

                </div>

              </div>



              <Button

                size="sm"

                onClick={() => handleDownloadLetter("work")}

              >

                {downloading

                  ? <Loader2 size={14} className="animate-spin"/>

                  : <Download size={14}/>

                }

                Download

              </Button>

            </div>



            <div className="bg-muted/50 border border-border rounded-xl p-4 flex justify-between items-center">

              <div className="flex gap-3 items-center">

                <FileText size={20} />

                <div>

                  <p className="text-sm font-semibold">

                    VISA LETTER OF REFERENCE

                  </p>

                  <p className={`text-xs flex items-center gap-1 ${

                    weeksRemaining24 > 0 ? "text-orange-400" : "text-green-400"

                  }`}>

                    {weeksRemaining24 > 0

                      ? `Available in ${weeksRemaining24} week${weeksRemaining24 > 1 ? "s" : ""}`

                      : <>

                          <CheckCircle size={14}/>

                          Ready for Download

                        </>

                    }

                  </p>

                </div>

              </div>



              <Button

                size="sm"

                onClick={() => handleDownloadLetter("visa")}

              >

                {downloading

                  ? <Loader2 size={14} className="animate-spin"/>

                  : <Download size={14}/>

                }

                Download

              </Button>

            </div>

          </div>

        </div>

      </div>

      <WhatsAppSupport />

      {/* Hidden letter template for generation */}

      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>

        <ReferenceLetterTemplate 

          ref={letterRef}

          data={letterData}

        />

      </div>

    </div>

  );

}