import { describe, it, expect } from 'vitest';
import { isExcluded, normalizeSuffix } from './url-utils.js';

describe('isExcluded', () => {
  it('returns false for empty patterns', () => {
    expect(isExcluded('/about', [])).toBe(false);
  });

  it('matches exact paths', () => {
    expect(isExcluded('/admin', ['/admin'])).toBe(true);
    expect(isExcluded('/about', ['/admin'])).toBe(false);
  });

  it('matches wildcard prefix patterns', () => {
    expect(isExcluded('/admin/users', ['/admin/*'])).toBe(true);
    expect(isExcluded('/admin/users/123', ['/admin/*'])).toBe(true);
    expect(isExcluded('/about', ['/admin/*'])).toBe(false);
  });

  it('does not match partial segment with wildcard', () => {
    expect(isExcluded('/administration', ['/admin/*'])).toBe(false);
  });

  it('matches against multiple patterns', () => {
    expect(isExcluded('/secret', ['/admin/*', '/secret'])).toBe(true);
  });

  it('handles root path', () => {
    expect(isExcluded('/', ['/'])).toBe(true);
    expect(isExcluded('/', ['/about'])).toBe(false);
  });
});

describe('normalizeSuffix', () => {
  it('strips leading slash', () => {
    expect(normalizeSuffix('/machine.txt')).toBe('machine.txt');
  });

  it('leaves suffix without slash unchanged', () => {
    expect(normalizeSuffix('machine.txt')).toBe('machine.txt');
  });

  it('only strips leading slash', () => {
    expect(normalizeSuffix('/foo/bar.txt')).toBe('foo/bar.txt');
  });
});
