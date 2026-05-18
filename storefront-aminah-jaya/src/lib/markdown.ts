export function parseMarkdown(md: string): string {
  if (!md) return "";
  
  // 1. Escape HTML entities to prevent XSS
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Horizontal Rules (--- or ***)
  html = html.replace(/^\s*([-*_])\1\1+\s*$/gm, "<hr />");

  // 3. Blockquotes (&gt; text)
  html = html.replace(/^\s*&gt;\s*(.*?)$/gm, "<blockquote>$1</blockquote>");
  // Merge consecutive blockquote tags
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, "<br />");

  // 4. Unordered Lists (- item or * item)
  // Matching * or - at start of lines for list items
  html = html.replace(/^\s*[\*\-]\s+(.*?)$/gm, "<li>$1</li>");

  // 5. Ordered Lists (1. item)
  html = html.replace(/^\s*(\d+)\.\s+(.*?)$/gm, "<li class='ordered'>$2</li>");

  // 6. Wrap consecutive list items in <ul> and <ol>
  html = html.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  html = html.replace(/(<li class='ordered'>.*?<\/li>)/gs, "<ol>$1</ol>");
  html = html.replace(/<\/ol>\s*<ol>/g, "");
  html = html.replace(/ class='ordered'/g, "");

  // 7. Inline Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // 8. Inline Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // 9. Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--green-700); font-weight: 700; text-decoration: underline;">$1</a>');

  // 10. Headings (# Heading, ## Heading, etc.)
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

  // 11. Line breaks & paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      // If it already starts with a block tag, don't wrap in <p>
      if (/^<(h1|h2|h3|ul|ol|blockquote|hr)/i.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("");

  return html;
}
