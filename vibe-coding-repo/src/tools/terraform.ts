import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { formatToolResponse } from "../utils/response.js";

const execAsync = promisify(exec);
const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

export const terraformTools = [
  {
    name: "terraform",
    description: "Unified Terraform tool for CLI operations, registry documentation lookup, and state management. Supports init, plan, apply, destroy, validate, fmt, state operations, and documentation queries.",
    inputSchema: z.object({
      action: z.enum([
        "init",
        "plan",
        "apply",
        "destroy",
        "validate",
        "fmt",
        "state_list",
        "state_show",
        "state_pull",
        "output",
        "workspace_list",
        "workspace_new",
        "workspace_select",
        "docs_search",
        "docs_provider",
        "docs_resource",
        "docs_function",
        "version",
      ]).describe("Terraform action to perform"),
      
      // Common options
      directory: z.string().describe("Working directory for Terraform (relative to workspace)").default(".").optional(),
      autoApprove: z.boolean().describe("Auto-approve apply/destroy operations").default(false).optional(),
      
      // Plan/Apply options
      varFile: z.string().describe("Path to .tfvars file").optional(),
      vars: z.record(z.string(), z.string()).describe("Variable key-value pairs").optional(),
      target: z.string().describe("Target specific resource (e.g., 'module.vpc')").optional(),
      planFile: z.string().describe("Path to save/use plan file").optional(),
      
      // State operations
      resource: z.string().describe("Resource address for state operations").optional(),
      
      // Workspace operations
      workspace: z.string().describe("Workspace name").optional(),
      
      // Documentation search
      query: z.string().describe("Search query for Terraform docs").optional(),
      provider: z.string().describe("Provider name (e.g., 'aws', 'google', 'azurerm')").optional(),
      resourceType: z.string().describe("Resource type (e.g., 'aws_instance', 'google_compute_instance')").optional(),
      functionName: z.string().describe("Function name (e.g., 'lookup', 'merge', 'jsonencode')").optional(),
      
      // Format options
      check: z.boolean().describe("Check if files are formatted (fmt only)").default(false).optional(),
      recursive: z.boolean().describe("Process subdirectories recursively (fmt only)").default(false).optional(),
    }),
    handler: async (args: any) => {
      const cwd = args.directory ? `${workspacePath}/${args.directory}` : workspacePath;
      
      try {
        switch (args.action) {
          case "init": {
            const { stdout, stderr } = await execAsync("terraform init", { cwd });
            return formatToolResponse({
              success: true,
              action: "init",
              output: stdout,
              warnings: stderr || undefined,
            });
          }
          
          case "plan": {
            let command = "terraform plan";
            
            if (args.varFile) command += ` -var-file="${args.varFile}"`;
            if (args.vars) {
              for (const [key, value] of Object.entries(args.vars)) {
                command += ` -var="${key}=${value}"`;
              }
            }
            if (args.target) command += ` -target="${args.target}"`;
            if (args.planFile) command += ` -out="${args.planFile}"`;
            
            const { stdout, stderr } = await execAsync(command, { cwd, maxBuffer: 1024 * 1024 * 10 });
            return formatToolResponse({
              success: true,
              action: "plan",
              command,
              output: stdout,
              warnings: stderr || undefined,
            });
          }
          
          case "apply": {
            let command = "terraform apply";
            
            if (args.autoApprove) command += " -auto-approve";
            if (args.planFile) {
              command += ` "${args.planFile}"`;
            } else {
              if (args.varFile) command += ` -var-file="${args.varFile}"`;
              if (args.vars) {
                for (const [key, value] of Object.entries(args.vars)) {
                  command += ` -var="${key}=${value}"`;
                }
              }
              if (args.target) command += ` -target="${args.target}"`;
            }
            
            const { stdout, stderr } = await execAsync(command, { 
              cwd, 
              maxBuffer: 1024 * 1024 * 10,
              timeout: 600000, // 10 minutes
            });
            return formatToolResponse({
              success: true,
              action: "apply",
              command,
              output: stdout,
              warnings: stderr || undefined,
            });
          }
          
          case "destroy": {
            let command = "terraform destroy";
            
            if (args.autoApprove) command += " -auto-approve";
            if (args.varFile) command += ` -var-file="${args.varFile}"`;
            if (args.vars) {
              for (const [key, value] of Object.entries(args.vars)) {
                command += ` -var="${key}=${value}"`;
              }
            }
            if (args.target) command += ` -target="${args.target}"`;
            
            const { stdout, stderr } = await execAsync(command, { 
              cwd,
              maxBuffer: 1024 * 1024 * 10,
              timeout: 600000,
            });
            return formatToolResponse({
              success: true,
              action: "destroy",
              command,
              output: stdout,
              warnings: stderr || undefined,
            });
          }
          
          case "validate": {
            const { stdout, stderr } = await execAsync("terraform validate -json", { cwd });
            const validation = JSON.parse(stdout);
            return formatToolResponse({
              success: validation.valid,
              action: "validate",
              valid: validation.valid,
              diagnostics: validation.diagnostics || [],
              errorCount: validation.error_count || 0,
              warningCount: validation.warning_count || 0,
            });
          }
          
          case "fmt": {
            let command = "terraform fmt";
            if (args.check) command += " -check";
            if (args.recursive) command += " -recursive";
            
            try {
              const { stdout } = await execAsync(command, { cwd });
              const files = stdout.trim().split("\n").filter(Boolean);
              return formatToolResponse({
                success: true,
                action: "fmt",
                formatted: !args.check,
                filesChanged: files,
                count: files.length,
              });
            } catch (error: any) {
              // fmt returns non-zero if files need formatting in check mode
              if (args.check && error.code === 3) {
                const files = error.stdout?.trim().split("\n").filter(Boolean) || [];
                return formatToolResponse({
                  success: false,
                  action: "fmt",
                  needsFormatting: true,
                  files,
                  message: "Files need formatting",
                });
              }
              throw error;
            }
          }
          
          case "state_list": {
            const { stdout } = await execAsync("terraform state list", { cwd });
            const resources = stdout.trim().split("\n").filter(Boolean);
            return formatToolResponse({
              success: true,
              action: "state_list",
              resources,
              count: resources.length,
            });
          }
          
          case "state_show": {
            if (!args.resource) {
              return formatToolResponse({
                success: false,
                error: "resource parameter required for state_show",
              });
            }
            const { stdout } = await execAsync(`terraform state show "${args.resource}"`, { cwd });
            return formatToolResponse({
              success: true,
              action: "state_show",
              resource: args.resource,
              details: stdout,
            });
          }
          
          case "state_pull": {
            const { stdout } = await execAsync("terraform state pull", { cwd });
            const state = JSON.parse(stdout);
            return formatToolResponse({
              success: true,
              action: "state_pull",
              version: state.version,
              terraformVersion: state.terraform_version,
              serial: state.serial,
              resourceCount: state.resources?.length || 0,
              state: state,
            });
          }
          
          case "output": {
            const { stdout } = await execAsync("terraform output -json", { cwd });
            const outputs = JSON.parse(stdout);
            return formatToolResponse({
              success: true,
              action: "output",
              outputs,
            });
          }
          
          case "workspace_list": {
            const { stdout } = await execAsync("terraform workspace list", { cwd });
            const lines = stdout.trim().split("\n");
            const workspaces = lines.map(line => {
              const isCurrent = line.startsWith("*");
              const name = line.replace(/^\*?\s+/, "");
              return { name, current: isCurrent };
            });
            return formatToolResponse({
              success: true,
              action: "workspace_list",
              workspaces,
              current: workspaces.find(w => w.current)?.name,
            });
          }
          
          case "workspace_new": {
            if (!args.workspace) {
              return formatToolResponse({
                success: false,
                error: "workspace parameter required for workspace_new",
              });
            }
            const { stdout } = await execAsync(`terraform workspace new "${args.workspace}"`, { cwd });
            return formatToolResponse({
              success: true,
              action: "workspace_new",
              workspace: args.workspace,
              output: stdout,
            });
          }
          
          case "workspace_select": {
            if (!args.workspace) {
              return formatToolResponse({
                success: false,
                error: "workspace parameter required for workspace_select",
              });
            }
            const { stdout } = await execAsync(`terraform workspace select "${args.workspace}"`, { cwd });
            return formatToolResponse({
              success: true,
              action: "workspace_select",
              workspace: args.workspace,
              output: stdout,
            });
          }
          
          case "docs_search": {
            if (!args.query) {
              return formatToolResponse({
                success: false,
                error: "query parameter required for docs_search",
              });
            }
            
            // Provide direct links to Terraform documentation
            const docsUrl = `https://registry.terraform.io/search?q=${encodeURIComponent(args.query)}`;
            return formatToolResponse({
              success: true,
              action: "docs_search",
              query: args.query,
              registrySearchUrl: docsUrl,
              officialDocsUrl: "https://www.terraform.io/docs",
              message: "Visit the Terraform Registry to search for providers, modules, and documentation",
              quickLinks: {
                providers: "https://registry.terraform.io/browse/providers",
                modules: "https://registry.terraform.io/browse/modules",
                functions: "https://www.terraform.io/language/functions",
                tutorials: "https://developer.hashicorp.com/terraform/tutorials",
              },
            });
          }
          
          case "docs_provider": {
            if (!args.provider) {
              return formatToolResponse({
                success: false,
                error: "provider parameter required for docs_provider",
              });
            }
            
            const providerUrl = `https://registry.terraform.io/providers/hashicorp/${args.provider}/latest/docs`;
            return formatToolResponse({
              success: true,
              action: "docs_provider",
              provider: args.provider,
              docsUrl: providerUrl,
              message: `Documentation for ${args.provider} provider`,
              commonProviders: {
                aws: "https://registry.terraform.io/providers/hashicorp/aws/latest/docs",
                google: "https://registry.terraform.io/providers/hashicorp/google/latest/docs",
                azurerm: "https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs",
                kubernetes: "https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs",
              },
            });
          }
          
          case "docs_resource": {
            if (!args.provider || !args.resourceType) {
              return formatToolResponse({
                success: false,
                error: "provider and resourceType parameters required for docs_resource",
              });
            }
            
            const resourceUrl = `https://registry.terraform.io/providers/hashicorp/${args.provider}/latest/docs/resources/${args.resourceType.replace(`${args.provider}_`, "")}`;
            return formatToolResponse({
              success: true,
              action: "docs_resource",
              provider: args.provider,
              resourceType: args.resourceType,
              docsUrl: resourceUrl,
              message: `Documentation for ${args.resourceType} resource`,
            });
          }
          
          case "docs_function": {
            if (!args.functionName) {
              return formatToolResponse({
                success: false,
                error: "functionName parameter required for docs_function",
              });
            }
            
            const functionUrl = `https://www.terraform.io/language/functions/${args.functionName}`;
            return formatToolResponse({
              success: true,
              action: "docs_function",
              functionName: args.functionName,
              docsUrl: functionUrl,
              message: `Documentation for ${args.functionName} function`,
              commonFunctions: {
                string: ["format", "join", "split", "substr", "replace", "regex"],
                collection: ["concat", "element", "lookup", "merge", "flatten"],
                encoding: ["jsonencode", "jsondecode", "yamlencode", "yamldecode", "base64encode"],
                filesystem: ["file", "fileexists", "fileset", "templatefile"],
                datetime: ["timestamp", "formatdate", "timeadd"],
                crypto: ["md5", "sha1", "sha256", "sha512", "uuid"],
              },
            });
          }
          
          case "version": {
            const { stdout } = await execAsync("terraform version -json", { cwd });
            const version = JSON.parse(stdout);
            return formatToolResponse({
              success: true,
              action: "version",
              terraformVersion: version.terraform_version,
              platform: version.platform,
              providerSelections: version.provider_selections,
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
          stderr: error.stderr?.trim() || undefined,
          stdout: error.stdout?.trim() || undefined,
          exitCode: error.code,
        });
      }
    },
  },
];
