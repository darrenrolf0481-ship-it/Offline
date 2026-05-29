import { exec } from "child_process";
import { formatToolResponse } from "../utils/response.js";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);
const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

export const cliTools = [
  {
    name: "shell",
    description: "Unified shell/CLI tool for command execution and environment management. Supports execute, get_environment, and which actions.",
    inputSchema: z.object({
      action: z.enum(["execute", "get_environment", "which"]).describe("Shell action to perform"),
      command: z.string().describe("Command to execute or locate").optional(),
      cwd: z.string().describe("Working directory (relative to workspace)").default(".").optional(),
      timeout: z.number().describe("Timeout in milliseconds").default(30000).optional(),
      variable: z.string().describe("Environment variable name").optional(),
    }),
    handler: async (args: any) => {
      try {
        switch (args.action) {
          case "execute": {
            if (!args.command) {
              return formatToolResponse({ success: false, error: "command parameter required" });
            }
            try {
              const { stdout, stderr } = await execAsync(args.command, {
                cwd: workspacePath,
                timeout: args.timeout || 30000,
                maxBuffer: 1024 * 1024 * 10,
              });
              
              return formatToolResponse({
                success: true,
                action: "execute",
                command: args.command,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: 0,
              });
            } catch (error: any) {
              return formatToolResponse({
                success: false,
                action: "execute",
                command: args.command,
                stdout: error.stdout?.trim() || "",
                stderr: error.stderr?.trim() || error.message,
                exitCode: error.code || 1,
                error: error.message,
              });
            }
          }
          
          case "get_environment": {
            if (args.variable) {
              return formatToolResponse({
                success: true,
                action: "get_environment",
                variable: args.variable,
                value: process.env[args.variable] || null,
              });
            }
            
            return formatToolResponse({
              success: true,
              action: "get_environment",
              environment: process.env,
            });
          }
          
          case "which": {
            if (!args.command) {
              return formatToolResponse({ success: false, error: "command parameter required" });
            }
            try {
              const { stdout } = await execAsync(
                process.platform === "win32" 
                  ? `where ${args.command}` 
                  : `which ${args.command}`
              );
              
              return formatToolResponse({
                success: true,
                action: "which",
                command: args.command,
                path: stdout.trim(),
              });
            } catch (error: any) {
              return formatToolResponse({
                success: false,
                action: "which",
                command: args.command,
                error: "Command not found",
              });
            }
          }
          
          default:
            return formatToolResponse({
              success: false,
              error: `Unknown action: ${args.action}`,
            });
        }
      } catch (error: any) {
        return formatToolResponse({
          success: false,
          action: args.action,
          error: error.message,
        });
      }
    },
  },
];
