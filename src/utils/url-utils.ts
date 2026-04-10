export function isExcluded(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('/*')) return url.startsWith(pattern.slice(0, -2));
    return url === pattern;
  });
}

/** Strips leading slash from machineSuffix if the user accidentally includes one */
export function normalizeSuffix(suffix: string): string {
  return suffix.replace(/^\//, '');
}
