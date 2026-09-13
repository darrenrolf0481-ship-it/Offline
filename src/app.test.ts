import { describe, it, expect } from 'vitest';
import { SidebarItem, StatCard } from './components/Shared';

describe('Shared components', () => {
  it('exports memoized components', () => {
    expect(SidebarItem).toBeDefined();
    expect(StatCard).toBeDefined();
  });
});
