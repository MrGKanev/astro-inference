import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from './markdown-renderer.js';

describe('htmlToMarkdown', () => {
  it('strips <head> content', () => {
    const result = htmlToMarkdown('<head><title>Test</title></head><body><p>Hello</p></body>');
    expect(result).not.toContain('Test');
    expect(result).toContain('Hello');
  });

  it('converts headings', () => {
    const result = htmlToMarkdown('<h1>Title</h1><h2>Subtitle</h2>');
    expect(result).toContain('# Title');
    expect(result).toContain('## Subtitle');
  });

  it('converts links', () => {
    const result = htmlToMarkdown('<a href="/about">About</a>');
    expect(result).toContain('[About](/about)');
  });

  it('skips fragment-only links', () => {
    const result = htmlToMarkdown('<a href="#main">Skip to main</a>');
    expect(result).not.toContain('[Skip to main]');
  });

  it('skips skip-nav links', () => {
    const result = htmlToMarkdown('<a href="/main">Skip to navigation</a>');
    expect(result).not.toContain('[Skip to navigation]');
  });

  it('converts images to alt text', () => {
    const result = htmlToMarkdown('<img src="/img.png" alt="A cat">');
    expect(result).toContain('[Image: A cat]');
  });

  it('removes images without alt text', () => {
    const result = htmlToMarkdown('<img src="/img.png" alt="">');
    expect(result).not.toContain('[Image:');
  });

  it('strips <nav>, <footer>, <aside>, <header>', () => {
    const html = '<nav><a href="/">Home</a></nav><main><p>Content</p></main><footer>Footer</footer>';
    const result = htmlToMarkdown(html);
    expect(result).not.toContain('Footer');
    expect(result).toContain('Content');
  });

  it('appends nav links as Navigation section', () => {
    const html = '<nav><a href="/">Home</a><a href="/about">About</a></nav><p>Body</p>';
    const result = htmlToMarkdown(html);
    expect(result).toContain('## Navigation');
    expect(result).toContain('[Home](/)');
    expect(result).toContain('[About](/about)');
  });

  it('deduplicates nav links', () => {
    const html = '<nav><a href="/about">About</a></nav><nav><a href="/about">About</a></nav>';
    const result = htmlToMarkdown(html);
    const count = (result.match(/\[About\]/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('converts bold and italic', () => {
    const result = htmlToMarkdown('<strong>Bold</strong> and <em>italic</em>');
    expect(result).toContain('**Bold**');
    expect(result).toContain('_italic_');
  });

  it('converts unordered lists', () => {
    const result = htmlToMarkdown('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(result).toContain('- Item 1');
    expect(result).toContain('- Item 2');
  });

  it('converts inline code', () => {
    const result = htmlToMarkdown('<code>console.log()</code>');
    expect(result).toContain('`console.log()`');
  });

  it('converts code blocks', () => {
    const result = htmlToMarkdown('<pre><code>const x = 1;</code></pre>');
    expect(result).toContain('```');
  });

  it('decodes HTML entities', () => {
    const result = htmlToMarkdown('<p>Fish &amp; Chips &mdash; great</p>');
    expect(result).toContain('Fish & Chips');
    // node-html-parser decodes &mdash; to the correct Unicode em dash
    expect(result).toContain('—');
  });

  it('collapses excess whitespace', () => {
    const result = htmlToMarkdown('<p>Hello</p>\n\n\n\n<p>World</p>');
    expect(result).not.toMatch(/\n{3,}/);
  });

  it('handles empty input', () => {
    expect(htmlToMarkdown('')).toBe('');
  });

  it('handles plain text with no HTML', () => {
    const result = htmlToMarkdown('Just plain text');
    expect(result).toBe('Just plain text');
  });
});
