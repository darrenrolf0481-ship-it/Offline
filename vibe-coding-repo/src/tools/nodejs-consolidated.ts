import { exec } from "child_process";
import { formatToolResponse } from "../utils/response.js";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";

const execAsync = promisify(exec);
const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

export const nodejsTools = [
  {
    name: "npm",
    description: "Unified npm/Node.js tool for package management and script execution. Supports install, run_script, outdated, init, and read_package actions.",
    inputSchema: z.object({
      action: z.enum(["install", "run_script", "outdated", "init", "read_package"]).describe("NPM action to perform"),
      packages: z.array(z.string()).describe("Package names to install").optional(),
      dev: z.boolean().describe("Install as dev dependencies").default(false).optional(),
      global: z.boolean().describe("Install globally").default(false).optional(),
      script: z.string().describe("Script name to run").optional(),
      name: z.string().describe("Project name (for init)").optional(),
      version: z.string().describe("Initial version (for init)").default("1.0.0").optional(),
      description: z.string().describe("Project description (for init)").optional(),
    }),
    handler: async (args: any) => {
      try {
        switch (args.action) {
          case "install": {
            let command = "npm install";
            if (args.global) command += " -g";
            if (args.dev) command += " --save-dev";
            if (args.packages && args.packages.length > 0) {
              command += " " + args.packages.join(" ");
            }
            
            const { stdout, stderr } = await execAsync(command, {
              cwd: workspacePath,
              timeout: 300000,
            });
            
            return formatToolResponse({
              success: true,
              action: "install",
              command,
              packages: args.packages || ["all dependencies"],
              stdout: stdout.trim(),
              stderr: stderr.trim(),
            });
          }
          
          case "run_script": {
            if (!args.script) {
              return formatToolResponse({ success: false, error: "script parameter required" });
            }
            const { stdout, stderr } = await execAsync(`npm run ${args.script}`, {
              cwd: workspacePath,
              timeout: 300000,
            });
            
            return formatToolResponse({
              success: true,
              action: "run_script",
              script: args.script,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
            });
          }
          
          case "outdated": {
            try {
              const { stdout } = await execAsync("npm outdated --json", {
                cwd: workspacePath,
              });
              const outdated = JSON.parse(stdout);
              return formatToolResponse({
                success: true,
                action: "outdated",
                outdated,
                count: Object.keys(outdated).length,
              });
            } catch (error: any) {
              if (error.stdout) {
                try {
                  const outdated = JSON.parse(error.stdout);
                  return formatToolResponse({
                    success: true,
                    action: "outdated",
                    outdated,
                    count: Object.keys(outdated).length,
                  });
                } catch {
                  return formatToolResponse({
                    success: true,
                    action: "outdated",
                    outdated: {},
                    count: 0,
                  });
                }
              }
              throw error;
            }
          }
          
          case "init": {
            const packageJson = {
              name: args.name || path.basename(workspacePath),
              version: args.version || "1.0.0",
              description: args.description || "",
              main: "index.js",
              scripts: {
                test: 'echo "Error: no test specified" && exit 1',
              },
              keywords: [],
              author: "",
              license: "ISC",
            };
            
            const packagePath = path.join(workspacePath, "package.json");
            await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
            
            return formatToolResponse({
              success: true,
              action: "init",
              path: "package.json",
              content: packageJson,
            });
          }
          
          case "read_package": {
            const packagePath = path.join(workspacePath, "package.json");
            const content = await fs.readFile(packagePath, "utf8");
            const packageJson = JSON.parse(content);
            
            return formatToolResponse({
              success: true,
              action: "read_package",
              packageJson,
              dependencies: packageJson.dependencies || {},
              devDependencies: packageJson.devDependencies || {},
              scripts: packageJson.scripts || {},
            });
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
