#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { filesystemTools } from './tools/filesystem.js';
import { cliTools } from './tools/shell-consolidated.js';
import { gitTools } from './tools/git.js';
import { webTools } from './tools/web.js';
import { nodejsTools } from './tools/nodejs-consolidated.js';
import { pythonTools } from './tools/python-consolidated.js';
import { testTools } from './tools/testing.js';
import { automationTools } from './tools/automation.js';
import { diagnosticsTools } from './tools/diagnostics.js';
import { kubernetesTools } from './tools/kubectl-consolidated.js';
import { ragTools } from './tools/rag.js';
import { terraformTools } from './tools/terraform.js';
// Create MCP server using modern McpServer class
const server = new McpServer(
  {
    name: 'mcp-vibe-coding-tools',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools using the modern API
const allTools = [
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

// Register each tool with the server
for (const tool of allTools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema as any,
    },
    async (extra: any) => {
      const args = extra.request.params.arguments || {};
      const result = await tool.handler(args);

      // Ensure we always return a valid response
      if (!result) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ success: false, error: 'No response from handler' }, null, 2),
            },
          ],
        };
      }

      return result;
    }
  );
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Vibe Coding Tools server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
