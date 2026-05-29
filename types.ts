export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface VFile {
  id: string;
  name: string;
  content: string;
  language: string;
  projectId: string;
  folderId: string | null;
  updatedAt: number;
}

export interface VFolder {
  id: string;
  name: string;
  projectId: string;
  updatedAt: number;
}

export interface GitCommit {
  id: string;
  message: string;
  timestamp: number;
  author: string;
  files: { id: string, content: string }[];
}

export interface GitState {
  projectId: string;
  stagedFiles: string[];
  commits: GitCommit[];
  isInitialized: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  instructions: string;
  constraints: string[];
  tools: string[];
  updatedAt: number;
}

export interface AgentRun {
  id: string;
  agentId: string;
  status: 'deploying' | 'running' | 'completed' | 'failed';
  currentStep: string;
  logs: { timestamp: number; message: string; type: 'info' | 'action' | 'success' | 'error' }[];
  result?: string;
  startedAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  attachments?: { name: string, content: string }[];
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  summary: string;
  updatedAt: number;
}

export interface LLMConfig {
  provider: 'ollama' | 'custom';
  endpoint: string;
  model: string;
  systemPrompt: string;
}

export interface DownloadProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  percent?: number;
}

export interface Experience {
  id: string;
  intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  actionTaken: string;
  outcomeValue: number;
  timestamp: number;
}

export interface BrainState {
  dopamine: number;
  cortisol: number;
  lastUpdated: number;
}

export interface AvoidanceNode {
  contextHash: string;
  weight: number;
  reason: string;
}
