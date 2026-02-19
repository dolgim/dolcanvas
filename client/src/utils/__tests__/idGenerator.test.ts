import { describe, expect, it } from 'vitest';
import { generateStrokeId, generateUserId } from '../idGenerator';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('generateStrokeId', () => {
  it('should return a valid UUID format', () => {
    expect(generateStrokeId()).toMatch(UUID_REGEX);
  });

  it('should return unique values on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateStrokeId()));
    expect(ids.size).toBe(100);
  });
});

describe('generateUserId', () => {
  it('should return a valid UUID format', () => {
    expect(generateUserId()).toMatch(UUID_REGEX);
  });

  it('should return unique values on each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUserId()));
    expect(ids.size).toBe(100);
  });
});
