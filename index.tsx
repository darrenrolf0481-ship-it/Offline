
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Ollama } from 'ollama/browser';
import { 
  CloudOff, 
  MessageSquare, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Search, 
  Bell, 
  User, 
  Terminal, 
  Cpu, 
  HardDrive, 
  Activity,
  Send,
  Plus,
  Trash2,
  ChevronRight,
  Monitor,
  Zap,
  Play,
  ShieldCheck,
  Cpu as Processor,
  X,
  Github,
  Upload,
  Menu,
  ArrowLeft,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Download,
  Mic,
  MicOff,
  History,
  Sparkles,
  Search as SearchIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceArea
} from 'recharts';

// --- Constants & Types ---
interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  summary: string;
  updatedAt: number;
}

interface LLMConfig {
  provider: 'ollama' | 'custom';
  endpoint: string;
  model: string;
  systemPrompt: string;
}

interface DownloadProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  percent?: number;
}

const POPULAR_MODELS = [
  { name: 'llama3:8b', size: '4.7GB', desc: 'Most popular general purpose model' },
  { name: 'phi3:mini', size: '2.3GB', desc: 'Powerful small model for faster inference' },
  { name: 'mistral:latest', size: '4.1GB', desc: 'Reliable and fast open source model' },
  { name: 'gemma2:9b', size: '5.5GB', desc: 'Google\'s latest lightweight model' },
  { name: 'tinyllama:latest', size: '637MB', desc: 'Ultra-small for low resource systems' },
  { name: 'moondream:latest', size: '829MB', desc: 'Vision-capable small model' },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ icon: Icon, label, value, status }: { icon: any, label: string, value: string, status: string }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors">
    <div className="p-3 bg-slate-800 rounded-lg text-blue-400">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-bold text-slate-100">{value}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
          status === 'optimal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {status}
        </span>
      </div>
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assistant' | 'notes' | 'terminal' | 'sentinel'>('dashboard');
  const [notes, setNotes] = useState<Note[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileNotesEditorOpen, setIsMobileNotesEditorOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubConfig, setGithubConfig] = useState({
    owner: '',
    repo: '',
    path: '',
    branch: 'main'
  });
  const [githubImportStatus, setGithubImportStatus] = useState<{ loading: boolean; error: string | null; success: boolean }>({
    loading: false,
    error: null,
    success: false
  });
  
  // Terminal State
  const [terminalCode, setTerminalCode] = useState('// JavaScript Sandbox\nconsole.log("System initialization complete...");\n\nconst greet = (name) => `Secure interaction with ${name} node established.`;\nconsole.log(greet("Local Agent"));');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [phiValue, setPhiValue] = useState(0);
  const [phiHistory, setPhiHistory] = useState<{ time: string, value: number, upper: number, lower: number }[]>([]);
  
  // LLM Config
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    model: 'llama3',
    systemPrompt: 'You are a helpful local AI assistant running on a secure Offline Hub. Your responses should be concise, professional, and private.'
  });
  const [models, setModels] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Sentinel Calculation: Phi = (sum W_i * X_i) + n*B +/- Delta_11.3
  useEffect(() => {
    const calculateSentinel = () => {
      const n = notes.length + models.length;
      const b = 1.25; // System bias
      const delta = 11.3;
      
      // Calculate sum(W_i * X_i)
      // W_i = scale of node (note length / 1000)
      // X_i = 1 for active
      const sumWX = notes.reduce((acc, note) => acc + (note.content.length / 1000), 0) + (models.length * 0.5);
      
      const phi = sumWX + (n * b);
      const upper = phi + delta;
      const lower = Math.max(0, phi - delta);
      
      setPhiValue(phi);
      setPhiHistory(prev => {
        const next = [...prev, { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          value: parseFloat(phi.toFixed(2)),
          upper: parseFloat(upper.toFixed(2)),
          lower: parseFloat(lower.toFixed(2))
        }];
        return next.slice(-20); // Keep last 20 points
      });
    };

    calculateSentinel();
    const interval = setInterval(calculateSentinel, 5000);
    return () => clearInterval(interval);
  }, [notes, models]);
  
  // Pull Logic
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<DownloadProgress | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastOllamaRef = useRef<Ollama | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newNote: Note = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: file.name,
          content: content || 'Empty file',
          updatedAt: Date.now(),
        };
        setNotes(prev => [newNote, ...prev]);
      };
      reader.readAsText(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGithubImport = async () => {
    const { owner, repo, path, branch } = githubConfig;
    if (!owner || !repo) {
      setGithubImportStatus({ loading: false, error: 'Owner and Repo are required', success: false });
      return;
    }

    setGithubImportStatus({ loading: true, error: null, success: false });

    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch from GitHub. Ensure repo is public and details are correct.');
      
      const data = await response.json();
      const filesToImport = Array.isArray(data) ? data.filter((item: any) => item.type === 'file') : [data];

      if (filesToImport.length === 0) {
        throw new Error('No files found at this path.');
      }

      for (const fileMetadata of filesToImport) {
        const fileResponse = await fetch(fileMetadata.download_url);
        const content = await fileResponse.text();
        
        const newNote: Note = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: `[GH] ${fileMetadata.name}`,
          content: content,
          updatedAt: Date.now(),
        };
        setNotes(prev => [newNote, ...prev]);
      }

      setGithubImportStatus({ loading: false, error: null, success: true });
      setTimeout(() => {
        setIsGithubModalOpen(false);
        setGithubImportStatus({ loading: false, error: null, success: false });
      }, 1500);
    } catch (error) {
      setGithubImportStatus({ loading: false, error: error instanceof Error ? error.message : 'Unknown error', success: false });
    }
  };

  // Get Ollama client
  const getOllama = () => {
    if (!lastOllamaRef.current || lastOllamaRef.current.config.host !== llmConfig.endpoint) {
      lastOllamaRef.current = new Ollama({ host: llmConfig.endpoint });
    }
    return lastOllamaRef.current;
  };

  // Check connection and fetch models
  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const ollama = getOllama();
      const response = await ollama.list();
      const availableModels = response.models.map(m => m.name);
      setModels(availableModels);
      if (availableModels.length > 0 && !availableModels.includes(llmConfig.model)) {
        // Only auto-switch if the current model doesn't exist and we have alternatives
        if (llmConfig.model === 'llama3' && !availableModels.includes('llama3')) {
           setLlmConfig(prev => ({ ...prev, model: availableModels[0] }));
        }
      }
      setConnectionStatus('connected');
    } catch (error) {
      console.error('LLM Connection failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const pullModel = async (modelName: string) => {
    setPullingModel(modelName);
    setPullProgress(null);
    setPullError(null);
    
    try {
      const ollama = getOllama();
      const stream = await ollama.pull({ model: modelName, stream: true });
      
      for await (const part of stream) {
        if (part.total && part.completed) {
          const percent = Math.round((part.completed / part.total) * 100);
          setPullProgress({ ...part, percent });
        } else {
          setPullProgress({ status: part.status });
        }
      }
      
      // Refresh models after successful pull
      await checkConnection();
      setPullingModel(null);
      setPullProgress({ status: 'Completed' });
      setTimeout(() => setPullProgress(null), 3000);
    } catch (error) {
      console.error('Pull failed:', error);
      setPullError(error instanceof Error ? error.message : 'Unknown error');
      setPullingModel(null);
    }
  };

  useEffect(() => {
    const savedConfig = localStorage.getItem('hub_llm_config');
    if (savedConfig) {
      setLlmConfig(JSON.parse(savedConfig));
    }
    checkConnection();
  }, []);

  useEffect(() => {
    localStorage.setItem('hub_llm_config', JSON.stringify(llmConfig));
    checkConnection();
  }, [llmConfig.endpoint]);

  // Initialize
  useEffect(() => {
    const savedNotes = localStorage.getItem('hub_notes');
    if (savedNotes) {
      const parsed = JSON.parse(savedNotes);
      setNotes(parsed);
      if (parsed.length > 0) setSelectedNoteId(parsed[0].id);
    }

    const savedSessions = localStorage.getItem('hub_sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Sync Notes to Local Storage
  useEffect(() => {
    localStorage.setItem('hub_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('hub_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const summarizeChat = async () => {
    if (chatHistory.length < 2) {
      setChatHistory([]);
      return;
    }

    setIsTyping(true);
    try {
      const ollama = getOllama();
      const chatContext = chatHistory.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      const response = await ollama.chat({
        model: llmConfig.model,
        messages: [
          { role: 'system', content: 'Summarize the following conversation in one or two sentences. Focus on the main topics discussed.' },
          { role: 'user', content: chatContext }
        ],
        stream: false
      });

      const newSession: ChatSession = {
        id: Date.now().toString(),
        messages: [...chatHistory],
        summary: response.message.content,
        updatedAt: Date.now()
      };

      setSessions(prev => [newSession, ...prev]);
      setChatHistory([]);
    } catch (error) {
      console.error('Summarization failed:', error);
      // Fallback: save anyway without summary or with generic
      const newSession: ChatSession = {
        id: Date.now().toString(),
        messages: [...chatHistory],
        summary: 'No summary available (Connection error)',
        updatedAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setChatHistory([]);
    } finally {
      setIsTyping(false);
    }
  };

  // Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Entry',
      content: '',
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setActiveTab('notes');
    setIsMobileNotesEditorOpen(true);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    const filtered = notes.filter(n => n.id !== id);
    setNotes(filtered);
    if (selectedNoteId === id) {
      setSelectedNoteId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleAssistantSend = async () => {
    if (!userInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: userInput };
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    try {
      const ollama = getOllama();
      const messages = [];
      
      if (llmConfig.systemPrompt) {
        messages.push({ role: 'system', content: llmConfig.systemPrompt });
      }
      
      messages.push({ role: 'user', content: userMsg.text });

      const response = await ollama.chat({
        model: llmConfig.model,
        messages: messages,
        stream: false,
      });

      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        text: response.message.content
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Inference error:', error);
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        text: `Error connecting to local engine: ${error instanceof Error ? error.message : 'Unknown error'}. 

Please ensure Ollama is running at ${llmConfig.endpoint} and that you have configured OLLAMA_ORIGINS to allow this domain.

Example command for macOS/Linux:
OLLAMA_ORIGINS="*" ollama serve` 
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const runCode = () => {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args: any[]) => {
      logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
      originalLog(...args);
    };
    
    console.error = (...args: any[]) => {
      logs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };

    try {
      // Create a wrapper to execute code in self-invoking function scope
      const result = new Function(terminalCode)();
      if (result !== undefined) {
        logs.push(`RESULT: ${String(result)}`);
      }
    } catch (err) {
      logs.push(`RUNTIME ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setTerminalOutput(prev => [...prev, `--- Execution @ ${new Date().toLocaleTimeString()} ---`, ...logs, ' ']);
    }
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="flex h-screen bg-[#0b0e14] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : -300,
          width: isSidebarOpen ? 288 : 0,
          opacity: isSidebarOpen ? 1 : 0
        }}
        variants={{
          desktop: { x: 0, width: 288, opacity: 1 }
        }}
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col p-6 bg-[#0f1219] border-r border-slate-800 transition-all lg:translate-x-0 lg:w-72 lg:opacity-100 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden lg:w-72'}`}
      >
        <div className="flex items-center justify-between mb-10 px-2 min-w-[240px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">Offline Hub</h1>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Local Core</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 min-w-[240px]">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={MessageSquare} 
            label="Local Assistant" 
            active={activeTab === 'assistant'} 
            onClick={() => { setActiveTab('assistant'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Knowledge Base" 
            active={activeTab === 'notes'} 
            onClick={() => { setActiveTab('notes'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={Terminal} 
            label="Code Sandbox" 
            active={activeTab === 'terminal'} 
            onClick={() => { setActiveTab('terminal'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={ShieldCheck} 
            label="Secure Sentinel" 
            active={activeTab === 'sentinel'} 
            onClick={() => { setActiveTab('sentinel'); setIsSidebarOpen(false); }} 
          />
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-slate-800 min-w-[240px]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
            connectionStatus === 'connected' 
              ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
              : connectionStatus === 'checking'
              ? 'text-amber-400 bg-amber-500/5 border-amber-500/20'
              : 'text-rose-400 bg-rose-500/5 border-rose-500/20'
          }`}>
            {connectionStatus === 'connected' ? <ShieldCheck size={18} /> : connectionStatus === 'checking' ? <RefreshCcw size={18} className="animate-spin" /> : <AlertCircle size={18} />}
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold truncate">{connectionStatus === 'connected' ? 'LLM Connected' : connectionStatus === 'checking' ? 'Connecting...' : 'LLM Offline'}</span>
              <span className="text-[9px] opacity-70 truncate uppercase font-bold tracking-wider">{llmConfig.model}</span>
            </div>
          </div>
          <SidebarItem icon={Settings} label="System Config" active={isSettingsOpen} onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }} />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-[#0b0e14]/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-base lg:text-lg font-bold capitalize truncate">{activeTab.replace('-', ' ')}</h2>
            {activeTab === 'assistant' && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold tracking-widest">
                  <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className={connectionStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400'}>{llmConfig.model}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsViewingHistory(!isViewingHistory)}
                    className={`p-1.5 rounded-lg transition-colors ${isViewingHistory ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    title="Chat History"
                  >
                    <History size={16} />
                  </button>
                  {!isViewingHistory && chatHistory.length > 0 && (
                    <button 
                      onClick={summarizeChat}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors flex items-center gap-2 text-xs font-bold px-3"
                      title="End and Summarize Chat"
                    >
                      <Sparkles size={14} />
                      <span className="hidden sm:inline">End & Summarize</span>
                    </button>
                  )}
                  {isViewingHistory && (
                    <button 
                      onClick={() => { setIsViewingHistory(false); setSelectedSessionId(null); }}
                      className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors flex items-center gap-2 text-xs font-bold px-3"
                    >
                      <Plus size={14} />
                      <span>New Chat</span>
                    </button>
                  )}
                </div>
              </>
            )}
            {activeTab === 'notes' && (
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  multiple 
                  accept=".txt,.md,.json,.js,.ts,.py,.c,.cpp,.h,.java,.go"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-2 px-3 text-xs font-bold"
                  title="Upload local files"
                >
                  <Upload size={14} />
                  <span className="hidden sm:inline">Upload</span>
                </button>
                <button 
                  onClick={() => setIsGithubModalOpen(true)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 flex items-center gap-2 px-3 text-xs font-bold"
                  title="Import from GitHub"
                >
                  <Github size={14} />
                  <span className="hidden sm:inline">GitHub</span>
                </button>
                <button 
                  onClick={addNote}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors shrink-0 flex items-center gap-2 px-3 text-xs font-bold"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">New Entry</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-slate-900 border border-slate-800 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all w-48 lg:w-64"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-all">
              <Bell size={18} lg:size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User size={16} lg:size={18} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 relative custom-scrollbar">
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div 
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-[#0b0e14]/60"
                onClick={() => setIsSettingsOpen(false)}
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-5 lg:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <h3 className="text-lg lg:text-xl font-bold flex items-center gap-2">
                      <Settings className="text-blue-500" size={20} lg:size={24} />
                      System Configuration
                    </h3>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                      <X size={18} lg:size={20} />
                    </button>
                  </div>
                  
                  <div className="p-5 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">System Prompt</label>
                        <textarea 
                          value={llmConfig.systemPrompt}
                          onChange={(e) => setLlmConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                          placeholder="Define the assistant's persona..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
                        />
                        <p className="text-[10px] text-slate-500">This instruction is sent to the local model at the start of every conversation.</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Local LLM Interface</h4>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Provider Endpoint</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={llmConfig.endpoint}
                            onChange={(e) => setLlmConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                            placeholder="http://localhost:11434"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                          <button 
                            onClick={checkConnection}
                            className="px-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
                          >
                            <RefreshCcw size={16} className={connectionStatus === 'checking' ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Active Model</label>
                        <div className="flex gap-2">
                          {models.length > 0 ? (
                            <select 
                              value={llmConfig.model}
                              onChange={(e) => setLlmConfig(prev => ({ ...prev, model: e.target.value }))}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            >
                              {models.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex-1 p-2.5 bg-slate-950/50 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-sm">
                              No models found.
                            </div>
                          )}
                          <button 
                            onClick={() => setIsDownloadModalOpen(true)}
                            className="px-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase"
                          >
                            <Download size={16} />
                            Get Models
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                      <h5 className="text-xs font-bold text-blue-400 uppercase">Pro Tip: CORS Settings</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        To allow this web app to talk to Ollama, you must set the <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-300">OLLAMA_ORIGINS</code> environment variable to allow this domain or Use <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-300">OLLAMA_ORIGINS="*"</code> for development.
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-6 bg-slate-950 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                    >
                      Apply & Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isDownloadModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-8 bg-[#0b0e14]/80 backdrop-blur-md"
                onClick={() => !pullingModel && setIsDownloadModalOpen(false)}
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Download className="text-blue-500" size={24} />
                      Download Models
                    </h3>
                    {!pullingModel && (
                      <button onClick={() => setIsDownloadModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {pullingModel ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle 
                              className="text-slate-800 stroke-current" 
                              strokeWidth="8" 
                              fill="transparent" 
                              r="40" cx="50" cy="50" 
                            />
                            <circle 
                              className="text-blue-500 stroke-current transition-all duration-300" 
                              strokeWidth="8" 
                              strokeDasharray={`${(pullProgress?.percent || 0) * 2.51} 251`}
                              strokeLinecap="round" 
                              fill="transparent" 
                              r="40" cx="50" cy="50" 
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold font-mono">{pullProgress?.percent || 0}%</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold">Downloading {pullingModel}</h4>
                          <p className="text-slate-500 text-sm mt-1">{pullProgress?.status || 'Starting...'}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {pullError && (
                          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="text-rose-500 shrink-0" size={20} />
                            <div className="text-sm text-rose-300">
                              <p className="font-bold">Download Failed</p>
                              <p className="opacity-80">{pullError}</p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {POPULAR_MODELS.map(model => (
                            <button
                              key={model.name}
                              onClick={() => pullModel(model.name)}
                              disabled={models.includes(model.name)}
                              className={`p-4 rounded-2xl border text-left transition-all ${
                                models.includes(model.name)
                                  ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80 cursor-default'
                                  : 'bg-slate-950/50 border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 group'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-bold ${models.includes(model.name) ? 'text-emerald-400' : 'group-hover:text-blue-400'}`}>
                                  {model.name}
                                </span>
                                {models.includes(model.name) ? (
                                  <CheckCircle2 size={16} className="text-emerald-500" />
                                ) : (
                                  <Download size={16} className="text-slate-600 group-hover:text-blue-400" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{model.desc}</p>
                              <div className="mt-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">{model.size}</div>
                            </button>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manual Download</label>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const m = formData.get('model-name') as string;
                            if (m) pullModel(m);
                          }} className="flex gap-2">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                              <input 
                                name="model-name"
                                type="text" 
                                placeholder="Enter model name (e.g. codellama)"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <button 
                              type="submit"
                              className="px-6 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors font-bold text-sm"
                            >
                              Pull
                            </button>
                          </form>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                    <div className="text-[10px] text-slate-600 max-w-[60%]">
                      Downloading models can consume significant bandwidth and storage. Models are stored locally on your device.
                    </div>
                    <button 
                      disabled={!!pullingModel}
                      onClick={() => setIsDownloadModalOpen(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-8 rounded-xl transition-all disabled:opacity-50"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {isGithubModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-8 bg-[#0b0e14]/80 backdrop-blur-md"
                onClick={() => !githubImportStatus.loading && setIsGithubModalOpen(false)}
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Github className="text-white" size={24} />
                      GitHub Import
                    </h3>
                    {!githubImportStatus.loading && (
                      <button onClick={() => setIsGithubModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Username / Org</label>
                        <input 
                          type="text" 
                          placeholder="e.g. facebook"
                          value={githubConfig.owner}
                          onChange={e => setGithubConfig(prev => ({ ...prev, owner: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Repository</label>
                        <input 
                          type="text" 
                          placeholder="e.g. react"
                          value={githubConfig.repo}
                          onChange={e => setGithubConfig(prev => ({ ...prev, repo: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Path (File or Folder)</label>
                      <input 
                        type="text" 
                        placeholder="README.md or src/components"
                        value={githubConfig.path}
                        onChange={e => setGithubConfig(prev => ({ ...prev, path: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Branch</label>
                      <input 
                        type="text" 
                        placeholder="main or master"
                        value={githubConfig.branch}
                        onChange={e => setGithubConfig(prev => ({ ...prev, branch: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {githubImportStatus.error && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                        {githubImportStatus.error}
                      </div>
                    )}
                    
                    {githubImportStatus.success && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        Successfully imported files!
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
                    <button 
                      disabled={githubImportStatus.loading}
                      onClick={() => setIsGithubModalOpen(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-xl transition-all disabled:opacity-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleGithubImport}
                      disabled={githubImportStatus.loading || !githubConfig.owner || !githubConfig.repo}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center gap-2"
                    >
                      {githubImportStatus.loading ? (
                        <>
                          <RefreshCcw size={16} className="animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Import Now
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Cpu} label="System Load" value="18.5%" status="optimal" />
                <StatCard icon={HardDrive} label="Hub Storage" value="482 GB" status="optimal" />
                <StatCard icon={Processor} label="Local Engine" value={connectionStatus === 'connected' ? 'Active' : 'Offline'} status={connectionStatus === 'connected' ? 'optimal' : 'warning'} />
                <StatCard icon={Zap} label="Latency" value={connectionStatus === 'connected' ? '2ms' : '--'} status={connectionStatus === 'connected' ? 'optimal' : 'warning'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-6 min-h-[300px] lg:h-80 flex flex-col">
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm lg:text-base">
                      <Terminal size={18} className="text-blue-400" />
                      Local Diagnostics
                    </h3>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 font-mono text-[11px] lg:text-sm text-slate-500 overflow-hidden relative">
                    <div className="space-y-1.5 lg:space-y-1">
                      <p><span className="text-emerald-500 mr-2">➜</span> Initializing Offline Hub protocols...</p>
                      <p><span className="text-emerald-500 mr-2">➜</span> Local knowledge base: CONNECTED</p>
                      <p><span className="text-emerald-500 mr-2">➜</span> Cloud API bridge: DISCONNECTED</p>
                      <p><span className="text-emerald-500 mr-2">➜</span> Local Intelligence Node: STANDBY</p>
                      <p><span className="text-slate-600 italic">Scanning local system for nodes...</span></p>
                      <p><span className="text-blue-400 font-bold">Secure Node Operational Layer 5.0.1</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-6 min-h-[300px] lg:h-80 overflow-hidden flex flex-col">
                  <h3 className="font-bold text-slate-300 mb-4 text-sm lg:text-base">Recent Local Entries</h3>
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {notes.slice(0, 5).map(note => (
                      <button 
                        key={note.id}
                        onClick={() => { setActiveTab('notes'); setSelectedNoteId(note.id); }}
                        className="w-full text-left p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all group"
                      >
                        <h4 className="font-medium text-slate-200 text-sm truncate">{note.title || 'Untitled Entry'}</h4>
                        <p className="text-xs text-slate-500 mt-1">{new Date(note.updatedAt).toLocaleDateString()}</p>
                      </button>
                    ))}
                    {notes.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                        <FileText size={32} />
                        <p className="text-xs">No local data found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1 overflow-y-auto space-y-6 px-2 mb-6 custom-scrollbar">
                {isViewingHistory ? (
                  <div className="space-y-4">
                    {selectedSessionId ? (
                      <div className="space-y-6">
                        <button 
                          onClick={() => setSelectedSessionId(null)}
                          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                        >
                          <ArrowLeft size={16} />
                          Back to sessions
                        </button>
                        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles size={14} />
                            AI Summary
                          </h4>
                          <p className="text-sm text-slate-300 italic">"{sessions.find(s => s.id === selectedSessionId)?.summary}"</p>
                        </div>
                        {sessions.find(s => s.id === selectedSessionId)?.messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl ${
                              msg.role === 'user' 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-slate-900/80 border border-slate-800 text-slate-200'
                            }`}>
                              <p className="text-xs font-bold opacity-50 uppercase tracking-widest mb-1">{msg.role}</p>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Past Conversations</h3>
                        {sessions.map(session => (
                          <button 
                            key={session.id}
                            onClick={() => setSelectedSessionId(session.id)}
                            className="w-full text-left p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                                {new Date(session.updatedAt).toLocaleDateString()} {new Date(session.updatedAt).toLocaleTimeString()}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-bold uppercase">
                                {session.messages.length} Messages
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 line-clamp-2 italic group-hover:text-blue-200 transition-colors">
                              "{session.summary}"
                            </p>
                          </button>
                        ))}
                        {sessions.length === 0 && (
                          <div className="h-40 flex flex-col items-center justify-center text-slate-600 opacity-50">
                            <History size={40} className="mb-2" />
                            <p>No past conversations found.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="p-4 bg-blue-600/10 rounded-full text-blue-500">
                          <Processor size={48} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-300">Local Intelligence Node</h3>
                          <p className="text-sm max-w-xs mx-auto">Interface for your locally attached AI models. No data leaves this hub.</p>
                        </div>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-900/80 border border-slate-800 text-slate-200'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>

              {!isViewingHistory && (
                <div className="relative flex items-center gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()}
                    placeholder="Query local intelligence node..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-6 pr-24 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm shadow-xl shadow-black/20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      onClick={toggleListening}
                      className={`p-2 rounded-xl transition-all ${
                        isListening 
                          ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40' 
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button 
                      onClick={handleAssistantSend}
                      disabled={!userInput.trim() || isTyping}
                      className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Editor */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col min-h-0 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Zap size={14} className="text-amber-400" />
                       Script Editor
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setTerminalCode('')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={runCode}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                      >
                        <Play size={14} />
                        Run Script
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={terminalCode}
                    onChange={(e) => setTerminalCode(e.target.value)}
                    spellCheck={false}
                    className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm lg:text-base leading-relaxed text-blue-100/90 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none shadow-inner custom-scrollbar"
                    placeholder="// Enter JavaScript here..."
                  />
                </div>

                {/* Console */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-0 flex flex-col min-h-0 shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 bg-slate-950 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Monitor size={14} />
                       Local Runtime Console
                    </h3>
                    <button 
                      onClick={() => setTerminalOutput([])}
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                      title="Clear console"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex-1 bg-black/40 p-6 font-mono text-sm lg:text-base overflow-y-auto custom-scrollbar">
                    {terminalOutput.length > 0 ? (
                      terminalOutput.map((log, i) => (
                        <div key={i} className={`mb-1.5 ${
                          log.startsWith('---') ? 'text-slate-600 mt-4 first:mt-0 font-bold' : 
                          log.startsWith('ERROR') ? 'text-rose-400' :
                          log.startsWith('RUNTIME ERROR') ? 'text-rose-500 font-bold' :
                          log.startsWith('RESULT') ? 'text-emerald-400 font-bold' : 'text-slate-300'
                        }`}>
                          {log.startsWith('---') ? log : (
                            <span className="flex gap-3">
                              <span className="text-slate-700 opacity-50 shrink-0 select-none">{i + 1}</span>
                              <span className="whitespace-pre-wrap break-all">{log}</span>
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-2 italic">
                        <Terminal size={32} />
                        <p className="text-xs">Console awaiting script execution...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'sentinel' && (
            <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 {/* Sentinel HUD */}
                 <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck size={80} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Core Index</h3>
                      <div className="space-y-1">
                        <p className="text-4xl font-bold font-mono text-blue-400">Φ {phiValue.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 font-mono italic">Sentinel Operational State</p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-slate-800 space-y-4 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Active Nodes (n)</span>
                          <span className="text-blue-400">{notes.length + models.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Complexity (ΣWX)</span>
                          <span className="text-blue-400">{(notes.reduce((acc, note) => acc + (note.content.length / 1000), 0) + (models.length * 0.5)).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Threshold (Δ)</span>
                          <span className="text-amber-500">±11.3</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                      <p className="text-[11px] leading-relaxed text-blue-200/60 space-y-2">
                        <span className="block font-bold text-blue-400 mb-1">SENTINEL_PROTOCOL_V5</span>
                        The Phi value monitors the recursive integrity of the local hub. Values outside the 11.3 tolerance indicate node instability or data overflow.
                      </p>
                    </div>
                 </div>

                 {/* Sentinel Analysis */}
                 <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col min-h-0 shadow-lg">
                    <div className="flex items-center justify-between mb-8">
                       <div className="space-y-1">
                         <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                           <Activity size={18} className="text-teal-400" />
                           Dynamic Flux Analysis
                         </h3>
                         <p className="text-xs text-slate-500">Real-time computation of system entropy</p>
                       </div>
                       <div className="flex items-center gap-4 text-[10px] font-mono">
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500" />
                           <span className="text-slate-400">Φ Value</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-slate-800 border border-blue-500/30" />
                           <span className="text-slate-400">Tolerance Band</span>
                         </div>
                       </div>
                    </div>

                    <div className="flex-1 w-full min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={phiHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPhi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#64748b' }} 
                            minTickGap={30}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#64748b' }} 
                            domain={['auto', 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              border: '1px solid #1e293b', 
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#cbd5e1'
                            }}
                            itemStyle={{ color: '#3b82f6' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="upper" 
                            stroke="none" 
                            fill="#3b82f6" 
                            fillOpacity={0.05} 
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="lower" 
                            stroke="none" 
                            fill="#0b0e14" 
                            fillOpacity={1} 
                            isAnimationActive={false}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorPhi)" 
                            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#0b0e14' }}
                            activeDot={{ r: 6, fill: '#60a5fa' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl">
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Formula Synthesis</h4>
                   <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-blue-300 border border-blue-500/10">
                     Φ = (Σ Wi Xi) + nB ± Δ11.3
                   </div>
                 </div>
                 <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl col-span-1 lg:col-span-2">
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Diagnostics Console</h4>
                   <div className="space-y-1 font-mono text-[10px] text-slate-500">
                     <p><span className="text-teal-500">SENTINEL_OK:</span> Core index is within tolerance parameters.</p>
                     <p><span className="text-teal-500">SENTINEL_OK:</span> All {notes.length} knowledge nodes synchronized.</p>
                     <p><span className="text-slate-700">SENTINEL_IDLE:</span> Waiting for structural change...</p>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Note List */}
              <div className={`w-full lg:w-72 flex flex-col gap-4 ${isMobileNotesEditorOpen ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {notes.map(note => (
                    <button 
                      key={note.id}
                      onClick={() => { setSelectedNoteId(note.id); setIsMobileNotesEditorOpen(true); }}
                      className={`w-full text-left p-4 rounded-2xl transition-all border group relative ${
                        selectedNoteId === note.id 
                          ? 'bg-blue-600/10 border-blue-500/50' 
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <h4 className="font-bold text-slate-200 truncate pr-6">{note.title || 'Untitled'}</h4>
                      <p className="text-xs text-slate-500 mt-1">{new Date(note.updatedAt).toLocaleDateString()}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                  ))}
                  {notes.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30">
                      <FileText size={40} className="mb-2" />
                      <p className="text-sm">Knowledge base is empty</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Note Editor */}
              <div className={`flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl lg:rounded-3xl p-4 lg:p-8 flex flex-col ${isMobileNotesEditorOpen ? 'flex' : 'hidden lg:flex'}`}>
                {selectedNote ? (
                  <>
                    <div className="flex items-center gap-4 mb-4 lg:hidden">
                      <button 
                        onClick={() => setIsMobileNotesEditorOpen(false)}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <span className="font-bold text-sm text-slate-500 uppercase tracking-widest truncate">{selectedNote.title || 'Untitled'}</span>
                    </div>
                    <input 
                      type="text"
                      value={selectedNote.title}
                      onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                      placeholder="Entry Title..."
                      className="bg-transparent text-xl lg:text-2xl font-bold focus:outline-none mb-4 lg:mb-6 text-slate-100 border-b border-slate-800/50 pb-4"
                    />
                    <textarea 
                      value={selectedNote.content}
                      onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                      placeholder="Start recording local intelligence data..."
                      className="flex-1 bg-transparent resize-none focus:outline-none text-slate-400 leading-relaxed text-base lg:text-lg"
                    />
                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                      <span>Node ID: {selectedNote.id}</span>
                      <span>Last Synced: {new Date(selectedNote.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                    <Monitor size={48} lg:size={64} className="mb-4 opacity-20" />
                    <p className="text-base lg:text-lg font-medium opacity-50 text-center">Select an entry from the knowledge base or create a new one.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Global CSS for scrollbars */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
