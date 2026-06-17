import { exec } from 'child_process';
import { formatToolResponse } from '../utils/response.js';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

const execAsync = promisify(exec);
const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

export const pythonTools = [
  {
    name: 'python',
    description:
      'Unified Python tool for virtual environment management, package installation, and script execution. Supports create_venv, pip_install, pip_freeze, run_script, and version actions.',
    inputSchema: z.object({
      action: z
        .enum(['create_venv', 'pip_install', 'pip_freeze', 'run_script', 'version'])
        .describe('Python action to perform'),
      venv: z.string().describe('Virtual environment name').default('venv').optional(),
      packages: z.array(z.string()).describe('Package names to install').optional(),
      requirements: z.string().describe('Path to requirements.txt file').optional(),
      output: z
        .string()
        .describe('Output file path (for pip_freeze)')
        .default('requirements.txt')
        .optional(),
      script: z.string().describe('Path to Python script').optional(),
      args: z.array(z.string()).describe('Arguments to pass to script').optional(),
    }),
    handler: async (args: any) => {
      try {
        const venvName = args.venv || 'venv';
        const pipPath =
          process.platform === 'win32'
            ? path.join(workspacePath, venvName, 'Scripts', 'pip')
            : path.join(workspacePath, venvName, 'bin', 'pip');
        const pythonPath =
          process.platform === 'win32'
            ? path.join(workspacePath, venvName, 'Scripts', 'python')
            : path.join(workspacePath, venvName, 'bin', 'python');

        switch (args.action) {
          case 'create_venv': {
            const { stdout, stderr } = await execAsync(`python3 -m venv ${venvName}`, {
              cwd: workspacePath,
            });

            return formatToolResponse({
              success: true,
              action: 'create_venv',
              venv: venvName,
              path: path.join(workspacePath, venvName),
              stdout: stdout.trim(),
              stderr: stderr.trim(),
            });
          }

          case 'pip_install': {
            let command: string;

            if (args.requirements) {
              command = `"${pipPath}" install -r ${args.requirements}`;
            } else if (args.packages && args.packages.length > 0) {
              command = `"${pipPath}" install ${args.packages.join(' ')}`;
            } else {
              return formatToolResponse({
                success: false,
                error: 'Either packages or requirements must be specified',
              });
            }

            const { stdout, stderr } = await execAsync(command, {
              cwd: workspacePath,
              timeout: 300000,
            });

            return formatToolResponse({
              success: true,
              action: 'pip_install',
              command,
              packages: args.packages || ['from requirements.txt'],
              stdout: stdout.trim(),
              stderr: stderr.trim(),
            });
          }

          case 'pip_freeze': {
            const { stdout } = await execAsync(`"${pipPath}" freeze`, {
              cwd: workspacePath,
            });

            const outputPath = path.join(workspacePath, args.output || 'requirements.txt');
            await fs.writeFile(outputPath, stdout);

            return formatToolResponse({
              success: true,
              action: 'pip_freeze',
              output: args.output || 'requirements.txt',
              packages: stdout.trim().split('\n'),
            });
          }

          case 'run_script': {
            if (!args.script) {
              return formatToolResponse({ success: false, error: 'script parameter required' });
            }

            let python = 'python3';
            if (args.venv) {
              python = `"${pythonPath}"`;
            }

            const scriptArgs = args.args ? ' ' + args.args.join(' ') : '';
            const command = `${python} ${args.script}${scriptArgs}`;

            const { stdout, stderr } = await execAsync(command, {
              cwd: workspacePath,
              timeout: 300000,
            });

            return formatToolResponse({
              success: true,
              action: 'run_script',
              script: args.script,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
            });
          }

          case 'version': {
            let python = 'python3';
            if (args.venv) {
              python = `"${pythonPath}"`;
            }

            const { stdout } = await execAsync(`${python} --version`, {
              cwd: workspacePath,
            });

            return formatToolResponse({
              success: true,
              action: 'version',
              version: stdout.trim(),
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
