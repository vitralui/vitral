import { describe, expect, it } from 'vitest';
import { parseEditorHTML, textToEditorDoc, toEditorHTML } from './html';
import { editorDocFromJSON, editorDocToJSON } from './json';
import { editorNodes as n } from './model';
import { editorPalette, matchPaletteColor, sanitizeLanguage, sanitizeUrl } from './sanitize';
import { countCharacters, countWords, toEditorMarkdown, toEditorText } from './text';

const roundTrip = (html: string) => toEditorHTML(parseEditorHTML(html));
const clean = (html: string) => toEditorHTML(parseEditorHTML(html));

describe('editor HTML', () => {
    it.each([
        '<p>Plain <strong>bold</strong> <em>italic</em> <u>under</u> <s>strike</s> <code>code</code></p>',
        '<h1>One</h1><h2>Two</h2><h3>Three</h3>',
        '<p><a href="https://example.com" rel="noopener noreferrer nofollow">link</a> and <a href="/local" target="_blank" rel="noopener noreferrer nofollow">new tab</a></p>',
        '<p><strong>bold <em>both</em></strong><em> italic</em></p>',
        '<p>line<br>break</p>',
        '<p><span data-color="red" style="color: var(--vt-editor-palette-red-color, #dc2626)">red</span> <mark data-color="yellow" style="background-color: var(--vt-editor-palette-yellow-highlight, #fef08a)">marked</mark></p>',
        '<ul><li><p>one</p><ul><li><p>nested</p></li></ul></li><li><p>two</p></li></ul>',
        '<ol start="3"><li><p>three</p></li></ol>',
        '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" disabled checked></label><div><p>done</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox" disabled></label><div><p>to do</p></div></li></ul>',
        '<blockquote><p>quoted</p><ul><li><p>list in quote</p></li></ul></blockquote>',
        '<pre><code class="language-ts">const a = 1;\n\n  indented &lt;tag&gt;</code></pre>',
        '<p>before</p><hr><p>after</p>',
        '<img src="https://example.com/cat.png" alt="A cat" title="Cat"><p></p>',
        '<table><tbody><tr><th><p>Name</p></th><th><p>Age</p></th></tr><tr><td><p>Ann</p></td><td><p>31</p></td></tr></tbody></table><p></p>',
        '<p>two &nbsp;spaces &nbsp;and&nbsp;</p><p>&nbsp;lead</p>',
        '<p>&amp; &lt;not a tag&gt; "quotes"</p>',
        '<p></p><p>after an empty paragraph</p>'
    ])('round-trips %s', (html) => {
        expect(roundTrip(html)).toBe(html);
    });

    it('writes an empty document as an empty string, and reads one back', () => {
        expect(toEditorHTML(n.doc(n.p()))).toBe('');
        expect(parseEditorHTML('').content).toEqual([n.p()]);
        expect(roundTrip('<p></p>')).toBe('');
    });

    it('keeps typed spaces', () => {
        const doc = n.doc(n.p('  a  b  '));
        expect(parseEditorHTML(toEditorHTML(doc))).toEqual(doc);
    });

    it('reads loose HTML into blocks', () => {
        expect(clean('just text')).toBe('<p>just text</p>');
        expect(clean('<div>one</div><div>two<br></div>')).toBe('<p>one</p><p>two<br></p>');
        expect(clean('text <div>block</div> more')).toBe('<p>text</p><p>block</p><p>more</p>');
        expect(clean('<h5>small heading</h5>')).toBe('<h3>small heading</h3>');
        expect(clean('<b>bold</b> <i>it</i> <strike>gone</strike> <del>x</del> <ins>y</ins> <kbd>k</kbd>')).toBe('<p><strong>bold</strong> <em>it</em> <s>gone</s> <s>x</s> <u>y</u> <code>k</code></p>');
        expect(clean('<ul><li>no paragraph</li></ul>')).toBe('<ul><li><p>no paragraph</p></li></ul>');
        expect(clean('<ul><li>a</li><ul><li>b</li></ul></ul>')).toBe('<ul><li><p>a</p><ul><li><p>b</p></li></ul></li></ul>');
        expect(clean('<li>stray</li>')).toBe('<ul><li><p>stray</p></li></ul>');
        expect(clean('<pre>line 1<br>line 2</pre>')).toBe('<pre><code>line 1\nline 2</code></pre>');
        expect(clean('<pre data-language="rust"><code>fn</code></pre>')).toBe('<pre><code class="language-rust">fn</code></pre>');
        expect(clean('<table><tr><td colspan="2">wide</td></tr><tr><td>a</td><td>b</td></tr></table>')).toBe(
            '<table><tbody><tr><td><p>wide</p></td><td><p></p></td></tr><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table><p></p>'
        );
        expect(clean('<ul><li class="task-list-item"><input type="checkbox" checked> GitHub task</li></ul>')).toContain('data-checked="true"');
    });

    it('reads styles as marks: weight, style, decoration and palette colours', () => {
        expect(clean('<span style="font-weight: 700">b</span><span style="font-style:italic">i</span><span style="text-decoration: underline line-through">u</span>')).toBe(
            '<p><strong>b</strong><em>i</em><u><s>u</s></u></p>'
        );
        expect(clean('<strong><span style="font-weight: normal">not bold</span></strong>')).toBe('<p>not bold</p>');
        expect(clean('<span style="color: rgb(220, 38, 38)">red</span>')).toBe('<p><span data-color="red" style="color: var(--vt-editor-palette-red-color, #dc2626)">red</span></p>');
        expect(clean('<font color="#0000ff">blue</font>')).toContain('data-color="blue"');
        expect(clean('<span style="background-color: #ffff00">hi</span>')).toContain('<mark data-color="yellow"');
        expect(clean('<mark>plain mark</mark>')).toContain('<mark data-color="yellow"');
    });

    it('reads plain text as paragraphs', () => {
        expect(toEditorHTML(textToEditorDoc('one\r\n\r\ntwo\nthree <b>'))).toBe('<p>one</p><p>two</p><p>three &lt;b&gt;</p>');
    });

    it('reads without a DOM as text', () => {
        const doc = parseEditorHTML('<p>a &amp; b</p><script>x</script>', { domParser: undefined });
        expect(toEditorText(doc)).toContain('a & b');
    });
});

