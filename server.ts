import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";

// Import all tools from the cloned MCP repo
import { filesystemTools } from "./vibe-coding-repo/src/tools/filesystem.js";
import { cliTools } from "./vibe-coding-repo/src/tools/shell-consolidated.js";
import { gitTools } from "./vibe-coding-repo/src/tools/git.js";
import { webTools } from "./vibe-coding-repo/src/tools/web.js";
import { nodejsTools } from "./vibe-coding-repo/src/tools/nodejs-consolidated.js";
import { pythonTools } from "./vibe-coding-repo/src/tools/python-consolidated.js";
import { testTools } from "./vibe-coding-repo/src/tools/testing.js";
import { automationTools } from "./vibe-coding-repo/src/tools/automation.js";
import { diagnosticsTools } from "./vibe-coding-repo/src/tools/diagnostics.js";
import { kubernetesTools } from "./vibe-coding-repo/src/tools/kubectl-consolidated.js";
import { ragTools } from "./vibe-coding-repo/src/tools/rag.js";
import { terraformTools } from "./vibe-coding-repo/src/tools/terraform.js";
import fs from "fs";
import matter from "gray-matter";
import { loadGithubMcpTools } from "./mcp-github-adapter.js";

let dynamicGithubTools: any[] = [];

// Optionally pre-load if token exists in env
loadGithubMcpTools().then(tools => {
  if (tools.length > 0) {
    console.log(`Loaded ${tools.length} GitHub MCP Tools.`);
    dynamicGithubTools = tools;
  }
}).catch(() => {});

const baseMcpTools = [
  ...terraformTools,
  ...filesystemTools,
  ...gitTools,
  ...nodejsTools,
  ...pythonTools,
  ...kubernetesTools,
  ...cliTools,
  ...webTools,
  ...testTools,
  ...diagnosticsTools,
  ...automationTools,
  ...ragTools,
];

async function startServer() {
  const app = express();
  const PORT = 3005;

  app.use(cors());
  
  // Ollama bypass proxy - place this BEFORE express.json() so it streams data properly
  app.use('/api/ollama', createProxyMiddleware({
    target: 'http://localhost:11434',
    changeOrigin: true,
    pathRewrite: {
      '^/api/ollama': '', // remove base path
    },
    on: {
      error: (err: any, req: any, res: any) => {
        // Ensure we send back a JSON response rather than letting Vite serve index.html
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Ollama is not running or accessible', details: err.message }));
      }
    }
  }));

  app.use(express.json());

  // === MIGRATED SERENA PYTHON MCP ROUTES ===
  
  app.get("/heartbeat", (req, res) => {
    // Stubbed heartbeat endpoint from project_server.py
    res.json({ status: "alive", message: "Node.js proxy for Serena MCP" });
  });

  app.post("/api/setup-mcp-github", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ status: "error", message: "Token required" });
      const tools = await loadGithubMcpTools(token);
      if (tools.length > 0) {
        dynamicGithubTools = tools;
        return res.json({ status: "success", message: `Connected to GitHub MCP. Loaded ${tools.length} tools.` });
      } else {
        return res.status(500).json({ status: "error", message: "Failed to load GitHub tools." });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  app.get("/api/agency-agents", (req, res) => {
    try {
      const repoPath = path.join(process.cwd(), "agency-agents-repo");
      if (!fs.existsSync(repoPath)) {
        return res.json({ status: "error", message: "Repository not found" });
      }
      
      const agents: any[] = [];
      const categories = fs.readdirSync(repoPath).filter(d => {
        const fullPath = path.join(repoPath, d);
        return fs.statSync(fullPath).isDirectory() && !d.startsWith('.');
      });

      categories.forEach(category => {
        const catPath = path.join(repoPath, category);
        const files = fs.readdirSync(catPath).filter(f => f.endsWith('.md'));
        files.forEach(file => {
          const filePath = path.join(catPath, file);
          const content = fs.readFileSync(filePath, "utf-8");
          try {
            const parsed = matter(content);
            if (parsed.data.name) {
              agents.push({
                id: `${category}-${file.replace('.md', '')}`,
                category,
                name: parsed.data.name,
                description: parsed.data.description || '',
                content: parsed.content || ''
              });
            }
          } catch(e) {
            console.warn("Failed to parse " + filePath, e);
          }
        });
      });
      
      res.json({ status: "success", agents });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  app.post("/api/agent-bridge/communicate", (req, res) => {
    try {
      const { sourceAgentId, targetAgentId, payload, context } = req.body;
      
      // Strip human convenience names and generate binary sequence / metadata to avoid identity drift
      const sourceAliasMetadata = Buffer.from(sourceAgentId || "unknown_source").toString('base64');
      const targetAliasMetadata = Buffer.from(targetAgentId || "unknown_target").toString('base64');
      const timestampMetadata = Date.now().toString(16);

      const identityHash = `seq_${sourceAliasMetadata}_to_${targetAliasMetadata}_${timestampMetadata}`;

      const sanitizedPayload = typeof payload === 'string' 
        ? payload.replace(new RegExp(sourceAgentId, 'g'), '[SND_SEQ]')
                 .replace(new RegExp(targetAgentId, 'g'), '[RCV_SEQ]')
        : payload;

      res.json({
        status: "success",
        trace_id: identityHash,
        metadata: {
           source_seq: sourceAliasMetadata,
           target_seq: targetAliasMetadata,
           drift_prevention_active: true
        },
        payload: sanitizedPayload
      });
    } catch(err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  app.post("/query_project", async (req, res) => {
    // We repurpose query_project as our central MCP tool dispatcher
    const { project_name, tool_name, tool_params_json } = req.body;
    
    console.log(`Received query for project ${project_name} using tool ${tool_name}`);
    
    try {
      const allMcpTools = [...baseMcpTools, ...dynamicGithubTools];
      const toolToRun = allMcpTools.find(t => t.name === tool_name);
      if (!toolToRun) {
        return res.json({
          status: "error",
          data: `Tool '${tool_name}' not found in MCP registry. Available tools: ${allMcpTools.map(t=>t.name).join(', ')}`
        });
      }

      const params = typeof tool_params_json === 'string' ? JSON.parse(tool_params_json) : tool_params_json;
      
      const result = await toolToRun.handler(params);
      
      res.json({
        status: "success",
        mocked: false,
        data: result
      });
    } catch (err: any) {
      console.error('Tool execution failed:', err);
      res.json({
        status: "error",
        data: err.message || "Unknown tool execution error"
      });
    }
  });

  // ==========================================

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: "all" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
