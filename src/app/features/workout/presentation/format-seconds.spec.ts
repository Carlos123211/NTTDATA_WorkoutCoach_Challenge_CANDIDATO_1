import { formatSeconds } from './format-seconds';

describe('formatSeconds (D10, CA-15)', () => {
  const cases: [number, string][] = [
    [0, '00:00'],
    [5, '00:05'],
    [59, '00:59'],
    [60, '01:00'],
    [75, '01:15'],
    [3599, '59:59'],
    [-3, '00:00'],
    [Number.NaN, '00:00'],
  ];

  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => {
      expect(formatSeconds(input)).toBe(expected);
    });
  }
});
