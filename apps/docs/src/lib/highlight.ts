/**
 * A small highlighter. Shiki and friends would each cost more than the whole
 * site bundle, and what the code blocks here hold is narrow: Vue templates,
 * TypeScript and shell lines. So this tokenises those three by hand and hands
 * back HTML with the token classes `site.css` colours.
 */
type Lang = 'vue' | 'ts' | 'bash' | 'css';

const KEYWORDS =
    /\b(import|from|export|default|const|let|var|function|return|await|async|new|type|interface|extends|implements|class|if|else|for|of|in|while|switch|case|break|continue|try|catch|finally|throw|typeof|as|satisfies|true|false|null|undefined|this)\b/g;

function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Tokens are found in one pass over the escaped source, so a keyword inside a
 * string or a comment is never re-marked: whatever matches first wins the span,
 * and the scan resumes after it.
 */
function tokenise(source: string, patterns: { re: RegExp; cls: string }[]) {
    const text = escapeHtml(source);
    const marks: { start: number; end: number; cls: string }[] = [];

    for (const { re, cls } of patterns) {
        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(text))) {
            // A pattern may capture the token inside a wider match: `// …`
            // has to see what precedes it to know it is not part of a URL.
            const token = match[1] ?? match[0];
            const start = match.index + match[0].indexOf(token);
            const end = start + token.length;
            if (!marks.some((m) => start < m.end && end > m.start)) marks.push({ start, end, cls });
            if (match.index === re.lastIndex) re.lastIndex++;
        }
    }

    marks.sort((a, b) => a.start - b.start);

    let out = '';
    let cursor = 0;
    for (const mark of marks) {
        if (mark.start < cursor) continue;
        out += text.slice(cursor, mark.start) + `<span class="${mark.cls}">` + text.slice(mark.start, mark.end) + '</span>';
        cursor = mark.end;
    }
    return out + text.slice(cursor);
}

const commonPatterns = [
    { re: /\/\*[\s\S]*?\*\//g, cls: 'tok-comment' },
    { re: /(?:^|[^:])(\/\/[^\n]*)/gm, cls: 'tok-comment' },
    { re: /'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, cls: 'tok-string' }
];

const rules: Record<Lang, { re: RegExp; cls: string }[]> = {
    ts: [...commonPatterns, { re: KEYWORDS, cls: 'tok-keyword' }, { re: /\b\d+(\.\d+)?\b/g, cls: 'tok-number' }],
    css: [...commonPatterns, { re: /--[\w-]+/g, cls: 'tok-attr' }, { re: /[.#][\w-]+/g, cls: 'tok-tag' }],
    bash: [{ re: /#[^\n]*/g, cls: 'tok-comment' }, { re: /^\s*(pnpm|npm|yarn|bun|npx)\b/gm, cls: 'tok-keyword' }],
    vue: [
        { re: /&lt;!--[\s\S]*?--&gt;/g, cls: 'tok-comment' },
        { re: /\/\*[\s\S]*?\*\//g, cls: 'tok-comment' },
        { re: /(?:^|[^:])(\/\/[^\n]*)/gm, cls: 'tok-comment' },
        { re: /'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, cls: 'tok-string' },
        { re: /&lt;\/?[\w.-]+/g, cls: 'tok-tag' },
        { re: /[\s(]([@:#]?[\w.-]+)=/g, cls: 'tok-attr' },
        { re: /\bv-[\w-]+/g, cls: 'tok-attr' },
        { re: KEYWORDS, cls: 'tok-keyword' }
    ]
};

export function highlight(source: string, lang: Lang = 'vue') {
    return tokenise(source, rules[lang] ?? rules.vue);
}

export function langOf(label: string): Lang {
    if (/\.ts$|typescript|^ts$/i.test(label)) return 'ts';
    if (/terminal|bash|sh$/i.test(label)) return 'bash';
    if (/\.css$|^css$/i.test(label)) return 'css';
    return 'vue';
}
