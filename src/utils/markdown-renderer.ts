import { parse } from 'node-html-parser';
import type { HTMLElement as NHElement } from 'node-html-parser';

export function htmlToMarkdown(html: string): string {
  const root = parse(html);

  // Extract nav links before removing the nav element —
  // LLMs need navigation links to traverse the site
  const navLinks = extractNavLinks(root);

  // Remove non-semantic elements
  for (const sel of ['head', 'script', 'style', 'nav', 'footer', 'aside', 'header']) {
    root.querySelectorAll(sel).forEach(el => el.remove());
  }

  let text = convertElement(root).trim();

  // Collapse excess blank lines and stray horizontal whitespace
  text = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();

  if (navLinks.length > 0) {
    text += '\n\n## Navigation\n\n' + navLinks.map(l => `- [${l.label}](${l.href})`).join('\n');
  }

  return text;
}

function convertElement(el: NHElement): string {
  const tag = el.tagName?.toLowerCase() ?? '';

  switch (tag) {
    case 'h1': return `# ${el.text.trim()}\n\n`;
    case 'h2': return `## ${el.text.trim()}\n\n`;
    case 'h3': return `### ${el.text.trim()}\n\n`;
    case 'h4': return `#### ${el.text.trim()}\n\n`;
    case 'h5': return `##### ${el.text.trim()}\n\n`;
    case 'h6': return `###### ${el.text.trim()}\n\n`;
    case 'p': return `${convertChildren(el)}\n\n`;
    case 'br': return '\n';
    case 'a': {
      const href = el.getAttribute('href') ?? '';
      const label = el.text.trim();
      if (!href || isSkipLink(href, label)) return label;
      return label ? `[${label}](${href})` : href;
    }
    case 'img': {
      const alt = el.getAttribute('alt') ?? '';
      return alt ? `[Image: ${alt}]` : '';
    }
    case 'strong':
    case 'b': {
      const t = el.text.trim();
      return t ? `**${t}**` : '';
    }
    case 'em':
    case 'i': {
      const t = el.text.trim();
      return t ? `_${t}_` : '';
    }
    case 'pre': {
      // Use el.text directly to avoid double-formatting a nested <code>
      const content = el.text.trim();
      return content ? `\`\`\`\n${content}\n\`\`\`\n\n` : '';
    }
    case 'code': {
      const parentTag = (el.parentNode as NHElement | null)?.tagName?.toLowerCase();
      if (parentTag === 'pre') return ''; // pre handles the whole block
      const t = el.text.trim();
      return t ? `\`${t}\`` : '';
    }
    case 'li': return `- ${convertChildren(el).trim()}\n`;
    case 'ul':
    case 'ol': return `\n${convertChildren(el)}\n`;
    case 'blockquote': {
      const t = convertChildren(el).trim();
      return t ? t.split('\n').map(l => `> ${l}`).join('\n') + '\n\n' : '';
    }
    default: return convertChildren(el);
  }
}

function convertChildren(el: NHElement): string {
  return el.childNodes
    .map(child => {
      // nodeType 3 = text node; .text decodes HTML entities automatically
      if (child.nodeType === 3) return child.text;
      return convertElement(child as NHElement);
    })
    .join('');
}

function isSkipLink(href: string, label: string): boolean {
  if (/^#/.test(href)) return true;
  if (/^skip\s+to|^skip\s+nav/i.test(label)) return true;
  return false;
}

interface NavLink { label: string; href: string }

function extractNavLinks(root: NHElement): NavLink[] {
  const links: NavLink[] = [];
  const seen = new Set<string>();

  for (const nav of root.querySelectorAll('nav')) {
    for (const a of nav.querySelectorAll('a')) {
      const href = a.getAttribute('href') ?? '';
      const label = a.text.trim();
      if (!label || !href) continue;
      if (isSkipLink(href, label)) continue;
      if (seen.has(href)) continue;
      seen.add(href);
      links.push({ label, href });
    }
  }

  return links;
}