describe('editor sanitiser', () => {
    const xss = [
        '<script>alert(1)</script><p>ok</p>',
        '<img src=x onerror="alert(1)"><p>ok</p>',
        '<p onclick="alert(1)" style="position:fixed" class="evil" id="x">ok</p>',
        '<a href="javascript:alert(1)">ok</a>',
        '<a href="JaVaScRiPt:alert(1)">ok</a>',
        '<a href=" javascript:alert(1)">ok</a>',
        '<a href="java&#x09;script:alert(1)">ok</a>',
        '<a href="&#106;avascript:alert(1)">ok</a>',
        '<a href="vbscript:msgbox(1)">ok</a>',
        '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">ok</a>',
        '<iframe src="javascript:alert(1)"></iframe><p>ok</p>',
        '<svg onload="alert(1)"><script>alert(1)</script></svg><p>ok</p>',
        '<math><mi xlink:href="javascript:alert(1)">x</mi></math><p>ok</p>',
        '<object data="javascript:alert(1)"></object><embed src="x.swf"><p>ok</p>',
        '<style>body{display:none}</style><p>ok</p>',
        '<form action="javascript:alert(1)"><button>go</button></form><p>ok</p>',
        '<p>ok<input onfocus="alert(1)" autofocus></p>',
        '<details open ontoggle="alert(1)"><summary>ok</summary></details>',
        '<img src="javascript:alert(1)" alt="x"><p>ok</p>',
        '<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" alt="x"><p>ok</p>',
        '<p style="background:url(javascript:alert(1))">ok</p>',
        '<span style="color: expression(alert(1))">ok</span>',
        '<noscript><p title="</noscript><img src=x onerror=alert(1)>">ok</p></noscript>',
        '<template><img src=x onerror=alert(1)></template><p>ok</p>',
        '<p>ok</p><meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
        '<pre><code class="language-x&quot; onmouseover=&quot;alert(1)">ok</code></pre>',
        '<a href="https://ok.example" onmouseover="alert(1)" style="color:red">ok</a>'
    ];

    it.each(xss)('neutralises %s', (payload) => {
        const out = clean(payload);
        expect(out).not.toMatch(/<script|<iframe|<svg|<math|<object|<embed|<style|<form|<input(?! type="checkbox" disabled)|<meta|<template|<noscript/i);
        expect(out).not.toMatch(/\son\w+=/i);
        expect(out).not.toMatch(/javascript:|vbscript:|data:text|data:image\/svg/i);
        expect(out).not.toMatch(/expression\(|url\(/i);
        expect(out).not.toMatch(/\s(class|id)="(?!language-)/);
        expect(out).toContain('ok');
        // What survives is exactly what the serialiser writes, so a second pass changes nothing.
        expect(clean(out)).toBe(out);
    });

    it('keeps safe links and images', () => {
        expect(clean('<a href="mailto:a@b.c">mail</a> <a href="tel:+1">call</a> <a href="#top">top</a>')).toBe(
            '<p><a href="mailto:a@b.c" rel="noopener noreferrer nofollow">mail</a> <a href="tel:+1" rel="noopener noreferrer nofollow">call</a> <a href="#top" rel="noopener noreferrer nofollow">top</a></p>'
        );
        expect(clean('<img src="data:image/png;base64,iVBORw0KGgo=" alt="dot">')).toContain('src="data:image/png;base64,iVBORw0KGgo="');
        expect(clean('<img src="file:///C:/Users/me/image001.png">')).toBe('');
    });

    it('checks URLs, colours and languages', () => {
        expect(sanitizeUrl('https://a.b/c?d#e')).toBe('https://a.b/c?d#e');
        expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
        expect(sanitizeUrl('page.html?x=a:b')).toBe('page.html?x=a:b');
        expect(sanitizeUrl('\u0000javascript:alert(1)')).toBeNull();
        expect(sanitizeUrl('java\nscript:alert(1)')).toBeNull();
        expect(sanitizeUrl('ftp://files')).toBeNull();
        expect(sanitizeUrl('')).toBeNull();
        expect(sanitizeUrl(42)).toBeNull();
        expect(sanitizeUrl('https://a.b/x.png', 'image')).toBe('https://a.b/x.png');
        expect(sanitizeUrl('mailto:a@b.c', 'image')).toBeNull();
        expect(matchPaletteColor('#000000', 'color')).toBeNull();
        expect(matchPaletteColor('rgb(255, 255, 255)', 'highlight')).toBeNull();
        expect(matchPaletteColor('rgba(255, 0, 0, 0.1)', 'color')).toBeNull();
        expect(matchPaletteColor('#e91e63', 'color')).toBe('pink');
        expect(matchPaletteColor('#dc2626', 'color')).toBe('red');
        expect(matchPaletteColor('purple', 'color')).toBe('purple');
        expect(matchPaletteColor('url(x)', 'color')).toBeNull();
        expect(sanitizeLanguage('C++')).toBe('c++');
        expect(sanitizeLanguage('a b')).toBeNull();
        expect(editorPalette.map((c) => c.name)).toContain('yellow');
    });

    it('cleans a Google Docs clipboard', () => {
        const docs =
            '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1234"><h1 dir="ltr" style="line-height:1.38;margin-top:20pt"><span style="font-size:20pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Heading</span></h1><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:700;">Bold</span><span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:400;"> and </span><span style="font-size:11pt;color:#ff0000;font-weight:400;font-style:italic;">red italic</span></p><br><ul style="margin-top:0;margin-bottom:0;"><li dir="ltr" style="list-style-type:disc;font-size:11pt;" aria-level="1"><p dir="ltr" role="presentation" style="line-height:1.38;"><span style="font-size:11pt;font-weight:400;">Item</span></p></li></ul></b><br class="Apple-interchange-newline">';
        expect(clean(docs)).toBe(
            '<h1>Heading</h1><p><strong>Bold</strong> and <span data-color="red" style="color: var(--vt-editor-palette-red-color, #dc2626)"><em>red italic</em></span></p><p><br></p><ul><li><p>Item</p></li></ul>'
        );
    });

    it('cleans a Word clipboard, rebuilding its lists', () => {
        const word = `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta name=Generator content="Microsoft Word 15"><style><!-- p.MsoNormal {margin:0in;} --></style><!--[if gte mso 9]><xml><o:OfficeDocumentSettings></o:OfficeDocumentSettings></xml><![endif]--></head>
<body lang=EN-US style='tab-interval:.5in'><!--StartFragment-->
<p class=MsoNormal><b><span style='font-family:"Calibri",sans-serif'>Title line<o:p></o:p></span></b></p>
<p class=MsoNormal><o:p>&nbsp;</o:p></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol;mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span><![endif]>First bullet<o:p></o:p></p>
<p class=MsoListParagraphCxSpMiddle style='margin-left:1.0in;mso-list:l0 level2 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>o<span>&nbsp; </span></span><![endif]>Nested bullet<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp; </span></span><![endif]>Second <i>bullet</i><o:p></o:p></p>
<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>1.<span>&nbsp; </span></span><![endif]>Numbered<o:p></o:p></p>
<!--EndFragment--></body></html>`;
        expect(clean(word)).toBe(
            '<p><strong>Title line</strong></p><p></p><ul><li><p>First bullet</p><ul><li><p>Nested bullet</p></li></ul></li><li><p>Second <em>bullet</em></p></li></ul><ol><li><p>Numbered</p></li></ol>'
        );
    });
});

describe('editor JSON', () => {
    it('round-trips a document', () => {
        const doc = parseEditorHTML('<h2>T</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>x</p></li></ul><p><a href="https://a.b">l</a></p>');
        expect(editorDocFromJSON(editorDocToJSON(doc))).toEqual(doc);
        expect(editorDocToJSON(doc)).not.toBe(doc);
    });

    it('drops what it does not know and checks what it keeps', () => {
        const doc = editorDocFromJSON({
            type: 'doc',
            content: [
                { type: 'script', content: [{ type: 'text', text: 'alert(1)' }] },
                {
                    type: 'paragraph',
                    attrs: { onclick: 'x' },
                    content: [
                        { type: 'text', text: 'a', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }, { type: 'bold' }, { type: 'evil' }] },
                        { type: 'text', text: 'b', marks: [{ type: 'color', attrs: { color: 'red; background: url(x)' } }] },
                        { type: 'image', attrs: { src: 'x' } }
                    ]
                },
                { type: 'heading', attrs: { level: 9 }, content: [{ type: 'text', text: 'h' }] },
                { type: 'image', attrs: { src: 'javascript:alert(1)', alt: 'x' } },
                { type: 'orderedList', attrs: { start: -4 }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'i' }] }] }] },
                'nonsense',
                null
            ]
        });
        expect(toEditorHTML(doc)).toBe('<p><strong>a</strong>b</p><h3>h</h3><ol><li><p>i</p></li></ol>');
        expect(toEditorHTML(editorDocFromJSON(null))).toBe('');
        expect(toEditorHTML(editorDocFromJSON({ type: 'paragraph' }))).toBe('');
    });

    it('stops at an absurd depth', () => {
        let deep: Record<string, unknown> = { type: 'paragraph', content: [{ type: 'text', text: 'deep' }] };
        for (let i = 0; i < 500; i++) deep = { type: 'blockquote', content: [deep] };
        expect(() => editorDocFromJSON({ type: 'doc', content: [deep] })).not.toThrow();
    });
});

