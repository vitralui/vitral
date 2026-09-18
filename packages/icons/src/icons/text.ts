// Text & formatting: the editor toolbar.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'text';

export const bold: IconDef = { name: 'bold', category, tags: ['strong', 'weight', 'format'], body: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>' };
export const italic: IconDef = { name: 'italic', category, tags: ['emphasis', 'slant', 'format'], body: '<path d="M10 4h9M5 20h9M15 4L9 20"/>' };
export const underline: IconDef = { name: 'underline', category, tags: ['format', 'text decoration'], body: '<path d="M7 4v6a5 5 0 0 0 10 0V4M5 20h14"/>' };
export const strikethrough: IconDef = { name: 'strikethrough', category, tags: ['delete', 'cross out', 'format'], body: '<path d="M16 6.5C15.3 5 13.8 4 12 4 9.8 4 8 5.3 8 7.5c0 1.8 1.2 3 3.5 3.8M4 12h16M15.5 14.5c.4.6.5 1.2.5 1.8 0 2.2-1.8 3.7-4.2 3.7-2 0-3.6-1-4.3-2.5"/>' };
export const heading: IconDef = { name: 'heading', category, tags: ['title', 'h', 'header'], body: '<path d="M6 4v16M18 4v16M6 12h12"/>' };
export const heading1: IconDef = { name: 'heading1', category, tags: ['title', 'h1'], body: '<path d="M4 5v14M13 5v14M4 12h9M17 11.5l2.5-1.5V19"/>' };
export const heading2: IconDef = { name: 'heading2', category, tags: ['subtitle', 'h2'], body: '<path d="M4 5v14M12 5v14M4 12h8M16 12.5a2.5 2.5 0 1 1 4.3 1.7L16 19h5"/>' };
export const heading3: IconDef = { name: 'heading3', category, tags: ['section', 'h3'], body: '<path d="M4 5v14M12 5v14M4 12h8M16 10h4.5l-2.5 3.5a2.5 2.5 0 1 1-2 4.2"/>' };
export const alignLeft: IconDef = { name: 'alignLeft', category, tags: ['text', 'paragraph', 'start'], body: '<path d="M3 4.5h18M3 9.5h11M3 14.5h18M3 19.5h11"/>' };
export const alignCenter: IconDef = { name: 'alignCenter', category, tags: ['text', 'paragraph', 'middle'], body: '<path d="M3 4.5h18M6.5 9.5h11M3 14.5h18M6.5 19.5h11"/>' };
export const alignRight: IconDef = { name: 'alignRight', category, tags: ['text', 'paragraph', 'end'], body: '<path d="M3 4.5h18M10 9.5h11M3 14.5h18M10 19.5h11"/>' };
export const alignJustify: IconDef = { name: 'alignJustify', category, tags: ['text', 'paragraph', 'block'], body: '<path d="M3 4.5h18M3 9.5h18M3 14.5h18M3 19.5h18"/>' };
export const listOrdered: IconDef = { name: 'listOrdered', category, tags: ['numbered list', 'steps'], body: '<path d="M10 5h11M10 9h7M10 15h11M10 19h7M4 5l2-1.5V10M3.5 15.5a1.8 1.8 0 1 1 3 1.4L3.5 20.5H7"/>' };
export const indent: IconDef = { name: 'indent', category, tags: ['increase indent', 'tab'], body: '<path d="M3 5h18M11 10h10M11 14h10M3 19h18M3 9l3 3-3 3"/>' };
export const outdent: IconDef = { name: 'outdent', category, tags: ['decrease indent'], body: '<path d="M3 5h18M11 10h10M11 14h10M3 19h18M7 9l-3 3 3 3"/>' };
export const quote: IconDef = { name: 'quote', category, tags: ['blockquote', 'citation'], body: '<path d="M5 11h5v6a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2zM5 11c0-3 1-5 4-6"/><path d="M14 11h5v6a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2zM14 11c0-3 1-5 4-6"/>' };
export const type: IconDef = { name: 'type', category, tags: ['text', 'font', 'letter t'], body: '<path d="M4 7V4h16v3M12 4v16M9 20h6"/>' };
export const textCursor: IconDef = { name: 'textCursor', category, tags: ['caret', 'input', 'i-beam'], body: '<path d="M9 4h1.5A1.5 1.5 0 0 1 12 5.5v13a1.5 1.5 0 0 1-1.5 1.5H9M15 4h-1.5A1.5 1.5 0 0 0 12 5.5M15 20h-1.5a1.5 1.5 0 0 1-1.5-1.5M9.5 12h5"/>' };
export const fontSize: IconDef = { name: 'fontSize', category, tags: ['text size', 'letters', 'case'], body: '<path d="M2.5 19l5-13 5 13M4.4 14.5h6.2M20.5 13v6"/><circle cx="17.5" cy="16" r="3"/>' };
export const subscript: IconDef = { name: 'subscript', category, tags: ['chemistry', 'formula', 'lower'], body: '<path d="M4 6l8 10M12 6L4 16M16.5 16.5a1.8 1.8 0 1 1 3 1.4L16.5 21.5H20"/>' };
export const superscript: IconDef = { name: 'superscript', category, tags: ['exponent', 'power', 'upper'], body: '<path d="M4 8l8 10M12 8L4 18M16.5 4.5a1.8 1.8 0 1 1 3 1.4L16.5 9.5H20"/>' };
export const highlighter: IconDef = { name: 'highlighter', category, tags: ['marker', 'highlight'], body: '<path d="M13.5 4.5a2.1 2.1 0 0 1 3 0l3 3a2.1 2.1 0 0 1 0 3L12 18l-6-6zM6 12l-2.5 2.5 1 1L2.5 18h4l1-1 1 1L12 18M13 21h8"/>' };
export const eraser: IconDef = { name: 'eraser', category, tags: ['rubber', 'clear', 'delete'], body: '<path d="M7 21l-3.5-3.5a2 2 0 0 1 0-2.8L13.7 4.5a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L11 21zM7 21h14M8.5 9.7l6.3 6.3"/>' };
export const pilcrow: IconDef = { name: 'pilcrow', category, tags: ['paragraph', 'mark'], body: '<path d="M13 4v16M17 4v16M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>' };
export const hash: IconDef = { name: 'hash', category, tags: ['number', 'hashtag', 'pound', 'channel'], body: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>' };
export const languages: IconDef = { name: 'languages', category, tags: ['translate', 'language', 'i18n'], body: '<path d="M3 5h9M7.5 3v2M10.5 5c-.8 3.8-3 6.8-6.5 8.5M5.5 9c1 2 2.6 3.5 5 4.5M12 21l4.5-10 4.5 10M13.5 18h6"/>' };
export const spellCheck: IconDef = { name: 'spellCheck', category, tags: ['spelling', 'proofread', 'grammar'], body: '<path d="M3 14l3.5-9 3.5 9M4.2 11h4.6M11 17l3 3 7-7"/>' };
export const wrapText: IconDef = { name: 'wrapText', category, tags: ['line wrap', 'flow'], body: '<path d="M3 6h18M3 12h15a3 3 0 0 1 0 6h-5M15 16l-2 2 2 2M3 18h6"/>' };
export const clearFormatting: IconDef = { name: 'clearFormatting', category, tags: ['remove style', 'plain text'], body: '<path d="M4 7V4h14v3M9 20h4M11 4L9 20M15 14l5 5M20 14l-5 5"/>' };
export const typeface: IconDef = { name: 'typeface', category, tags: ['font', 'letter a', 'serif'], body: '<path d="M5 20l7-16 7 16M7.6 14h8.8M3 20h4M17 20h4"/>' };
export const signature: IconDef = { name: 'signature', category, tags: ['sign', 'autograph', 'handwriting'], body: '<path d="M3 17c3-1 5-6 5-9 0-2-1-3-2-3-2 0-3 3-3 6 0 5 4 8 7 8 2.5 0 3-2.5 4-4 1 1.5 2 3 3.5 3 1 0 1.5-.5 2.5-1.5M3 21h18"/>' };
export const letterSpacing: IconDef = { name: 'letterSpacing', category, tags: ['tracking', 'kerning'], body: '<path d="M5 13l4-10 4 10M6.2 10h5.6M16 3v10M3 18h18M6 15l-3 3 3 3M18 15l3 3-3 3"/>' };
export const codeBlock: IconDef = { name: 'codeBlock', category, tags: ['code block', 'snippet', 'pre', 'source'], body: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M10 9l-3 3 3 3M14 9l3 3-3 3"/>' };
export const horizontalRule: IconDef = { name: 'horizontalRule', category, tags: ['divider', 'separator', 'line', 'hr'], body: '<path d="M3 12h18M5 6h9M5 18h6"/>' };
export const textColor: IconDef = { name: 'textColor', category, tags: ['font color', 'colour', 'letter a', 'foreground'], body: '<path d="M6.5 15.5L12 4l5.5 11.5M8.4 11.5h7.2M4 20h16"/>' };
