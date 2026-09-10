import { describe, it, expect } from 'vitest';

describe('app', () => {
  it('is defined', () => {
    expect(true).toBe(true);
  });

  it('parses agency agents and caches subsequent calls', async () => {
    const { getAgencyAgentsData, clearAgencyAgentsCache } = await import('../server');
    clearAgencyAgentsCache();

    const firstResult = getAgencyAgentsData();
    expect(firstResult.status).toBe('success');
    expect(Array.isArray(firstResult.agents)).toBe(true);
    expect(firstResult.agents!.length).toBeGreaterThan(0);

    const secondResult = getAgencyAgentsData();
    expect(secondResult.status).toBe('success');
    expect(secondResult.agents).toBe(firstResult.agents); // Same array reference indicates in-memory cache return
  });
});
