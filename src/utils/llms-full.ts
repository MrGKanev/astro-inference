/** One page's full-text content, ready to be concatenated into llms-full.txt */
export interface LlmsFullPage {
  url: string;
  markdown: string;
}

/** Builds the concatenated llms-full.txt body from every page's markdown */
export function buildLlmsFullTxt(
  siteName: string,
  pages: LlmsFullPage[],
  footer: string
): string {
  const today = new Date().toISOString().split('T')[0];

  const header = [
    `# ${siteName}`,
    `> Full-text content of every page on this site - ${today}`,
  ].join('\n');

  const sections = pages.map(({ url, markdown }) => [`## ${url}`, '', markdown].join('\n'));

  const body = [header, ...sections].join('\n\n---\n\n');

  return footer ? `${body}\n\n---\n${footer}` : body;
}
