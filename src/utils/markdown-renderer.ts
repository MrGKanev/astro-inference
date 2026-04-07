/**
 * Converts raw HTML (fetched from a page) into clean markdown text.
 *
 * Runs in the Astro SSR/SSG context - no DOM available, so we use
 * regex-based extraction focused on semantic elements only.
 */
export function htmlToMarkdown(html: string): string {
  // Remove <head>, <script>, <style>, <nav>, <footer>, <aside>
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

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
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

  // Code
  text = text
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => `\`${strip(c)}\``)
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, c) => `\`\`\`\n${strip(c)}\n\`\`\`\n\n`);

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = decodeEntities(text);

  // Collapse excess whitespace while preserving paragraph breaks
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return text;
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
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
