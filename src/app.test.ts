import { describe, it, expect } from 'vitest';
import { POPULAR_MODELS } from './components/Shared';

describe('Shared Constants', () => {
  it('contains popular models list', () => {
    expect(POPULAR_MODELS).toBeDefined();
    expect(Array.isArray(POPULAR_MODELS)).toBe(true);
    expect(POPULAR_MODELS.length).toBeGreaterThan(0);
  });

  it('contains expected model entries', () => {
    const names = POPULAR_MODELS.map((m) => m.name);
    expect(names).toContain('llama3:8b');
    expect(names).toContain('phi3:mini');
  });
});

describe('Associative Correction Logic', () => {
  const getAssociativeCorrection = (input: string) => {
    const dictionary: Record<string, string> = {
      termites: 'termux',
      sentinale: 'sentinel',
      'phi index': 'Phi Sentinel value',
      brain: 'Sentinel Cognitive Engine',
    };

    let corrected = input;
    Object.keys(dictionary).forEach((key) => {
      const regex = new RegExp(key, 'gi');
      corrected = corrected.replace(regex, dictionary[key]);
    });
    return corrected;
  };

  it('corrects known misspellings and terms', () => {
    expect(getAssociativeCorrection('check the sentinale value')).toBe('check the sentinel value');
    expect(getAssociativeCorrection('phi index calculation')).toBe('Phi Sentinel value calculation');
  });
});
