import { describe, it, expect } from 'vitest';

describe('app', () => {
  it('is defined', () => {
    expect(true).toBe(true);
  });

  it('correctly applies associative term replacements', () => {
    const ASSOCIATIVE_CORRECTIONS: [RegExp, string][] = [
      [/termites/gi, 'termux'],
      [/sentinale/gi, 'sentinel'],
      [/phi index/gi, 'Phi Sentinel value'],
      [/brain/gi, 'Sentinel Cognitive Engine'],
    ];

    let input = 'Checking termites and sentinale with phi index and brain';
    for (const [regex, replacement] of ASSOCIATIVE_CORRECTIONS) {
      input = input.replace(regex, replacement);
    }

    expect(input).toBe(
      'Checking termux and sentinel with Phi Sentinel value and Sentinel Cognitive Engine'
    );
  });
});
