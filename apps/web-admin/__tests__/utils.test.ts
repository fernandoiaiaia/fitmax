import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('utils cn()', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
