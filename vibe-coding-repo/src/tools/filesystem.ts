import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { z } from 'zod';
import { formatToolResponse } from '../utils/response.js';

const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

// Validate paths to prevent directory traversal
function validatePath(inputPath: string): string {
  const resolvedPath = path.resolve(workspacePath, inputPath);
  if (!resolvedPath.startsWith(workspacePath)) {
    throw new Error('Access denied: Path outside workspace');
  }
  return resolvedPath;
}

export const filesystemTools = [
  {
    name: 'filesystem',
    description:
      'Unified filesystem tool for all file and directory operations. Supports read, write, list, search, info, and create_directory actions.',
    inputSchema: z.object({
      action: z
        .enum(['read', 'write', 'list', 'search', 'info', 'create_directory'])
        .describe('Filesystem action to perform'),
      path: z.string().describe('Path to file or directory (relative to workspace)').optional(),
      content: z.string().describe('Content to write (for write action)').optional(),
      encoding: z.string().describe('File encoding (default: utf8)').default('utf8').optional(),
      recursive: z
        .boolean()
        .describe('List subdirectories recursively (for list action)')
        .default(false)
        .optional(),
      pattern: z.string().describe('Glob pattern to search for (for search action)').optional(),
      ignore: z
        .array(z.string())
        .describe('Patterns to ignore (for search action)')
        .default(['node_modules/**', '.git/**'])
        .optional(),
    }),
    handler: async (args: any) => {
      try {
        switch (args.action) {
          case 'read': {
            if (!args.path) {
              return formatToolResponse({ success: false, error: 'path required for read action' });
            }
            const validPath = validatePath(args.path);
            const content = await fs.readFile(validPath, args.encoding || 'utf8');
            return formatToolResponse({
              success: true,
              action: 'read',
              path: args.path,
              content: content.toString(),
              size: content.length,
            });
          }

          case 'write': {
            if (!args.path || args.content === undefined) {
              return formatToolResponse({
                success: false,
                error: 'path and content required for write action',
              });
            }
            const validPath = validatePath(args.path);
            await fs.mkdir(path.dirname(validPath), { recursive: true });
            await fs.writeFile(validPath, args.content, args.encoding || 'utf8');
            return formatToolResponse({
              success: true,
              action: 'write',
              path: args.path,
              size: args.content.length,
            });
          }

          case 'list': {
            const listPath = args.path || '.';
            const validPath = validatePath(listPath);
            const entries = await fs.readdir(validPath, { withFileTypes: true });

            let items = await Promise.all(
              entries.map(async (entry) => {
                const fullPath = path.join(validPath, entry.name);
                const stats = await fs.stat(fullPath);
                return {
                  name: entry.name,
                  type: entry.isDirectory() ? 'directory' : 'file',
                  size: stats.size,
                  modified: stats.mtime,
                };
              })
            );

            if (args.recursive) {
              const subdirs = items.filter((item) => item.type === 'directory');
              for (const subdir of subdirs) {
                const subResult: any = await filesystemTools[0].handler({
                  action: 'list',
                  path: path.join(listPath, subdir.name),
                  recursive: true,
                });
                if (subResult.content?.[0]?.text) {
                  const parsed = JSON.parse(subResult.content[0].text);
                  if (parsed.items) {
                    items = [
                      ...items,
                      ...parsed.items.map((item: any) => ({
                        ...item,
                        name: path.join(subdir.name, item.name),
                      })),
                    ];
                  }
                }
              }
            }

            return formatToolResponse({
              success: true,
              action: 'list',
              path: listPath,
              items,
              count: items.length,
            });
          }

          case 'search': {
            if (!args.pattern) {
              return formatToolResponse({
                success: false,
                error: 'pattern required for search action',
              });
            }
            const files = await glob(args.pattern, {
              cwd: workspacePath,
              ignore: args.ignore || ['node_modules/**', '.git/**'],
            });

            return formatToolResponse({
              success: true,
              action: 'search',
              pattern: args.pattern,
              files,
              count: files.length,
            });
          }

          case 'info': {
            if (!args.path) {
              return formatToolResponse({ success: false, error: 'path required for info action' });
            }
            const validPath = validatePath(args.path);
            const stats = await fs.stat(validPath);

            return formatToolResponse({
              success: true,
              action: 'info',
              path: args.path,
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              accessed: stats.atime,
              permissions: stats.mode.toString(8),
            });
          }

          case 'create_directory': {
            if (!args.path) {
              return formatToolResponse({
                success: false,
                error: 'path required for create_directory action',
              });
            }
            const validPath = validatePath(args.path);
            await fs.mkdir(validPath, { recursive: true });

            return formatToolResponse({
              success: true,
              action: 'create_directory',
              path: args.path,
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
