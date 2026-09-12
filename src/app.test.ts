import { describe, it, expect } from 'vitest';

import { SidebarItem, StatCard, POPULAR_MODELS } from './components/Shared';

describe('Shared UI Components Optimization', () => {
  it('exports popular models array', () => {
    expect(Array.isArray(POPULAR_MODELS)).toBe(true);
    expect(POPULAR_MODELS.length).toBeGreaterThan(0);
  });

  it('memoizes SidebarItem component to prevent unnecessary re-renders', () => {
    expect(SidebarItem).toBeDefined();
    // React.memo components have a $$typeof property corresponding to REACT_MEMO_TYPE
    const symbol = (SidebarItem as unknown as { $$typeof: symbol }).$$typeof;
    expect(symbol).toBeDefined();
    expect(symbol.toString()).toContain('react.memo');
  });

  it('memoizes StatCard component to prevent unnecessary re-renders', () => {
    expect(StatCard).toBeDefined();
    const symbol = (StatCard as unknown as { $$typeof: symbol }).$$typeof;
    expect(symbol).toBeDefined();
    expect(symbol.toString()).toContain('react.memo');
  });
});
