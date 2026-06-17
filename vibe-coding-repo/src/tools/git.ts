import { simpleGit, SimpleGit } from 'simple-git';
import * as path from 'path';
import { formatToolResponse } from '../utils/response.js';
import { z } from 'zod';

const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
const git: SimpleGit = simpleGit(workspacePath);

export const gitTools = [
  {
    name: 'git',
    description:
      'Unified git tool for all version control operations. Supports status, log, diff, branch, commit, push, pull, clone, and stash actions.',
    inputSchema: z.object({
      action: z
        .enum(['status', 'log', 'diff', 'branch', 'commit', 'push', 'pull', 'clone', 'stash'])
        .describe('Git action to perform'),
      maxCount: z.number().describe('Maximum commits to retrieve (log)').default(10).optional(),
      file: z.string().describe('File path for log/diff').optional(),
      staged: z.boolean().describe('Show staged changes (diff)').default(false).optional(),
      branchAction: z
        .enum(['list', 'create', 'switch', 'delete'])
        .describe('Branch operation')
        .optional(),
      name: z.string().describe('Branch/stash name').optional(),
      message: z.string().describe('Commit/stash message').optional(),
      files: z.array(z.string()).describe('Files to commit').optional(),
      remote: z.string().describe('Remote name').default('origin').optional(),
      branch: z.string().describe('Branch name').optional(),
      url: z.string().describe('Repository URL (clone)').optional(),
      directory: z.string().describe('Target directory (clone)').optional(),
      stashAction: z.enum(['save', 'pop', 'list']).describe('Stash operation').optional(),
    }),
    handler: async (args: any) => {
      try {
        switch (args.action) {
          case 'status': {
            const status = await git.status();
            return formatToolResponse({
              success: true,
              action: 'status',
              current: status.current,
              tracking: status.tracking,
              ahead: status.ahead,
              behind: status.behind,
              modified: status.modified,
              created: status.created,
              deleted: status.deleted,
              renamed: status.renamed,
              conflicted: status.conflicted,
              isClean: status.isClean(),
            });
          }

          case 'log': {
            const options: any = { maxCount: args.maxCount || 10 };
            if (args.file) options.file = args.file;
            const log = await git.log(options);
            return formatToolResponse({
              success: true,
              action: 'log',
              total: log.total,
              commits: log.all.map((commit) => ({
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email,
              })),
            });
          }

          case 'diff': {
            const options = args.staged ? ['--cached'] : [];
            if (args.file) options.push(args.file);
            const diff = await git.diff(options);
            return formatToolResponse({
              success: true,
              action: 'diff',
              diff,
            });
          }

          case 'branch': {
            const branchAction = args.branchAction || 'list';
            switch (branchAction) {
              case 'list': {
                const branches = await git.branch();
                return formatToolResponse({
                  success: true,
                  action: 'branch',
                  branchAction: 'list',
                  current: branches.current,
                  all: branches.all,
                });
              }
              case 'create': {
                if (!args.name) throw new Error('Branch name required');
                await git.checkoutLocalBranch(args.name);
                return formatToolResponse({
                  success: true,
                  action: 'branch',
                  branchAction: 'create',
                  branch: args.name,
                });
              }
              case 'switch': {
                if (!args.name) throw new Error('Branch name required');
                await git.checkout(args.name);
                return formatToolResponse({
                  success: true,
                  action: 'branch',
                  branchAction: 'switch',
                  branch: args.name,
                });
              }
              case 'delete': {
                if (!args.name) throw new Error('Branch name required');
                await git.deleteLocalBranch(args.name);
                return formatToolResponse({
                  success: true,
                  action: 'branch',
                  branchAction: 'delete',
                  branch: args.name,
                });
              }
            }
            break;
          }

          case 'commit': {
            if (!args.message) throw new Error('Commit message required');
            if (args.files && args.files.length > 0) {
              await git.add(args.files);
            } else {
              await git.add('.');
            }
            const commitResult = await git.commit(args.message);
            return formatToolResponse({
              success: true,
              action: 'commit',
              commit: commitResult.commit,
              summary: commitResult.summary,
            });
          }

          case 'push': {
            const remote = args.remote || 'origin';
            const branch = args.branch || (await git.branch()).current;
            await git.push(remote, branch);
            return formatToolResponse({
              success: true,
              action: 'push',
              remote,
              branch,
            });
          }

          case 'pull': {
            const remote = args.remote || 'origin';
            const branch = args.branch || (await git.branch()).current;
            const pullResult = await git.pull(remote, branch);
            return formatToolResponse({
              success: true,
              action: 'pull',
              remote,
              branch,
              summary: pullResult.summary,
            });
          }

          case 'clone': {
            if (!args.url) throw new Error('Repository URL required');
            const targetPath = args.directory
              ? path.join(workspacePath, args.directory)
              : workspacePath;
            await git.clone(args.url, targetPath);
            return formatToolResponse({
              success: true,
              action: 'clone',
              url: args.url,
              directory: args.directory || '.',
            });
          }

          case 'stash': {
            const stashAction = args.stashAction || 'save';
            switch (stashAction) {
              case 'save': {
                const message = args.message || 'WIP';
                await git.stash(['save', message]);
                return formatToolResponse({
                  success: true,
                  action: 'stash',
                  stashAction: 'save',
                  message,
                });
              }
              case 'pop': {
                await git.stash(['pop']);
                return formatToolResponse({
                  success: true,
                  action: 'stash',
                  stashAction: 'pop',
                });
              }
              case 'list': {
                const stashList = await git.stashList();
                return formatToolResponse({
                  success: true,
                  action: 'stash',
                  stashAction: 'list',
                  stashes: stashList.all,
                });
              }
            }
            break;
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
