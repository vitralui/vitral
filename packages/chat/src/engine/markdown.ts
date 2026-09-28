/**
 * The Markdown a chat answer is usually written in, read into a small tree a
 * renderer draws as elements — never as HTML, so nothing in a message can run
 * or restyle the page. It reads what answers use: paragraphs and line
 * breaks, headings, lists, quotes, fenced code, bold, italic, inline code and
 * links. What it does not recognise stays text. A message still arriving is
 * read as it stands: an unclosed fence is a code block so far, an unclosed
 * `**` is just stars.
 */

export type ChatInline =
    | { type: 'text'; text: string }
    | { type: 'strong' | 'em'; children: ChatInline[] }
    | { type: 'code'; text: string }
    | { type: 'link'; href: string; children: ChatInline[] }
    | { type: 'br' };

export type ChatBlock =
    | { type: 'paragraph'; children: ChatInline[] }
    | { type: 'heading'; level: number; children: ChatInline[] }
    | { type: 'code'; language: string | null; text: string }
    | { type: 'quote'; children: ChatBlock[] }
    | { type: 'list'; ordered: boolean; start: number; items: ChatInline[][] };

/** Only addresses that go somewhere a reader expects: the web and mail. */
export function safeChatHref(href: string): string | null {
    const trimmed = href.trim();
    return /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : null;
}

export function parseChatInline(text: string): ChatInline[] {
    const out: ChatInline[] = [];
    let buffer = '';
    const flush = () => {
        if (buffer) out.push({ type: 'text', text: buffer });
        buffer = '';
    };
    let i = 0;
    while (i < text.length) {
        const rest = text.slice(i);
        if (rest[0] === '\\' && rest.length > 1 && /[\\`*_[\]()#>-]/.test(rest[1]!)) {
            buffer += rest[1];
            i += 2;
            continue;
        }
        if (rest[0] === '\n') {
            flush();
            out.push({ type: 'br' });
            i++;
            continue;
        }
        const code = /^`([^`\n]+)`/.exec(rest);
        if (code) {
            flush();
            out.push({ type: 'code', text: code[1]! });
            i += code[0].length;
            continue;
        }
        const strong = /^(\*\*|__)(?=\S)([\s\S]*?\S)\1/.exec(rest);
        if (strong) {
            flush();
            out.push({ type: 'strong', children: parseChatInline(strong[2]!) });
            i += strong[0].length;
            continue;
        }
        const em = /^(\*|_)(?=\S)([^*_\n]*?\S)\1(?![\w*])/.exec(rest);
        // An underscore inside a word (snake_case) is not emphasis.
        if (em && !(em[1] === '_' && /\w/.test(text[i - 1] ?? ''))) {
            flush();
            out.push({ type: 'em', children: parseChatInline(em[2]!) });
            i += em[0].length;
            continue;
        }
        const link = /^\[([^\]\n]+)\]\(([^)\s]+)\)/.exec(rest);
        if (link) {
            const href = safeChatHref(link[2]!);
            flush();
            if (href) out.push({ type: 'link', href, children: parseChatInline(link[1]!) });
            else out.push({ type: 'text', text: link[1]! });
            i += link[0].length;
            continue;
        }
        const bare = /^https?:\/\/[^\s<>)]+[^\s<>).,;:!?'"]/.exec(rest);
        if (bare && !/\w/.test(text[i - 1] ?? '')) {
            flush();
            out.push({ type: 'link', href: bare[0], children: [{ type: 'text', text: bare[0] }] });
            i += bare[0].length;
            continue;
        }
        buffer += rest[0];
        i++;
    }
    flush();
    return out;
}

export function parseChatMarkdown(source: string): ChatBlock[] {
    const lines = source.replace(/\r\n?/g, '\n').split('\n');
    const blocks: ChatBlock[] = [];
    let paragraph: string[] = [];
    const endParagraph = () => {
        if (paragraph.length) blocks.push({ type: 'paragraph', children: parseChatInline(paragraph.join('\n')) });
        paragraph = [];
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const fence = /^\s*(```|~~~)\s*([\w+#.-]*)\s*$/.exec(line);
        if (fence) {
            endParagraph();
            const body: string[] = [];
            let j = i + 1;
            while (j < lines.length && !new RegExp(`^\\s*${fence[1]}\\s*$`).test(lines[j]!)) body.push(lines[j++]!);
            blocks.push({ type: 'code', language: fence[2] || null, text: body.join('\n') });
            i = j;
            continue;
        }
        if (!line.trim()) {
            endParagraph();
            continue;
        }
        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
            endParagraph();
            blocks.push({ type: 'heading', level: heading[1]!.length, children: parseChatInline(heading[2]!.replace(/\s+#+\s*$/, '')) });
            continue;
        }
        if (/^\s*>/.test(line)) {
            endParagraph();
            const quoted: string[] = [];
            while (i < lines.length && /^\s*>/.test(lines[i]!)) quoted.push(lines[i++]!.replace(/^\s*>\s?/, ''));
            i--;
            blocks.push({ type: 'quote', children: parseChatMarkdown(quoted.join('\n')) });
            continue;
        }
        const item = /^\s*([-*+]|(\d{1,9})[.)])\s+(.*)$/.exec(line);
        if (item) {
            endParagraph();
            const ordered = !!item[2];
            const start = ordered ? Number(item[2]) : 1;
            const items: ChatInline[][] = [];
            while (i < lines.length) {
                const m = /^\s*([-*+]|(\d{1,9})[.)])\s+(.*)$/.exec(lines[i]!);
                if (!m || !!m[2] !== ordered) break;
                items.push(parseChatInline(m[3]!));
                i++;
            }
            i--;
            blocks.push({ type: 'list', ordered, start, items });
            continue;
        }
        paragraph.push(line);
    }
    endParagraph();
    return blocks;
}
