/**
 * Converts raw HTML (fetched from a page) into clean markdown text.
 *
 * Runs in the Astro SSR/SSG context - no DOM available, so we use
 * regex-based extraction focused on semantic elements only.
 */
export function htmlToMarkdown(html: string): string {
  // Extract <nav> links before removing the element —
  // LLMs need navigation links to traverse the site
  const navLinks = extractNavLinks(html);

  // Remove non-semantic elements
  let text = html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');

  // Convert headings
  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `# ${strip(c)}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `## ${strip(c)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `### ${strip(c)}\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `#### ${strip(c)}\n\n`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, c) => `##### ${strip(c)}\n\n`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, c) => `###### ${strip(c)}\n\n`);

  // Convert links — skip anchor-only links (e.g. #main-content, #skip)
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
    if (isSkipLink(href, strip(label))) return '';
    const cleanLabel = strip(label);
    return cleanLabel ? `[${cleanLabel}](${href})` : href;
  });

  // Convert images to alt text references
  text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, (_, alt) =>
    alt ? `[Image: ${alt}]` : ''
  );

  // Convert lists
  text = text
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${strip(c)}\n`)
    .replace(/<\/ul>|<\/ol>/gi, '\n')
    .replace(/<ul[^>]*>|<ol[^>]*>/gi, '\n');

  // Paragraphs and line breaks
  text = text
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `${strip(c)}\n\n`)
    .replace(/<br\s*\/?>/gi, '\n');

  // Bold / italic
  text = text
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, c) => `**${strip(c)}**`)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, c) => `**${strip(c)}**`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, c) => `_${strip(c)}_`)
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_, c) => `_${strip(c)}_`);

  // Code — pre must come before code so nested <code> inside <pre> isn't double-processed
  text = text
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => `\`\`\`\n${strip(c)}\n\`\`\`\n\n`)
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${strip(c)}\``);

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = decodeEntities(text);

  // Collapse excess whitespace while preserving paragraph breaks
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Append navigation links so LLMs can traverse the site
  if (navLinks.length > 0) {
    text += '\n\n## Navigation\n\n' + navLinks.map(l => `- [${l.label}](${l.href})`).join('\n');
  }

  return text;
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/** Returns true for accessibility skip-links and fragment-only anchors */
function isSkipLink(href: string, label: string): boolean {
  // Pure fragment links like #main-content, #skip, #content
  if (/^#/.test(href)) return true;
  // Common skip-link label patterns
  if (/^skip\s+to|^skip\s+nav/i.test(label)) return true;
  return false;
}

interface NavLink { label: string; href: string }

/** Extracts navigation links from <nav> elements, filtering out skip-links */
function extractNavLinks(html: string): NavLink[] {
  const links: NavLink[] = [];
  const seen = new Set<string>();

  const navMatches = html.matchAll(/<nav[\s\S]*?<\/nav>/gi);
  for (const navMatch of navMatches) {
    const navHtml = navMatch[0];
    const anchorMatches = navHtml.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);
    for (const [, href, rawLabel] of anchorMatches) {
      const label = strip(rawLabel);
      if (!label || !href) continue;
      if (isSkipLink(href, label)) continue;
      if (seen.has(href)) continue;
      seen.add(href);
      links.push({ label, href });
    }
  }

  return links;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…');
}
