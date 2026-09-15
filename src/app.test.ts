import { describe, it, expect } from 'vitest';
import { getAssociativeCorrection } from '../index';

describe('getAssociativeCorrection', () => {
  it('replaces keywords accurately in single pass', () => {
    expect(getAssociativeCorrection('Checking termites on the system')).toBe(
      'Checking termux on the system'
    );
    expect(getAssociativeCorrection('Fixing sentinale core and phi index')).toBe(
      'Fixing sentinel core and Phi Sentinel value'
    );
    expect(getAssociativeCorrection('Querying brain')).toBe('Querying Sentinel Cognitive Engine');
  });

  it('handles case insensitivity correctly', () => {
    expect(getAssociativeCorrection('TERMITES and BRAIN')).toBe(
      'termux and Sentinel Cognitive Engine'
    );
  });

  it('returns empty/falsy input untouched', () => {
    expect(getAssociativeCorrection('')).toBe('');
  });
});
