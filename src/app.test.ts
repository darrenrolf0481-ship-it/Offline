import { describe, it, expect } from 'vitest';
import { calculatePhiValue } from './components/Shared';

describe('calculatePhiValue', () => {
  it('correctly computes sentinel Phi value with empty state', () => {
    const phi = calculatePhiValue([], []);
    expect(phi).toBe(0);
  });

  it('correctly computes sentinel Phi value with notes and models', () => {
    const notes = [
      { content: 'hello world' },
      { content: 'a'.repeat(1000) },
    ];
    const models = ['llama3', 'mistral'];

    const phi = calculatePhiValue(notes, models);
    expect(phi).toBeCloseTo(7.011, 3);
  });
});
