"use client";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContexts";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TaskGenerator } from "@/app/components/students/TaskGenerator";
import { Loader2, Upload, FileText, Download } from "lucide-react";
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
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userLocation, setUserLocation] = useState<{
    country? : string;
    city? :string;
    timezone? : string
  } | null>(null);

  // 1. Fetch Tasks on Load
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // 2. Determine Active Task (First Incomplete)
  useEffect(() => {
    if (tasks.length > 0) {
      const current = tasks.find(t => !t.completed);
      setActiveTask(current || null);
    } else {
      setActiveTask(null);
    }
  }, [tasks]);

  // 3. Fetch Chat History when Active Task Changes
  useEffect(() => {
    if (user && activeTask) {
      fetchChatHistory();
    }
  }, [user, activeTask]);

  // 4. Auto-scroll Chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
  const fetchLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      setUserLocation({
        country: data.country_name,
        city: data.city,
        timezone: data.timezone,
      });
    } catch (error) {
      console.warn("Location fetch failed", error);
    }
  };

  fetchLocation();
}, []);


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

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user || !activeTask) return;
    
    const userMsg: Message = {
        user_id: user.id,
        task_id: activeTask.id,
        role: 'user',
        content: text,
        created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
        const { error } = await supabase.from('chat_history').insert([userMsg]);
        if (error) throw error;

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const { count } = await supabase
            .from('chat_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', start.toISOString());
        
        const greeted_today = !!count && count > 0;

        const chat_history = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMsg.content,
                user_info: {
                    user_id: user.id,
                    name: user.fullName || user.email,
                    role: user.role,
                    task_id: activeTask.id,
                    task_title: activeTask.title,
                    location: userLocation
                },
                chat_history: chat_history,
                greeted_today: greeted_today
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiContent = data.reply || data.content || data.message;

        const aiMsg: Message = {
            user_id: user.id,
            task_id: activeTask.id,
            role: 'assistant',
            content: aiContent,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMsg]);
        await supabase.from('chat_history').insert([aiMsg]);

    } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
    } finally {
        setLoading(false);
    }
  }

  const handleSend = async () => {
    await sendMessage(inputText);
    setInputText("");
  }

  const handleGetHint = async () => {
    if (!activeTask || !user) return;

    setLoading(true);
    
    const userMsg: Message = {
        user_id: user.id,
        task_id: activeTask.id,
        role: 'user',
        content: "Please give me a hint.",
        created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    await supabase.from('chat_history').insert([userMsg]);

    try {
      toast.info("Asking Miss Emem for a hint...");

      const response = await fetch('/api/tasks/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeTask.id,
          userId: user.id,
          taskTitle: activeTask.title,
          taskContent: activeTask.brief_content,
          userContext: "I'm stuck on this task.",
          location: userLocation,
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const hintMsg: Message = {
        user_id: user.id,
        task_id: activeTask.id,
        role: 'assistant',
        content: data.hint,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, hintMsg]);
      toast.success("Hint received!");

    } catch (error: any) {
      console.error("Error getting hint:", error);
      toast.error("Failed to get hint");
    } finally {
      setLoading(false);
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!user || !activeTask) return;

    try {
      setIsUploading(true);
      toast.info("Uploading file...");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${activeTask.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error("Storage Error: " + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      toast.success("File uploaded. Analyzing...");

      const uploadMsg: Message = {
        user_id: user.id,
        task_id: activeTask.id,
        role: 'user',
        content: `Uploaded file: ${file.name}:::${publicUrl}`,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, uploadMsg]);
      await supabase.from('chat_history').insert([uploadMsg]);

      const response = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeTask.id,
          userId: user.id,
          fileUrl: publicUrl,
          fileName: file.name,
          taskTitle: activeTask.title,
          taskContent: activeTask.brief_content,
          chatHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      setMessages(prev => [...prev, {
        user_id: user.id,
        task_id: activeTask.id,
        role: 'assistant',
        content: result.message,
        created_at: new Date().toISOString()
      }]);
      
      toast.success("Analysis complete!");

      // REFRESH TASKS to check if this one was marked complete
      await fetchTasks();

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

  if (isLoadingTasks) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // NO ACTIVE TASK -> Show Generator or "All Done"
  if (!activeTask) {
    return (
      <div className="min-h-screen bg-background">
        <StudentHeader title="My Office" />
        <div className="p-4 lg:p-6 max-w-3xl mx-auto text-center mt-10">
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">
                    {tasks.length > 0 ? "All Tasks Completed!" : "Welcome to Your Office"}
                </h2>
                <p className="text-muted-foreground text-lg">
                    {tasks.length > 0 
                        ? "Great job! You've cleared your desk. Ready for more?" 
                        : "Your desk is empty. Generate your first simulation to get started."}
                </p>
            </div>
            <TaskGenerator onTasksGenerated={fetchTasks} />
        </div>
      </div>
    );
  }

  // ACTIVE TASK VIEW
  return (
    <div className="min-h-screen bg-background">
      <StudentHeader title="My Office" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 lg:p-6 bg-background/20">
        
        {/* Left Column: Task Details */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
             <div className="text-xs uppercase opacity-70 tracking-wider font-semibold text-cyan-400">
                {activeTask.task_track}
             </div>
             <div className="text-xs px-2 py-1 rounded bg-white/10 opacity-70 capitalize">
                {activeTask.difficulty}
             </div>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {activeTask.title}
          </h1>

          <div className="mt-4 text-sm opacity-80 leading-relaxed prose prose-invert prose-sm max-w-none [&>p]:mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeTask.brief_content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Right Column: Workspace (Chat & Upload) */}
        <div className="space-y-6">
          
          {/* File Upload Area */}
          <div className="rounded-xl border border-dashed border-white/20 p-6 text-center hover:bg-white/5 transition-colors">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png"
            />
            <p className="text-sm opacity-70 mb-2">
              Drag & Drop Your File Here
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported formats: PDF, DOCX, TXT, ZIP, Images (Max 10MB)
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-md bg-cyan-500 px-6 py-2.5 text-sm font-medium disabled:opacity-50 flex items-center gap-2 mx-auto hover:bg-cyan-600 transition-all"
            >
              {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Uploading..." : "Browse Files"}
            </button>
          </div>

          {/* Chat Interface */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 pb-4 border-b border-white/10">
                <p className="text-sm font-semibold text-cyan-400">
                    {activeTask.ai_persona_config?.role || "Mentor"}
                </p>
                <p className="mt-1 text-xs opacity-60">
                    {activeTask.ai_persona_config?.instruction || "Here to help you complete this task."}
                </p>
            </div>

            <div className="flex flex-col gap-4">
              <div 
                ref={scrollRef}
                className="h-[400px] overflow-y-auto rounded-md border border-white/10 bg-black/20 p-4 space-y-4"
              >
                {messages.map((msg, idx) => {
                  const isFileUpload = msg.content.startsWith("Uploaded file: ");
                  let fileName = "";
                  let fileUrl = "";

                  if (isFileUpload) {
                      const parts = msg.content.replace("Uploaded file: ", "").split(":::");
                      fileName = parts[0];
                      if (parts.length > 1) {
                          fileUrl = parts[1];
                      }
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                          msg.role === 'user' 
                            ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30' 
                            : 'bg-white/10 text-white/90 border border-white/10'
                        }`}
                      >
                        {isFileUpload ? (
                          <a 
                              href={fileUrl || "#"} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-1 ${fileUrl ? 'cursor-pointer hover:bg-white/5 rounded transition-colors' : ''}`}
                              onClick={(e) => !fileUrl && e.preventDefault()}
                          >
                            <div className="bg-white/10 p-2 rounded-md">
                              <FileText className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[150px]">{fileName}</span>
                              <span className="text-xs opacity-60">
                                  {fileUrl ? "Click to download" : "File attached"}
                              </span>
                            </div>
                            {fileUrl && <Download className="h-4 w-4 opacity-50 ml-2" />}
                          </a>
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none [&_*]:text-inherit [&>p]:m-0 [&>p]:leading-normal">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]} 
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-white/90 rounded-lg px-4 py-3 text-sm animate-pulse flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Typing...
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
                  className="flex-1 rounded-md border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-500 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={loading}
                  className="rounded-md bg-white/10 px-6 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>

            <button 
              onClick={handleGetHint}
              disabled={loading}
              className="mt-4 w-full rounded-md border border-cyan-500/30 bg-cyan-500/10 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              Get Hint ({activeTask.difficulty === 'beginner' ? '10' : '20'} XP)
            </button>
          </div>
        </div>
      </div>  
    </div>
  );
}