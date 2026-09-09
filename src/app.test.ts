import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface AgencyAgent {
  id: string;
  category: string;
  name: string;
  description: string;
  content: string;
}

function getAgencyAgents(
  repoPath: string,
  cacheRef: { current: AgencyAgent[] | null }
): { agents: AgencyAgent[]; cached: boolean } {
  if (cacheRef.current) {
    return { agents: cacheRef.current, cached: true };
  }

  if (!fs.existsSync(repoPath)) {
    return { agents: [], cached: false };
  }

  const agents: AgencyAgent[] = [];
  const categories = fs.readdirSync(repoPath).filter((d) => {
    const fullPath = path.join(repoPath, d);
    return fs.statSync(fullPath).isDirectory() && !d.startsWith('.');
  });

  categories.forEach((category) => {
    const catPath = path.join(repoPath, category);
    const files = fs.readdirSync(catPath).filter((f) => f.endsWith('.md'));
    files.forEach((file) => {
      const filePath = path.join(catPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        const parsed = matter(content);
        if (parsed.data.name) {
          agents.push({
            id: `${category}-${file.replace('.md', '')}`,
            category,
            name: parsed.data.name as string,
            description: (parsed.data.description as string) || '',
            content: parsed.content || '',
          });
        }
      } catch {
        // ignore
      }
    });
  });

  cacheRef.current = agents;
  return { agents, cached: false };
}

describe('agency agents loading and caching', () => {
  it('loads agency agents from repository and caches subsequent calls', () => {
    const cacheRef: { current: AgencyAgent[] | null } = { current: null };
    const repoPath = path.join(process.cwd(), 'agency-agents-repo');

    const firstResult = getAgencyAgents(repoPath, cacheRef);
    expect(firstResult.cached).toBe(false);
    expect(firstResult.agents.length).toBeGreaterThan(0);

    const secondResult = getAgencyAgents(repoPath, cacheRef);
    expect(secondResult.cached).toBe(true);
    expect(secondResult.agents).toBe(firstResult.agents);
  });
});
