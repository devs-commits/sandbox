"use client";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContexts";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TaskGenerator } from "@/app/components/students/TaskGenerator";
import { Loader2, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface Message {
  id?: string;
  user_id: string;
  task_id: number;
  role: string;
  content: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  brief_content: string;
  difficulty: string;
  task_track: string;
  completed: boolean;
  ai_persona_config: any;
}

export default function TasksPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("taskId");
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  useEffect(() => {
    if (tasks.length > 0 && taskIdParam) {
      const task = tasks.find(t => t.id === Number(taskIdParam));
      if (task) {
        setActiveTask(task);
      }
    }
  }, [tasks, taskIdParam]);

  useEffect(() => {
    if (user && activeTask) {
      fetchChatHistory();
    }
  }, [user, activeTask]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoadingTasks(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user', user.id)
        .order('id', { ascending: true });
        
      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchChatHistory = async () => {
    if (!user || !activeTask) return;
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', activeTask.id)
      .order('created_at', { ascending: true });
    
    if (data) {
        setMessages(data);
    } else {
        setMessages([]);
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || !user || !activeTask) return;
    
    const userMsg: Message = {
        user_id: user.id,
        task_id: activeTask.id,
        role: 'user',
        content: inputText,
        created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
        // Save to Supabase
        const { error } = await supabase.from('chat_history').insert([userMsg]);
        if (error) throw error;

        const response = await fetch('https://wdc-labs.onrender.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMsg.content,
                user_info: {
                    id: user.id,
                    name: user.fullName,
                    role: user.role
                },
                task_context: {
                    title: activeTask.title,
                    description: activeTask.brief_content,
                    persona: activeTask.ai_persona_config
                }
            })
        });
        
        const data = await response.json();

        console.log("AI Response:", data);
        
        const aiMsg: Message = {
            user_id: user.id,
            task_id: activeTask.id,
            role: 'assistant',
            content: data.content,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMsg]);
        await supabase.from('chat_history').insert([aiMsg]);

    } catch (error) {
        console.error("Error sending message:", error);
    } finally {
        setLoading(false);
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!user || !activeTask) return;

    try {
      setIsUploading(true);
      toast.info("Uploading file...");

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${activeTask.id}/${Date.now()}.${fileExt}`;
      
      // Ensure bucket exists or handle error if it doesn't (assuming 'submissions' bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error("Storage Error: " + uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      toast.success("File uploaded. Analyzing...");

      // 2. Call API for Analysis
      const response = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeTask.id,
          userId: user.id,
          fileUrl: publicUrl,
          fileName: file.name
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      // 3. Update Chat
      setMessages(prev => [...prev, {
        user_id: user.id,
        task_id: activeTask.id,
        role: 'assistant',
        content: result.message,
        created_at: new Date().toISOString()
      }]);
      
      toast.success("Analysis complete!");

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!activeTask) {
    return (
      <div className="min-h-screen bg-background ">
        <StudentHeader 
        title="My Office" 
      />
      <p className="text-s pt-4 ml-6">Available simulation tailored to your skill track</p>
      
      {isLoadingTasks ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-6">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setActiveTask(task)}
              className="text-left rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <div className="text-xs uppercase opacity-70">
                {task.task_track}
              </div>

              <h3 className="mt-2 text-lg font-semibold">
                {task.title}
              </h3>

              <p className="mt-2 text-sm opacity-80 line-clamp-3">
                {task.brief_content}
              </p>

              <div className="mt-4 text-xs opacity-60 capitalize">
                {task.difficulty}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-6">
          <TaskGenerator onTasksGenerated={fetchTasks} />
        </div>
      )}
      </div>
    );
  }

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
          {activeTask.task_track}
        </div>

        <h1 className="mt-2 text-2xl font-semibold">
          {activeTask.title}
        </h1>

        <p className="mt-4 text-sm opacity-80">
          {activeTask.brief_content}
        </p>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-sm opacity-70">
            Drag & Drop Your File Here
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-4 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {isUploading ? "Uploading..." : "Browse Files"}
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold">
            {activeTask.ai_persona_config?.role || "Mentor"}
          </p>

          <p className="mt-2 text-sm opacity-80">
            {activeTask.ai_persona_config?.instruction || "Complete the task as described."}
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <div 
              ref={scrollRef}
              className="h-64 overflow-y-auto rounded-md border border-white/10 bg-black/20 p-4 space-y-4"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-cyan-500/20 text-cyan-100' 
                        : 'bg-white/10 text-white/90'
                    }`}
                  >
                    <div className="prose prose-invert prose-sm max-w-none [&_*]:text-inherit [&>p]:m-0 [&>p]:leading-normal">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white/90 rounded-lg px-3 py-2 text-sm animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..." 
                className="flex-1 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>

          <button className="mt-4 w-full rounded-md bg-cyan-500 py-2 text-sm font-medium">
            Get Hint ({activeTask.difficulty === 'beginner' ? '10' : '20'} XP)
          </button>
        </div>
      </div>
    </div>  
    </div>
  );
}
