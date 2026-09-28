import { describe, expect, it } from 'vitest';
import { parseChatInline, parseChatMarkdown, safeChatHref } from './markdown';

describe("a chat answer's Markdown", () => {
    it('reads bold, italic, code and links, and leaves snake_case alone', () => {
        expect(parseChatInline('a **b** _c_ `d` [e](https://x.io) snake_case_name')).toEqual([
            { type: 'text', text: 'a ' },
            { type: 'strong', children: [{ type: 'text', text: 'b' }] },
            { type: 'text', text: ' ' },
            { type: 'em', children: [{ type: 'text', text: 'c' }] },
            { type: 'text', text: ' ' },
            { type: 'code', text: 'd' },
            { type: 'text', text: ' ' },
            { type: 'link', href: 'https://x.io', children: [{ type: 'text', text: 'e' }] },
            { type: 'text', text: ' snake_case_name' }
        ]);
    });

    it('never links to a script, and links a bare address', () => {
        expect(safeChatHref('javascript:alert(1)')).toBeNull();
        expect(parseChatInline('[x](javascript:alert(1))')[0]).toEqual({ type: 'text', text: 'x' });
        expect(parseChatInline('see https://vitral.dev.')).toEqual([
            { type: 'text', text: 'see ' },
            { type: 'link', href: 'https://vitral.dev', children: [{ type: 'text', text: 'https://vitral.dev' }] },
            { type: 'text', text: '.' }
        ]);
    });

    it('reads headings, lists, quotes, fences and paragraphs', () => {
        const blocks = parseChatMarkdown('## Steps\n\n1. Install\n2. Run\n\n- a\n- b\n\n> quoted\n\n```ts\nconst x = 1;\n```\nlast line\nsame paragraph');
        expect(blocks.map((b) => b.type)).toEqual(['heading', 'list', 'list', 'quote', 'code', 'paragraph']);
        expect(blocks[1]).toMatchObject({ ordered: true, start: 1, items: [[{ type: 'text', text: 'Install' }], [{ type: 'text', text: 'Run' }]] });
        expect(blocks[4]).toEqual({ type: 'code', language: 'ts', text: 'const x = 1;' });
        expect((blocks[5] as { children: unknown[] }).children).toContainEqual({ type: 'br' });
    });

    it('reads a message still arriving as it stands', () => {
        expect(parseChatMarkdown('```js\nlet a')).toEqual([{ type: 'code', language: 'js', text: 'let a' }]);
        expect(parseChatInline('**not yet')).toEqual([{ type: 'text', text: '**not yet' }]);
    });
});
