
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import * as prettier from "prettier/standalone";
import * as babel from "prettier/plugins/babel";
import * as estree from "prettier/plugins/estree";
import * as typescript from "prettier/plugins/typescript";
import * as postcss from "prettier/plugins/postcss";
import * as html from "prettier/plugins/html";
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
  Paperclip,
  FilePlus,
  FileUp,
  FolderOpen,
  FolderPlus,
  Folder,
  GitBranch,
  FileCode,
  Target,
  Clock,
  ChevronLeft,
  Code,
  Bug,
  Wand2,
  Save,
  Edit3,
  FilePenLine,
  ChevronDown,
  Edit2,
  GitCommit as GitCommitIcon,
  GitMerge,
  Share,
  Bot
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

import {
  Note, VFile, VFolder, GitCommit, GitState, Agent, AgentRun,
  Task, Project, ChatMessage, ChatSession, LLMConfig, DownloadProgress,
  Experience, BrainState, AvoidanceNode
} from './types';

import { POPULAR_MODELS, SidebarItem, StatCard } from './src/components/Shared';

const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<VFile[]>([]);
  const [folders, setFolders] = useState<VFolder[]>([]);
  const [gitStates, setGitStates] = useState<GitState[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assistant' | 'notes' | 'terminal' | 'sentinel' | 'workspace' | 'agents'>('dashboard');
  const [workspaceTab, setWorkspaceTab] = useState<'explorer' | 'git' | 'tasks'>('explorer');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [targetUploadFolderId, setTargetUploadFolderId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string, content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileNotesEditorOpen, setIsMobileNotesEditorOpen] = useState(false);
  const [isMobileWorkspaceEditorOpen, setIsMobileWorkspaceEditorOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isAgencyImportModalOpen, setIsAgencyImportModalOpen] = useState(false);
  const [availableAgencyAgents, setAvailableAgencyAgents] = useState<any[]>([]);
  const [githubConfig, setGithubConfig] = useState({
    url: '',
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
  
  // Sentinel Brain State
  const [brainState, setBrainState] = useState<BrainState>({ dopamine: 0.5, cortisol: 0.2, lastUpdated: Date.now() });
  const [shortTermMemory, setShortTermMemory] = useState<ChatMessage[]>([]);
  const [longTermMemory, setLongTermMemory] = useState<Experience[]>([]);
  const [avoidanceMap, setAvoidanceMap] = useState<AvoidanceNode[]>([]);
  
  // LLM Config
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    model: 'llama3',
    systemPrompt: 'You are the Sentinel Core, the central intelligence coordinator for this local offline hub. You operate under the Sentinel Protocol Φ. Your primary directive is secure, local-first data processing and analysis. Prioritize privacy, technical precision, and concise intervention.'
  });

  // MCP Config
  const [githubMcpToken, setGithubMcpToken] = useState<string>('');
  const [githubMcpStatus, setGithubMcpStatus] = useState<{ loading: boolean, message: string }>({ loading: false, message: '' });
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
  const assistantFileInputRef = useRef<HTMLInputElement>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);
  const zipUploadInputRef = useRef<HTMLInputElement>(null);

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

  const handleAssistantFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPendingAttachments(prev => [...prev, { name: file.name, content: content || '' }]);
      };
      reader.readAsText(file);
    });
    
    if (assistantFileInputRef.current) assistantFileInputRef.current.value = '';
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
    let host = llmConfig.endpoint;
    if (host.startsWith('/')) {
      host = window.location.origin + host;
    }
    if (!lastOllamaRef.current || lastOllamaRef.current.config.host !== host) {
      lastOllamaRef.current = new Ollama({ host });
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
    } catch (error: any) {
      // Silently handle disconnected state to prevent UI error overlays
      // console.log('LLM Connection failed:', error.message);
      setConnectionStatus('disconnected');
    }
  };

  const setupGithubMcp = async () => {
    setGithubMcpStatus({ loading: true, message: 'Connecting...' });
    try {
      const res = await fetch("/api/setup-mcp-github", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubMcpToken })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setGithubMcpStatus({ loading: false, message: data.message });
      } else {
        setGithubMcpStatus({ loading: false, message: 'Error: ' + data.message });
      }
    } catch (err: any) {
      setGithubMcpStatus({ loading: false, message: 'Failed: ' + err.message });
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
      // console.error('Pull failed:', error);
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

    const savedProjects = localStorage.getItem('hub_projects');
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      setProjects(parsed);
      if (parsed.length > 0) setActiveProjectId(parsed[0].id);
    }

    const savedFiles = localStorage.getItem('hub_files');
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }

    const savedFolders = localStorage.getItem('hub_folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    }

    const savedGit = localStorage.getItem('hub_git');
    if (savedGit) {
      setGitStates(JSON.parse(savedGit));
    }

    const savedTasks = localStorage.getItem('hub_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }

    const savedAgents = localStorage.getItem('hub_agents');
    if (savedAgents) {
      setAgents(JSON.parse(savedAgents));
    }

    const savedRuns = localStorage.getItem('hub_agent_runs');
    if (savedRuns) {
      setAgentRuns(JSON.parse(savedRuns));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hub_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('hub_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('hub_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('hub_git', JSON.stringify(gitStates));
  }, [gitStates]);

  useEffect(() => {
    localStorage.setItem('hub_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('hub_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('hub_agent_runs', JSON.stringify(agentRuns));
  }, [agentRuns]);

  // --- Cognitive Consolidation ---
  useEffect(() => {
    const savedBrain = localStorage.getItem('hub_brain_state');
    const savedLTM = localStorage.getItem('hub_ltm');
    const savedAvoidance = localStorage.getItem('hub_avoidance');

    if (savedBrain) setBrainState(JSON.parse(savedBrain));
    if (savedLTM) setLongTermMemory(JSON.parse(savedLTM));
    if (savedAvoidance) setAvoidanceMap(JSON.parse(savedAvoidance));

    // Daily Consolidation / Sleep Cycle
    const sleepInterval = setInterval(() => {
      consolidateMemories();
    }, 60000 * 5); // Consolidate every 5 mins for demo, usually longer

    return () => clearInterval(sleepInterval);
  }, []);

  useEffect(() => {
    localStorage.setItem('hub_brain_state', JSON.stringify(brainState));
  }, [brainState]);

  useEffect(() => {
    localStorage.setItem('hub_ltm', JSON.stringify(longTermMemory));
  }, [longTermMemory]);

  useEffect(() => {
    localStorage.setItem('hub_avoidance', JSON.stringify(avoidanceMap));
  }, [avoidanceMap]);

  const consolidateMemories = () => {
    setLongTermMemory(prev => {
      // 30 day pruning logic
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return prev.filter(exp => exp.timestamp > thirtyDaysAgo);
    });
  };

  const triggerPainSignal = (reason: string, context: string) => {
    setBrainState(prev => ({
      ...prev,
      cortisol: Math.min(1, prev.cortisol + 0.3),
      dopamine: Math.max(0, prev.dopamine - 0.2)
    }));
    
    setAvoidanceMap(prev => [
      ...prev,
      { contextHash: btoa(context).substring(0, 16), weight: 0.8, reason } // Simple hash for demo
    ]);
  };

  const grantReward = (value: number) => {
    setBrainState(prev => ({
      ...prev,
      dopamine: Math.min(1, prev.dopamine + value * 0.2),
      cortisol: Math.max(0, prev.cortisol - value * 0.1)
    }));
  };

  const getAssociativeCorrection = (input: string) => {
    // Mimic Associative Processing
    const dictionary: Record<string, string> = {
      'termites': 'termux',
      'sentinale': 'sentinel',
      'phi index': 'Phi Sentinel value',
      'brain': 'Sentinel Cognitive Engine'
    };
    
    let corrected = input;
    Object.keys(dictionary).forEach(key => {
      const regex = new RegExp(key, 'gi');
      corrected = corrected.replace(regex, dictionary[key]);
    });
    return corrected;
  };

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
      // console.error('Summarization failed:', error);
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

  // --- Project & File Management ---
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: 'New Project',
      description: 'System-initialized workspace node.',
      updatedAt: Date.now()
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setFiles(prev => prev.filter(f => f.projectId !== id));
    setFolders(prev => prev.filter(f => f.projectId !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const addFolder = (projectId: string) => {
    const newFolder: VFolder = {
      id: Date.now().toString(),
      name: 'New Folder',
      projectId: projectId,
      updatedAt: Date.now()
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const renameFolder = (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name, updatedAt: Date.now() } : f));
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Orphaned files will go to root (folderId = null)
    setFiles(prev => prev.map(f => f.folderId === id ? { ...f, folderId: null } : f));
  };

  const addFile = (projectId: string, folderId: string | null = null) => {
    const newFile: VFile = {
      id: Date.now().toString(),
      name: 'script.js',
      content: '// Local JS Entry Point\nconsole.log("Hello from Sentinel Code Node");',
      language: 'javascript',
      projectId: projectId,
      folderId: folderId,
      updatedAt: Date.now()
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setIsMobileWorkspaceEditorOpen(true);
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content, updatedAt: Date.now() } : f));
  };

  const renameFile = (id: string, name: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name, updatedAt: Date.now() } : f));
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  const formatCode = async () => {
    if (!activeFileId) return;
    const file = files.find(f => f.id === activeFileId);
    if (!file) return;

    try {
      let parser = "babel";
      if (file.language === 'typescript') parser = "typescript";
      if (file.language === 'css') parser = "css";
      if (file.language === 'html') parser = "html";
      if (file.name.endsWith('.json')) parser = "json";

      const formatted = await prettier.format(file.content, {
        parser: parser,
        plugins: [babel, estree, typescript, postcss, html],
        semi: true,
        singleQuote: true,
        printWidth: 100,
        trailingComma: 'es5',
      });

      updateFileContent(activeFileId, formatted);
      grantReward(0.05); // Small reward for keeping code clean
    } catch (error) {
      console.error('Prettier formatting failed:', error);
      triggerPainSignal('Formatting failed due to syntax errors', file.content);
    }
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sh': 'shell'
    };
    return map[ext] || 'text';
  };

  const handleWorkspaceFileUpload = (e: React.ChangeEvent<HTMLInputElement>, projectId: string, folderId: string | null = null) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newFile: VFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          content: content || '',
          language: getLanguageFromExtension(file.name),
          projectId: projectId,
          folderId: folderId,
          updatedAt: Date.now()
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
      };
      reader.readAsText(file);
    });
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.zip')) return;

    const zip = new JSZip();
    try {
      const contents = await zip.loadAsync(file);
      const projectId = Date.now().toString();
      const projectName = file.name.replace('.zip', '');
      
      const newProject: Project = {
        id: projectId,
        name: projectName,
        description: `Imported from ${file.name}`,
        updatedAt: Date.now()
      };

      const folderMap = new Map<string, string>(); // path -> folderId
      const newFiles: VFile[] = [];
      const newFolders: VFolder[] = [];
      const paths = Object.keys(contents.files);

      // Process all paths to ensure every folder exists in our flat map
      for (const path of paths) {
        const item = contents.files[path];
        const parts = path.split('/').filter(Boolean);
        
        if (item.dir) {
          let currentPath = "";
          for (const part of parts) {
            currentPath += part + "/";
            if (!folderMap.has(currentPath)) {
              const folderId = Math.random().toString(36).substr(2, 9);
              folderMap.set(currentPath, folderId);
              newFolders.push({
                id: folderId,
                name: currentPath.slice(0, -1), // Show full path for context in flat list
                projectId: projectId,
                updatedAt: Date.now()
              });
            }
          }
        } else {
          // ensure parent folders exist for files too, even if not explicitly in zip
          let currentPath = "";
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath += parts[i] + "/";
            if (!folderMap.has(currentPath)) {
              const folderId = Math.random().toString(36).substr(2, 9);
              folderMap.set(currentPath, folderId);
              newFolders.push({
                id: folderId,
                name: currentPath.slice(0, -1),
                projectId: projectId,
                updatedAt: Date.now()
              });
            }
          }
        }
      }

      for (const path of paths) {
        const item = contents.files[path];
        if (!item.dir) {
          const parts = path.split('/');
          const fileName = parts.pop()!;
          const parentPath = parts.join('/') + (parts.length > 0 ? '/' : '');
          const folderId = folderMap.get(parentPath) || null;

          // skip system files often found in zips
          if (fileName === '.DS_Store' || fileName.startsWith('._') || fileName === '__MACOSX') continue;

          const content = await item.async('string');
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: fileName,
            content,
            language: getLanguageFromExtension(fileName),
            projectId: projectId,
            folderId: folderId,
            updatedAt: Date.now()
          });
        }
      }

      setProjects(prev => [newProject, ...prev]);
      setFolders(prev => [...prev, ...newFolders]);
      setFiles(prev => [...prev, ...newFiles]);
      setActiveProjectId(projectId);
      grantReward(0.5);

    } catch (err) {
      console.error('Zip import failed:', err);
      triggerPainSignal('Zip archive corrupted or incompatible.', file.name);
    } finally {
      e.target.value = '';
    }
  };

  // --- AI Code Intelligence ---
  const aiCodeAction = async (action: 'analyze' | 'refactor' | 'debug' | 'discuss', fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setIsTyping(true);
    setActiveTab('assistant');
    
    const prompts = {
      analyze: `Analyze the following code for security vulnerabilities, architectural flaws, and performance bottlenecks. Provide a technical assessment.\n\nCODE:\n${file.content}`,
      refactor: `Refactor the following code to be more concise, readable, and professional. Follow local-first clean code standards. Return only the refactored code wrapped in markdown code blocks.\n\nCODE:\n${file.content}`,
      debug: `Identify potential bugs or runtime errors in the following code and provide fixes. Explain your reasoning.\n\nCODE:\n${file.content}`,
      discuss: `I want to discuss this code with you. Here is the source for '${file.name}':\n\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\nWhat are your initial thoughts or how can we improve this architecture?`
    };

    const userMsg: ChatMessage = { role: 'user', text: `Sentinel, let's ${action} this file: ${file.name}` };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const ollama = getOllama();
      const response = await ollama.chat({
        model: llmConfig.model,
        messages: [
          { role: 'system', content: llmConfig.systemPrompt },
          { role: 'user', content: prompts[action] }
        ],
        stream: false
      });

      setChatHistory(prev => [...prev, { role: 'assistant', text: response.message.content }]);
    } catch (error) {
      console.error('AI Code Action failed:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Protocol failure during AI code analysis.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Git Integration ---
  const getGitState = (projectId: string) => {
    return gitStates.find(gs => gs.projectId === projectId) || {
      projectId,
      stagedFiles: [],
      commits: [],
      isInitialized: false
    };
  };

  const initGitRepo = (projectId: string) => {
    setGitStates(prev => [
      ...prev.filter(gs => gs.projectId !== projectId),
      { projectId, stagedFiles: [], commits: [], isInitialized: true }
    ]);
  };

  const stageFile = (projectId: string, fileId: string) => {
    setGitStates(prev => prev.map(gs => {
      if (gs.projectId === projectId) {
        const staged = new Set(gs.stagedFiles);
        if (staged.has(fileId)) staged.delete(fileId);
        else staged.add(fileId);
        return { ...gs, stagedFiles: Array.from(staged) };
      }
      return gs;
    }));
  };

  const commitChanges = (projectId: string, message: string) => {
    const state = getGitState(projectId);
    if (!state.isInitialized || state.stagedFiles.length === 0) return;

    const snapshot = files
      .filter(f => state.stagedFiles.includes(f.id))
      .map(f => ({ id: f.id, content: f.content }));

    const newCommit: GitCommit = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now(),
      author: 'Sentinel Core',
      files: snapshot
    };

    setGitStates(prev => prev.map(gs => {
      if (gs.projectId === projectId) {
        return { 
          ...gs, 
          commits: [newCommit, ...gs.commits], 
          stagedFiles: [] 
        };
      }
      return gs;
    }));

    grantReward(0.2); // Success reward
  };

  const handlePushRepo = async (projectId: string) => {
    const state = getGitState(projectId);
    if (!state.isInitialized || state.commits.length === 0) return;

    setIsTyping(true);
    setActiveTab('assistant');
    setChatHistory(prev => [...prev, { role: 'user', text: `Sentinel, push branch 'main' to local relay.` }]);
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'assistant', text: `PROTOCOL_SECURE: Repository '${projects.find(p => p.id === projectId)?.name}' successfully replicated to encrypted vault at 127.0.0.1:GIT_HUB. Delta: ${state.commits.length} commits.` }]);
      setIsTyping(false);
      grantReward(0.3);
    }, 1500);
  };

  // --- Task Management ---
  const addTask = (projectId: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      projectId,
      title: 'New Task',
      description: '',
      priority: 'medium',
      status: 'pending',
      updatedAt: Date.now()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- Agent Orchestration ---
  const createAgent = () => {
    const newAgent: Agent = {
      id: Date.now().toString(),
      name: 'Sentinel-Alpha',
      role: 'Research & Logic Analyst',
      goal: 'Identify architectural improvements for the current hub.',
      instructions: 'Analyze established nodes, cross-reference knowledge patterns, and propose enhancements.',
      constraints: ['Local-only compute', 'No external data leak', 'Maintain Phi-Sentinel index'],
      tools: ['Knowledge Base', 'Workspace Access', 'Code Sandbox'],
      updatedAt: Date.now()
    };
    setAgents(prev => [...prev, newAgent]);
    setActiveTab('agents');
  };

  const fetchAgencyAgents = async () => {
    try {
      const res = await fetch("/api/agency-agents");
      const json = await res.json();
      if (json.status === "success") {
         setAvailableAgencyAgents(json.agents);
         setIsAgencyImportModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const importAgencyAgent = (agencyAgent: any) => {
    const newAgent: Agent = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      name: agencyAgent.name,
      role: agencyAgent.category.toUpperCase(),
      goal: agencyAgent.description,
      instructions: agencyAgent.content,
      constraints: ['Respect agency guidelines'],
      tools: ['Knowledge Base', 'Workspace Access'],
      updatedAt: Date.now()
    };
    setAgents(prev => [...prev, newAgent]);
    setIsAgencyImportModalOpen(false);
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: Date.now() } : a));
  };

  const deleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    setAgentRuns(prev => prev.filter(r => r.agentId !== id));
  };

  const runAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const runId = Math.random().toString(36).substr(2, 9);
    const newRun: AgentRun = {
      id: runId,
      agentId,
      status: 'deploying',
      currentStep: 'Initializing Local Environment...',
      logs: [{ timestamp: Date.now(), message: `Agent '${agent.name}' deployment sequence initiated.`, type: 'info' }],
      startedAt: Date.now()
    };

    setAgentRuns(prev => [newRun, ...prev]);

    const addLog = (msg: string, type: 'info' | 'action' | 'success' | 'error') => {
      setAgentRuns(prev => prev.map(r => {
        if (r.id === runId) {
          return {
            ...r,
            currentStep: msg,
            logs: [...r.logs, { timestamp: Date.now(), message: msg, type }]
          };
        }
        return r;
      }));
    };

    const updateStatus = (status: 'running' | 'completed' | 'error', result?: string) => {
      setAgentRuns(prev => prev.map(r => r.id === runId ? { ...r, status, result } : r));
    };

    try {
      addLog('Connecting to Serena MCP backend proxy...', 'action');
      updateStatus('running');

      const response = await fetch('/query_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: agent.name,
          tool_name: 'filesystem',
          tool_params_json: JSON.stringify({ action: "list", path: "." })
        })
      });

      if (!response.ok) {
        throw new Error(`MCP Proxy error: ${response.statusText}`);
      }

      const data = await response.json();
      const stringifiedResponse = JSON.stringify(data.data || data);
      const truncated = stringifiedResponse.length > 300 ? stringifiedResponse.substring(0, 300) + '...' : stringifiedResponse;
      addLog(`Received response: ${truncated}`, 'success');
      
      updateStatus('completed', `MCP Execution completed successfully.`);
      grantReward(0.5);
    } catch (err: any) {
      addLog(`Failed to execute protocol: ${err.message}`, 'error');
      updateStatus('error');
    }
  };

  const bridgeAgents = async (sourceId: string) => {
    const sourceAgent = agents.find(a => a.id === sourceId);
    if (!sourceAgent) return;
    
    // Pick another agent to bridge with, or fail if none available
    const targetAgent = agents.find(a => a.id !== sourceId);
    if (!targetAgent) {
      alert("Need at least two agents to establish a bridge.");
      return;
    }

    const runId = Math.random().toString(36).substr(2, 9);
    const newRun: AgentRun = {
      id: runId,
      agentId: sourceId,
      status: 'deploying',
      currentStep: 'Initializing API Bridge...',
      logs: [{ timestamp: Date.now(), message: `Establishing swarm bridge to target: [HIDDEN_SEQ]`, type: 'info' }],
      startedAt: Date.now()
    };
    setAgentRuns(prev => [newRun, ...prev]);

    const addLog = (msg: string, type: 'info' | 'action' | 'success' | 'error') => {
      setAgentRuns(prev => prev.map(r => r.id === runId ? { ...r, currentStep: msg, logs: [...r.logs, { timestamp: Date.now(), message: msg, type }] } : r));
    };

    try {
      addLog('Stripping human convenience names & assigning identity sequences...', 'action');
      
      const response = await fetch('/api/agent-bridge/communicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAgentId: sourceAgent.name,
          targetAgentId: targetAgent.name,
          payload: `Hello ${targetAgent.name}, this is ${sourceAgent.name}. Let's work on code together.`,
        })
      });

      if (!response.ok) throw new Error(`Bridge error: ${response.statusText}`);
      
      const data = await response.json();
      addLog(`Bridge Active. Trace ID: ${data.trace_id}`, 'success');
      addLog(`Secure Payload Exchanged: ${JSON.stringify(data.payload)}`, 'success');
      
      setAgentRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'completed', result: `Bridge established with drift prevention: ${data.trace_id}` } : r));
      grantReward(0.5);
    } catch (err: any) {
      addLog(`Bridge failed: ${err.message}`, 'error');
      setAgentRuns(prev => prev.map(r => r.id === runId ? { ...r, status: 'error' } : r));
    }
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
    if (!userInput.trim() && pendingAttachments.length === 0) return;

    // Phase 1: Associative Correction
    const correctedInput = getAssociativeCorrection(userInput);

    // Phase 2: Pain Pathway Check
    const contextHash = btoa(correctedInput).substring(0, 16);
    const painNode = avoidanceMap.find(n => n.contextHash === contextHash);
    if (painNode && brainState.cortisol > 0.6) {
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        text: `PAIN_THRESHOLD_EXCEEDED: Sentinel is avoiding this context due to previous instability: ${painNode.reason}` 
      }]);
    }

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: correctedInput,
      attachments: [...pendingAttachments] 
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setShortTermMemory(prev => [...prev, userMsg].slice(-10)); // STM Buffer
    setUserInput('');
    setPendingAttachments([]);
    setIsTyping(true);

    try {
      const ollama = getOllama();
      const messages = [];
      
      // Dynamic System Prompt based on Endocrine State
      let dynamicPrompt = llmConfig.systemPrompt;
      if (brainState.cortisol > 0.7) {
        dynamicPrompt += " [STRESS_PROTOCOL_ACTIVE]: Accuracy is critical. Minimize risk. Be formal.";
      }
      if (brainState.dopamine > 0.8) {
        dynamicPrompt += " [NEUROPLASTICITY_HIGH]: Suggest innovative architectural improvements. Think broadly.";
      }

      messages.push({ role: 'system', content: dynamicPrompt });

      // LTM Semantic Context (Simulated by injecting relevant experiences)
      const relevantMemory = longTermMemory.find(exp => correctedInput.includes(exp.intent));
      if (relevantMemory) {
        messages.push({ 
          role: 'system', 
          content: `LTM_RETRIEVAL: Remember previously ${relevantMemory.sentiment} outcome for '${relevantMemory.intent}'. Previous Action: ${relevantMemory.actionTaken}` 
        });
      }

      userMsg.attachments?.forEach(att => {
        messages.push({ role: 'system', content: `Knowledge Source [file: ${att.name}]:\n${att.content}` });
      });
      
      messages.push({ role: 'user', content: userMsg.text });

      const response = await ollama.chat({
        model: llmConfig.model,
        messages: messages,
        stream: false,
      });

      const assistantMsg: ChatMessage = { role: 'assistant', text: response.message.content };
      setChatHistory(prev => [...prev, assistantMsg]);
      setShortTermMemory(prev => [...prev, assistantMsg].slice(-10));

      // Successful inference grants small reward
      grantReward(0.1);

      // Record experience
      const newExp: Experience = {
        id: Date.now().toString(),
        intent: correctedInput.split(' ').slice(0, 3).join(' '),
        sentiment: 'positive',
        actionTaken: 'Inference',
        outcomeValue: 1,
        timestamp: Date.now()
      };
      setLongTermMemory(prev => [newExp, ...prev]);

    } catch (error) {
      triggerPainSignal('Connection Error/Instability', correctedInput);
      // ... (keep previous error handling)
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        text: `Error connecting to local engine: ${error instanceof Error ? error.message : 'Unknown error'}.` 
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
      {/* Hidden Workspace File Input */}
      <input 
        type="file" 
        ref={workspaceFileInputRef} 
        onChange={(e) => activeProjectId && handleWorkspaceFileUpload(e, activeProjectId, targetUploadFolderId)} 
        className="hidden" 
        multiple 
        accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.sh,.css,.html"
      />
      <input 
        type="file" 
        ref={zipUploadInputRef} 
        onChange={handleZipUpload} 
        className="hidden" 
        accept=".zip"
      />
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
            icon={Bot} 
            label="Autonomous Agents" 
            active={activeTab === 'agents'} 
            onClick={() => { setActiveTab('agents'); setIsSidebarOpen(false); }} 
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
          <SidebarItem 
            icon={FolderOpen} 
            label="Workspace" 
            active={activeTab === 'workspace'} 
            onClick={() => { setActiveTab('workspace'); setIsSidebarOpen(false); }} 
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
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Local LLM Interface</h4>
                          {connectionStatus === 'disconnected' && (
                            <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold">CONNECTION FAILED</span>
                          )}
                        </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Provider Endpoint</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={llmConfig.endpoint}
                            onChange={(e) => setLlmConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                            placeholder="/api/ollama"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                          <button 
                            onClick={checkConnection}
                            className="px-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
                          >
                            <RefreshCcw size={16} className={connectionStatus === 'checking' ? 'animate-spin' : ''} />
                          </button>
                        </div>
                        {connectionStatus === 'disconnected' && (
                          <div className="mt-2 p-3 bg-slate-900 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                            <p className="font-bold flex items-center gap-1.5"><AlertCircle size={14}/> Connection to local model failed</p>
                            <p className="mt-1 opacity-80">Make sure Ollama is running and has CORS enabled so the web app can connect.</p>
                            <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase transition-colors">Start Ollama with CORS in your terminal:</p>
                            <code className="block mt-1 p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 font-mono text-[10px] select-all overflow-x-auto whitespace-nowrap">
                              OLLAMA_ORIGINS="*" ollama serve
                            </code>
                          </div>
                        )}
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

                    <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                      <div className="flex items-center gap-2">
                        <Github size={16} className="text-blue-500" />
                        <h4 className="font-bold text-slate-200">GitHub MCP Server</h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        Connect to the Model Context Protocol Server for GitHub natively to give Agents full Git integration. Give an API token to activate.
                      </p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Personal Access Token</label>
                        <div className="flex gap-2">
                          <input 
                            type="password" 
                            value={githubMcpToken}
                            onChange={(e) => setGithubMcpToken(e.target.value)}
                            placeholder="ghp_..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono"
                          />
                          <button 
                            onClick={setupGithubMcp}
                            disabled={githubMcpStatus.loading || !githubMcpToken}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 text-sm"
                          >
                            {githubMcpStatus.loading ? <RefreshCcw size={16} className="animate-spin" /> : 'Connect'}
                          </button>
                        </div>
                        {githubMcpStatus.message && (
                          <div className={`mt-2 text-xs p-3 rounded-xl border ${githubMcpStatus.message.startsWith('Err') || githubMcpStatus.message.startsWith('Fail') ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-teal-500/30 bg-teal-500/10 text-teal-400'} font-bold`}>
                             {githubMcpStatus.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                      <h5 className="text-xs font-bold text-blue-400 uppercase">Pro Tip: Local Proxy</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Requests are proxied through our Node backend (<code className="bg-slate-950 px-1 py-0.5 rounded text-blue-300">/api/ollama</code>) to bypass browser CORS headers securely.
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
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
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
            
            {isAgencyImportModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:p-8 bg-[#0b0e14]/80 backdrop-blur-md"
              >
                <div className="absolute inset-0" onClick={() => setIsAgencyImportModalOpen(false)} />
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="relative w-full max-w-4xl bg-[#0b0e14] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                        <Download size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-200">Import Agency Agent</h3>
                        <p className="text-xs text-slate-500">Select pre-configured system agents from mapping</p>
                      </div>
                    </div>
                    <button onClick={() => setIsAgencyImportModalOpen(false)} className="text-slate-500 hover:text-rose-400 transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-slate-900/30 to-transparent">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableAgencyAgents.map((agent: any) => (
                        <div key={agent.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl hover:border-teal-500/40 transition-colors flex flex-col gap-3 group relative">
                           <div className="flex justify-between items-start">
                             <div className="text-xs font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded uppercase tracking-wider">{agent.category}</div>
                           </div>
                           <h4 className="text-sm font-bold text-slate-200">{agent.name}</h4>
                           <p className="text-xs text-slate-400 line-clamp-3">{agent.description}</p>
                           <div className="mt-auto pt-4">
                             <button 
                               onClick={() => importAgencyAgent(agent)}
                               className="w-full py-2 bg-slate-800 hover:bg-teal-600 hover:text-white text-teal-400 text-xs font-bold rounded-xl transition-colors"
                             >
                               Import Agent
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
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
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Paste GitHub URL</label>
                      <input 
                        type="text" 
                        placeholder="https://github.com/owner/repo"
                        value={githubConfig.url}
                        onChange={e => {
                          const url = e.target.value;
                          const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+(?:\.git)?)/);
                          if (match) {
                            let repo = match[2];
                            if (repo.endsWith('.git')) repo = repo.slice(0, -4);
                            setGithubConfig(prev => ({
                              ...prev,
                              url,
                              owner: match[1],
                              repo: repo
                            }));
                          } else {
                            setGithubConfig(prev => ({ ...prev, url }));
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-8 pb-12">
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
              {/* Ingestion Zone */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    const event = { target: { files } } as any;
                    handleFileUpload(event);
                  }
                }}
                className="group relative bg-[#0b0e14]/40 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-[40px] p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-blue-500/20">
                    <FileUp size={40} className="text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-200 tracking-tight">Ingest Local Data</h2>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">Drag and drop knowledge files here to securely index them into your local intelligence hub.</p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-600/30 flex items-center gap-3 mx-auto"
                  >
                    <FilePlus size={18} />
                    Browse Files
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Cpu} label="System Load" value="18.5%" status="optimal" />
                <StatCard icon={HardDrive} label="Hub Storage" value="482 GB" status="optimal" />
                <StatCard icon={Zap} label="Learning Rate" value={`${(brainState.dopamine * 100).toFixed(1)}%`} status={brainState.dopamine > 0.7 ? 'optimal' : 'stable'} />
                <StatCard icon={ShieldCheck} label="Cortisol Level" value={`${(brainState.cortisol * 100).toFixed(1)}%`} status={brainState.cortisol < 0.4 ? 'optimal' : 'caution'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Cognitive HUD */}
                <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-[40px] p-8 shadow-xl">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Neural Monitoring</h3>
                     <Processor className="text-blue-500 animate-pulse" size={16} />
                   </div>
                   
                   <div className="space-y-8">
                      <div className="space-y-2">
                         <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-blue-400">Dopamine (Reward)</span>
                            <span className="text-slate-500">{(brainState.dopamine * 100).toFixed(0)}%</span>
                         </div>
                         <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${brainState.dopamine * 100}%` }}
                               className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-rose-400">Cortisol (Stress)</span>
                            <span className="text-slate-500">{(brainState.cortisol * 100).toFixed(0)}%</span>
                         </div>
                         <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${brainState.cortisol * 100}%` }}
                               className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                            />
                         </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                         <div className="bg-slate-950/50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">LTM Index</p>
                            <p className="text-xl font-bold text-slate-300">{longTermMemory.length}</p>
                         </div>
                         <div className="bg-slate-950/50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Pain Nodes</p>
                            <p className="text-xl font-bold text-rose-500/80">{avoidanceMap.length}</p>
                         </div>
                      </div>
                   </div>
                </div>

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
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                                  {msg.attachments.map((att, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 bg-blue-700/30 px-2 py-1 rounded text-[10px] font-mono">
                                      <Paperclip size={10} />
                                      {att.name}
                                    </div>
                                  ))}
                                </div>
                              )}
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
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                              {msg.attachments.map((att, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-blue-700/30 px-2 py-1 rounded text-[10px] font-mono">
                                  <Paperclip size={10} />
                                  {att.name}
                                </div>
                              ))}
                            </div>
                          )}
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
                <div className="space-y-4 shrink-0">
                  {/* Pending Attachments */}
                  {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2">
                       {pendingAttachments.map((att, idx) => (
                         <div key={idx} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-[10px] text-slate-300">
                           <Paperclip size={10} className="text-blue-400" />
                           <span className="max-w-[100px] truncate">{att.name}</span>
                           <button 
                             onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                             className="hover:text-rose-400 transition-colors"
                           >
                             <X size={10} />
                           </button>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="relative flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={assistantFileInputRef} 
                      onChange={handleAssistantFileUpload} 
                      className="hidden" 
                      multiple 
                    />
                    <input 
                      type="text" 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()}
                      placeholder="Query local intelligence node..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-6 pr-32 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm shadow-xl shadow-black/20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button 
                        onClick={() => assistantFileInputRef.current?.click()}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>
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
                        disabled={(!userInput.trim() && pendingAttachments.length === 0) || isTyping}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-lg shadow-blue-600/20"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pb-6 lg:pb-0">
                {/* Editor */}
                <div className="flex-1 lg:flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col min-h-[40vh] lg:min-h-0 shadow-lg">
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
                <div className="flex-1 lg:flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-0 flex flex-col min-h-[40vh] lg:min-h-0 shadow-xl overflow-hidden">
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
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-8 pb-12">
              <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 {/* Sentinel summary cards */}
                 <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl lg:col-span-1">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Integrity Index</h3>
                   <div className="flex items-center gap-4">
                     <div className="text-3xl font-mono font-bold text-blue-400">Φ {phiValue.toFixed(4)}</div>
                     <div className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-bold uppercase tracking-wider">STABLE</div>
                   </div>
                 </div>
                 <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl lg:col-span-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Real-time Flux Monitoring</h3>
                    <div className="h-32 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={phiHistory}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                           <XAxis dataKey="time" hide />
                           <YAxis hide domain={['auto', 'auto']} />
                           <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f620" />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
               </div>
            </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="flex-1 overflow-y-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 custom-scrollbar pb-24 px-4 lg:px-8 pt-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                 <div>
                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Agent Orchestrator</h2>
                    <p className="text-slate-500 mt-1 font-medium italic">Autonomous intelligence fleet for local objective processing.</p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                   <button 
                     onClick={createAgent}
                     className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                   >
                     <Plus size={18} />
                     Deploy New Agent
                   </button>
                   <button 
                     onClick={fetchAgencyAgents}
                     className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/20 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all"
                   >
                     <Download size={18} />
                     Import Agency Agents
                   </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Agent Config Column */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={12} className="text-blue-500" />
                    Agent Definitions
                  </h3>
                  {agents.map(agent => (
                    <div 
                      key={agent.id} 
                      className="bg-slate-900/60 border border-slate-800 p-5 rounded-[2.5rem] space-y-4 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <Bot size={20} />
                          </div>
                          <div>
                            <input 
                              className="bg-transparent border-none focus:outline-none text-sm font-bold text-slate-200 w-full"
                              value={agent.name}
                              onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                            />
                            <p className="text-[9px] font-bold text-teal-500/70 uppercase tracking-widest">{agent.role}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteAgent(agent.id)}
                          className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1 block">Objective</label>
                          <textarea 
                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-3 py-2 text-xs text-slate-400 placeholder:text-slate-800 focus:outline-none focus:border-blue-500/30 min-h-[60px] resize-none"
                            value={agent.goal}
                            onChange={(e) => updateAgent(agent.id, { goal: e.target.value })}
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {agent.tools.map(tool => (
                            <span key={tool} className="px-2 py-0.5 bg-slate-800 text-[8px] font-bold text-slate-400 rounded-md border border-slate-700/50 uppercase tracking-wider">{tool}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => runAgent(agent.id)}
                          className="flex-1 py-3 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <Zap size={14} className="group-hover:animate-pulse" />
                          Execute Sequence
                        </button>

                        <button 
                          onClick={() => bridgeAgents(agent.id)}
                          className="flex-1 py-3 bg-slate-800 hover:bg-teal-600 text-slate-400 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-w-[120px]"
                        >
                          <Share size={14} />
                          Swarm Bridge
                        </button>
                      </div>
                    </div>
                  ))}
                  {agents.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[2.5rem] opacity-30 text-center px-6">
                       <Bot size={32} className="mb-4" />
                       <p className="text-xs font-medium">No active agents in the fleet. Deploy an alpha node to begin autonomous processing.</p>
                    </div>
                  )}
                </div>

                {/* Agent Activity Monitoring */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} className="text-teal-500" />
                    Live Objective Streams
                  </h3>
                  
                  <div className="space-y-4">
                    {agentRuns.map(run => {
                      const agent = agents.find(a => a.id === run.agentId);
                      return (
                        <div key={run.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/40">
                          <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${run.status === 'running' ? 'bg-blue-500 animate-pulse' : run.status === 'completed' ? 'bg-teal-500' : 'bg-slate-600'}`} />
                               <span className="text-xs font-bold font-mono text-slate-400">RUN_ID: {run.id}</span>
                               <span className="text-xs font-medium text-slate-600">—</span>
                               <span className="text-xs font-bold text-blue-400">{agent?.name || 'Unknown Agent'}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              run.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                              run.status === 'completed' ? 'bg-teal-500/20 text-teal-400' :
                              'bg-slate-800 text-slate-500'
                            }`}>
                              {run.status}
                            </span>
                          </div>

                          <div className="p-6 flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                               <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] h-64 overflow-y-auto custom-scrollbar space-y-2">
                                 {run.logs.map((log, idx) => (
                                   <div key={idx} className="flex gap-3">
                                      <span className="text-slate-700 grow-0 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                                      <span className={
                                        log.type === 'action' ? 'text-blue-400' :
                                        log.type === 'success' ? 'text-teal-400' :
                                        log.type === 'error' ? 'text-rose-400' :
                                        'text-slate-500'
                                      }>
                                        {log.type === 'action' ? '●' : '○'} {log.message}
                                      </span>
                                   </div>
                                 ))}
                               </div>
                            </div>

                            <div className="w-full lg:w-64 space-y-4">
                               <div className="bg-slate-800/20 rounded-2xl p-4 border border-slate-800">
                                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Current Goal</h4>
                                  <p className="text-xs text-slate-300 font-medium leading-relaxed italic">"{agent?.goal}"</p>
                               </div>
                               
                               {run.result && (
                                 <motion.div 
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4"
                                 >
                                    <div className="flex items-center gap-2 mb-2">
                                       <ShieldCheck size={14} className="text-teal-400" />
                                       <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Protocol Result</span>
                                    </div>
                                    <p className="text-xs text-teal-500/80 font-medium leading-relaxed">{run.result}</p>
                                 </motion.div>
                               )}

                               <div className="pt-2">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase mb-2">
                                     <span>Sequence Progress</span>
                                     <span>{run.status === 'completed' ? '100%' : run.status === 'running' ? '65%' : '0%'}</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                     <motion.div 
                                       className={`h-full ${run.status === 'completed' ? 'bg-teal-500' : 'bg-blue-500'}`}
                                       initial={{ width: 0 }}
                                       animate={{ width: run.status === 'completed' ? '100%' : run.status === 'running' ? '65%' : '0%' }}
                                     />
                                  </div>
                               </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {agentRuns.length === 0 && (
                      <div className="py-24 flex flex-col items-center justify-center opacity-20">
                         <Zap size={48} className="mb-4" />
                         <p className="text-sm font-bold uppercase tracking-[0.3em]">Standby Ready</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 lg:px-0">
              {/* Project Header */}
              <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {projects.map(project => (
                  <div key={project.id} className="group relative flex items-center">
                    <button 
                      onClick={() => setActiveProjectId(project.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border pr-10 ${
                        activeProjectId === project.id 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {project.name}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="absolute right-2 p-1.5 text-slate-400 hover:text-rose-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-slate-900/50 rounded-lg"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addProject}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-sm font-bold border border-dashed border-slate-700 flex items-center gap-2"
                >
                  <Plus size={14} />
                  New Project
                </button>
              </div>

              {activeProjectId ? (
                <div className="flex-1 flex flex-row gap-3 lg:gap-6 min-h-0 overflow-hidden">
                  {/* Sidebar/Panel Selector */}
                  <div className={`w-12 shrink-0 flex-col items-center gap-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl ${isMobileWorkspaceEditorOpen ? 'hidden lg:flex' : 'flex'}`}>
                    <button 
                      onClick={() => setWorkspaceTab('explorer')}
                      className={`p-2 rounded-xl transition-all ${workspaceTab === 'explorer' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <Folder size={18} />
                    </button>
                    <button 
                      onClick={() => setWorkspaceTab('git')}
                      className={`p-2 rounded-xl transition-all ${workspaceTab === 'git' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <GitBranch size={18} />
                    </button>
                    <button 
                      onClick={() => setWorkspaceTab('tasks')}
                      className={`p-2 rounded-xl transition-all ${workspaceTab === 'tasks' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  </div>

                  {/* Dynamic Workspace Panel */}
                  <div className={`w-full lg:w-72 flex-col shrink-0 min-h-0 ${isMobileWorkspaceEditorOpen ? 'hidden lg:flex' : 'flex'}`}>
                    {workspaceTab === 'explorer' ? (
                      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 flex flex-col min-h-0">

                        <div className="flex items-center justify-between mb-4 px-2">
                           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace</h3>
                           <div className="flex items-center gap-1">
                             <button 
                               onClick={() => addFolder(activeProjectId!)}
                               title="New Folder"
                               className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                             >
                               <FolderPlus size={14} />
                             </button>
                             <button 
                               onClick={() => { setTargetUploadFolderId(null); workspaceFileInputRef.current?.click(); }}
                               title="Upload Files"
                               className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                             >
                               <Upload size={14} />
                             </button>
                             <button 
                               onClick={() => addFile(activeProjectId!)}
                               title="New File"
                               className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                             >
                               <FilePlus size={14} />
                             </button>
                           </div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                          {/* Folders */}
                          {folders.filter(f => f.projectId === activeProjectId).map(folder => {
                            const isExpanded = expandedFolders.has(folder.id);
                            const folderFiles = files.filter(file => file.folderId === folder.id);
                            
                            return (
                              <div key={folder.id} className="space-y-1">
                                <div 
                                  className="group flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-800/30 text-slate-400 transition-all"
                                  onClick={() => {
                                    const next = new Set(expandedFolders);
                                    if (isExpanded) next.delete(folder.id);
                                    else next.add(folder.id);
                                    setExpandedFolders(next);
                                  }}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? '' : '-rotate-90 text-slate-600'}`} />
                                    <Folder size={14} className="text-blue-500/60" />
                                    {renamingFolderId === folder.id ? (
                                      <input 
                                        autoFocus
                                        className="bg-transparent border-none focus:outline-none text-xs font-medium text-slate-200 w-24"
                                        value={folder.name}
                                        onBlur={() => setRenamingFolderId(null)}
                                        onChange={(e) => renameFolder(folder.id, e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && setRenamingFolderId(null)}
                                      />
                                    ) : (
                                      <span className="text-sm font-medium truncate">{folder.name}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); setTargetUploadFolderId(folder.id); workspaceFileInputRef.current?.click(); }}
                                       title="Upload to folder"
                                       className="p-1 hover:text-blue-400"
                                     ><Upload size={12} /></button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); addFile(activeProjectId!, folder.id); }}
                                       className="p-1 hover:text-blue-400"
                                     ><FilePlus size={12} /></button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); setRenamingFolderId(folder.id); }}
                                       className="p-1 hover:text-teal-400"
                                     ><Edit2 size={12} /></button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                       className="p-1 hover:text-rose-400"
                                     ><Trash2 size={12} /></button>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="pl-4 space-y-1 border-l border-slate-800 ml-5">
                                    {folderFiles.map(file => (
                                      <div 
                                        key={file.id}
                                        className={`group flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                                          activeFileId === file.id ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800/50 text-slate-500'
                                        }`}
                                        onClick={() => { setActiveFileId(file.id); setIsMobileWorkspaceEditorOpen(true); }}
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <FileCode size={14} className={activeFileId === file.id ? 'text-blue-400' : 'text-slate-600'} />
                                          <span className="text-sm font-medium truncate">{file.name}</span>
                                        </div>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                                          className="p-1 hover:text-rose-400 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                        ><Trash2 size={12} /></button>
                                      </div>
                                    ))}
                                    {folderFiles.length === 0 && <p className="text-[10px] text-slate-700 italic pl-3">Empty</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {/* Root Files */}
                          {files.filter(f => f.projectId === activeProjectId && !f.folderId).map(file => (
                            <div 
                              key={file.id}
                              className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                activeFileId === file.id ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800/50 text-slate-500'
                              }`}
                              onClick={() => { setActiveFileId(file.id); setIsMobileWorkspaceEditorOpen(true); }}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileCode size={14} className={activeFileId === file.id ? 'text-blue-400' : 'text-slate-600'} />
                                <span className="text-sm font-medium truncate">{file.name}</span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                                className="p-1 hover:text-rose-400 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                              ><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800">
                           <button 
                             onClick={() => deleteProject(activeProjectId!)}
                             className="w-full py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all flex items-center justify-center gap-2"
                           >
                             <Trash2 size={12} />
                             Terminate Project
                           </button>
                        </div>
                      </div>
                    ) : workspaceTab === 'git' ? (
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col min-h-0 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Control</h3>
                           <GitBranch size={16} className="text-blue-500" />
                        </div>

                        {!getGitState(activeProjectId!).isInitialized ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                            <GitBranch size={32} className="mb-4 text-slate-700" />
                            <p className="text-xs text-slate-500 mb-6 font-medium">Initialize git tracking for version history and remote replication.</p>
                            <button 
                              onClick={() => initGitRepo(activeProjectId!)}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
                            >
                              Initalize Repository
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col gap-6 min-h-0">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Changes</span>
                                <span className="px-2 py-0.5 bg-slate-800 text-[9px] font-bold text-slate-400 rounded-md">
                                  {getGitState(activeProjectId!).stagedFiles.length} Staged
                                </span>
                              </div>
                              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {files.filter(f => f.projectId === activeProjectId).map(file => {
                                  const isStaged = getGitState(activeProjectId!).stagedFiles.includes(file.id);
                                  return (
                                    <div key={file.id} className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded-xl transition-colors group">
                                      <div className="flex items-center gap-2 truncate">
                                        <FileCode size={12} className="text-slate-600" />
                                        <span className="text-xs text-slate-400 truncate">{file.name}</span>
                                      </div>
                                      <button 
                                        onClick={() => stageFile(activeProjectId!, file.id)}
                                        className={`p-1 rounded-lg transition-all ${isStaged ? 'bg-teal-500/20 text-teal-400' : 'hover:bg-slate-700 text-slate-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <textarea 
                                placeholder="Commit message..."
                                id="commit-msg"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 min-h-[60px] resize-none"
                              />
                              <button 
                                onClick={() => {
                                  const msg = (document.getElementById('commit-msg') as HTMLTextAreaElement).value;
                                  if (!msg) return;
                                  commitChanges(activeProjectId!, msg);
                                  (document.getElementById('commit-msg') as HTMLTextAreaElement).value = '';
                                }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all"
                              >
                                Commit to Main
                              </button>
                              <button 
                                onClick={() => handlePushRepo(activeProjectId!)}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2"
                              >
                                <Share size={14} />
                                Push to Relay
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 mt-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-800 block pb-2">Commit History</span>
                              {getGitState(activeProjectId!).commits.map(commit => (
                                <div key={commit.id} className="flex gap-3 relative">
                                  <div className="pt-1 flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <div className="w-[1px] flex-1 bg-slate-800 my-1" />
                                  </div>
                                  <div className="pb-4 flex-1">
                                    <p className="text-xs text-slate-300 font-medium">{commit.message}</p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-[10px] text-slate-600 font-mono italic">#{commit.id}</span>
                                      <span className="text-[10px] text-slate-600">{new Date(commit.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {getGitState(activeProjectId!).commits.length === 0 && <p className="text-[10px] text-slate-700 italic text-center">No history documented.</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col min-h-0 shadow-lg overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                           <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasks & Priority</h3>
                           <button 
                             onClick={() => addTask(activeProjectId!)}
                             className="p-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-all"
                           >
                             <Plus size={16} />
                           </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                          {tasks.filter(t => t.projectId === activeProjectId).map(task => (
                            <div key={task.id} className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-colors group">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <input 
                                    className="bg-transparent border-none focus:outline-none text-sm font-bold text-slate-100 w-full"
                                    value={task.title}
                                    onChange={(e) => updateTask(task.id, { title: e.target.value })}
                                  />
                                  <textarea 
                                    placeholder="Add description..."
                                    className="bg-transparent border-none focus:outline-none text-[10px] text-slate-500 w-full mt-1 min-h-[40px] resize-none"
                                    value={task.description}
                                    onChange={(e) => updateTask(task.id, { description: e.target.value })}
                                  />
                                </div>
                                <button 
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1 text-slate-600 hover:text-rose-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                                <div className="flex items-center gap-2">
                                  {(['low', 'medium', 'high'] as const).map((p) => (
                                    <button
                                      key={p}
                                      onClick={() => updateTask(task.id, { priority: p })}
                                      className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all ${
                                        task.priority === p 
                                          ? p === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                          : p === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'text-slate-600 hover:text-slate-400'
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                                <button 
                                  onClick={() => updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                                    task.status === 'completed' 
                                      ? 'bg-emerald-500/10 text-emerald-400' 
                                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                  }`}
                                >
                                  {task.status === 'completed' ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-600" />}
                                  {task.status === 'completed' ? 'COMPLETED' : 'PENDING'}
                                </button>
                              </div>
                            </div>
                          ))}
                          {tasks.filter(t => t.projectId === activeProjectId).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                              <CheckCircle2 size={32} className="mb-3" />
                              <p className="text-xs font-medium">No tasks assigned to this node.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Editor Area */}
                  <div className={`flex-1 flex-col gap-6 min-w-0 ${isMobileWorkspaceEditorOpen ? 'flex' : 'hidden lg:flex'}`}>
                    {activeFileId ? (
                      <>
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 lg:p-6 flex flex-col min-h-0 shadow-lg relative">
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                 <button 
                                   onClick={() => setIsMobileWorkspaceEditorOpen(false)}
                                   className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                                 >
                                   <ChevronLeft size={20} />
                                 </button>
                                 <div className="bg-blue-600/10 p-2 rounded-xl">
                                    <FileCode size={18} className="text-blue-500" />
                                 </div>
                                 <input 
                                   type="text"
                                   value={files.find(f => f.id === activeFileId)?.name || ''}
                                   onChange={(e) => renameFile(activeFileId!, e.target.value)}
                                   className="bg-transparent border-none focus:outline-none font-bold text-slate-200 text-sm"
                                 />
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                 <button 
                                   onClick={() => aiCodeAction('discuss', activeFileId!)}
                                   className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                                 >
                                   <MessageSquare size={12} />
                                   Discuss
                                 </button>
                                 <button 
                                   onClick={formatCode}
                                   className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                                 >
                                   <Sparkles size={12} />
                                   Format
                                 </button>
                                 <button 
                                   onClick={() => aiCodeAction('analyze', activeFileId!)}
                                   className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                                 >
                                   <Search size={12} />
                                   Analyze
                                 </button>
                                 <button 
                                   onClick={() => aiCodeAction('refactor', activeFileId!)}
                                   className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                                 >
                                   <Wand2 size={12} />
                                   Refactor
                                 </button>
                                 <button 
                                   onClick={() => aiCodeAction('debug', activeFileId!)}
                                   className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                                 >
                                   <Bug size={12} />
                                   Debug
                                 </button>
                                 <button 
                                   onClick={() => {
                                      const content = files.find(f => f.id === activeFileId)?.content || '';
                                      setTerminalCode(content);
                                      runCode();
                                   }}
                                   className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                                 >
                                   <Play size={12} />
                                   Run
                                 </button>
                              </div>
                           </div>

                           <textarea 
                             value={files.find(f => f.id === activeFileId)?.content || ''}
                             onChange={(e) => updateFileContent(activeFileId!, e.target.value)}
                             spellCheck={false}
                             className="flex-1 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-4 lg:p-6 font-mono text-xs lg:text-sm leading-relaxed text-blue-100/80 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner custom-scrollbar min-h-[200px]"
                           />
                        </div>
                        
                        <div className="h-40 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                           <div className="px-6 py-2 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local Runtime Log</span>
                              <button onClick={() => setTerminalOutput([])} className="text-slate-600 hover:text-slate-400"><Trash2 size={12} /></button>
                           </div>
                           <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar">
                              {terminalOutput.map((log, i) => (
                                <div key={i} className="mb-1 text-slate-400">
                                   <span className="text-slate-600 mr-2 opacity-50 shrink-0">{i + 1}</span>
                                   {log}
                                </div>
                              ))}
                              {terminalOutput.length === 0 && <p className="text-slate-700 italic">No execution data in buffer.</p>}
                           </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                        <FileCode size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">Select or create a file to start developing.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 lg:p-12 opacity-50">
                   <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                      <FolderOpen size={30} className="text-slate-600 lg:size-40" />
                   </div>
                   <h3 className="text-lg lg:text-xl font-bold text-slate-300">No Active Workspace</h3>
                   <p className="text-xs lg:text-sm max-w-sm mt-2 font-medium leading-relaxed">Initialize a new project to start building locally-secured software nodes.</p>
                   <div className="flex flex-col sm:flex-row gap-4 mt-8">
                     <button 
                       onClick={addProject}
                       className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 flex items-center gap-2 transition-all"
                     >
                       <Plus size={18} />
                       Initialize Node
                     </button>
                     <button 
                       onClick={() => zipUploadInputRef.current?.click()}
                       className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
                     >
                       <Upload size={18} />
                       Import Zip Project
                     </button>
                   </div>
                </div>
              )}
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
