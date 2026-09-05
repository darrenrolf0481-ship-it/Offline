import { describe, it, expect } from 'vitest';

import { loadAgencyAgents } from '../server';

describe('Agency Agents Loader', () => {
  it('loads agency agents successfully', () => {
    const result = loadAgencyAgents();
    expect(result.status).toBe('success');
    expect(Array.isArray(result.agents)).toBe(true);
    expect(result.agents!.length).toBeGreaterThan(0);
  });

  it('uses in-memory cached results on subsequent calls', () => {
    const result1 = loadAgencyAgents();
    const result2 = loadAgencyAgents();
    expect(result1.agents).toBe(result2.agents); // Exact same object reference in memory
  });

  it('reloads when forceRefresh is true', () => {
    const result1 = loadAgencyAgents();
    const result2 = loadAgencyAgents(true);
    expect(result1.agents).not.toBe(result2.agents); // New array reference constructed
    expect(result1.agents).toEqual(result2.agents); // Same content
  });
});
