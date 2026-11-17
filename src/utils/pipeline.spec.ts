import { describe, expect, it } from 'vitest';
import { isValidNoteTitle } from './pipeline';

describe('isValidNoteTitle', () => {
  it('accepts a title containing text, including surrounding spaces', () => {
    expect(isValidNoteTitle('ملاحظاتي')).toBe(true);
    expect(isValidNoteTitle('  ملاحظاتي  ')).toBe(true);
  });

  it('rejects empty and whitespace-only titles', () => {
    expect(isValidNoteTitle('')).toBe(false);
    expect(isValidNoteTitle('   ')).toBe(false);
    expect(isValidNoteTitle('\t\n')).toBe(false);
  });
});