describe('editor text and Markdown', () => {
    const doc = parseEditorHTML(
        '<h1>Title</h1><p>Some <strong>bold <em>and italic</em></strong>, <s>gone</s>, <code>x*y</code>, <a href="https://a.b/(c)">a link</a> and <u>under</u>.</p>' +
            '<ul><li><p>one</p><ul><li><p>nested</p></li></ul></li></ul><ol start="2"><li><p>two</p></li></ol>' +
            '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>done</p></li></ul>' +
            '<blockquote><p>quote</p><p>more</p></blockquote><pre><code class="language-js">let a = 1;</code></pre><hr>' +
            '<img src="https://a.b/i.png" alt="pic"><table><tr><th>A</th><th>B</th></tr><tr><td>1|2</td><td>3</td></tr></table><p>1. not a list</p><p>line<br>break</p>'
    );

    it('writes Markdown', () => {
        expect(toEditorMarkdown(doc)).toBe(
            [
                '# Title',
                'Some **bold _and italic_**, ~~gone~~, `x*y`, [a link](https://a.b/%28c%29) and <u>under</u>.',
                '- one\n  - nested',
                '2. two',
                '- [x] done',
                '> quote\n>\n> more',
                '```js\nlet a = 1;\n```',
                '---',
                '![pic](https://a.b/i.png)',
                '| A | B |\n| --- | --- |\n| 1\\|2 | 3 |',
                '\\1. not a list',
                'line\\\nbreak'
            ].join('\n\n')
        );
    });

    it('moves spaces outside emphasis and escapes Markdown characters', () => {
        expect(toEditorMarkdown(n.doc(n.p('a', n.t(' b ', n.bold()), 'c *d* [e]')))).toBe('a **b** c \\*d\\* \\[e\\]');
    });

    it('writes text and counts it', () => {
        expect(toEditorText(n.doc(n.p('a', n.br(), 'b'), n.ul(n.li('c'))))).toBe('a\nb\nc');
        expect(countCharacters(n.doc(n.p('héllo 👍'), n.p('x')))).toBe(8);
        expect(countWords(n.doc(n.p("It's a well-known fact, 42 times."), n.p('Ünïcödé')))).toBe(7);
        expect(countWords(n.doc(n.p('  ')))).toBe(0);
    });
});
