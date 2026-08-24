import sanitizeHtml from "sanitize-html";

export function sanitizeCampaignBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3",
      "ul", "ol", "li", "blockquote", "a", "img",
      "table", "thead", "tbody", "tr", "th", "td", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      span: ["style"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "data"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
  });
}
