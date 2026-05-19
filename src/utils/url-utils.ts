export function isExcluded(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1); // e.g. "/admin/"
      return url.startsWith(prefix);
    }
    return url === pattern;
  });
}

/** Strips leading slash from machineSuffix if the user accidentally includes one */
export function normalizeSuffix(suffix: string): string {
  return suffix.replace(/^\//, '');
}
